import time
import logging
import datetime
import os
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from supabase import create_client, Client

# Carrega variáveis do arquivo .env.local na raiz do projeto
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env.local"))

# --- CONFIGURAÇÕES ---
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SISREG_URL = "https://sisregiii.saude.gov.br/"

# LOGS
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("sisreg_automation.log"), logging.StreamHandler()]
)

class SisregRobot:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.driver = None

    def init_driver(self):
        chrome_options = Options()
        # chrome_options.add_argument("--headless") # Descomente para rodar sem ver a janela
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        self.driver.maximize_window()

    def wait_for_login(self):
        logging.info("Aguardando login manual no SISREG (você tem 2 minutos)...")
        self.driver.get(SISREG_URL)
        # Espera até que um elemento que só aparece após o login esteja presente 
        # (ex: o menu principal ou o nome do usuário)
        try:
            WebDriverWait(self.driver, 120).until(
                EC.presence_of_element_located((By.LINK_TEXT, "CONSULTA GERAL"))
            )
            logging.info("Login detectado com sucesso!")
            return True
        except:
            logging.error("Tempo de login expirado ou erro na navegação.")
            return False

    def scrape_date(self, target_date_str):
        logging.info(f"Iniciando captura para a data: {target_date_str}")
        try:
            # 1. Navegar para a página de Prontuários a Receber 
            # (Ajuste o caminho conforme o menu real do SISREG)
            # Exemplo: Consulta -> Ambulatorial -> Prontuários a Receber
            self.driver.find_element(By.LINK_TEXT, "CONSULTA GERAL").click()
            time.sleep(1)
            # Adicione aqui os cliques necessários para chegar na tela da imagem
            
            # 2. Preencher a data e clicar em Consultar
            # Seletores baseados no print enviado
            input_date = self.driver.find_element(By.NAME, "periodo_inicio") # Exemplo de nome
            input_date.clear()
            input_date.send_keys(target_date_str)
            
            self.driver.find_element(By.NAME, "btn_consultar").click()
            time.sleep(3)

            # 3. Extrair dados da tabela
            rows = self.driver.find_elements(By.CSS_SELECTOR, "table.table_listagem tr")
            extracted_data = []

            for row in rows[1:]: # Pula o cabeçalho
                cols = row.find_elements(By.TAG_NAME, "td")
                if len(cols) >= 6:
                    data = {
                        "exam_date": target_date_str, # ou cols[0].text
                        "soliciting_unit": cols[1].text,
                        "cns": cols[2].text,
                        "patient_name": cols[3].text,
                        "phone": cols[4].text,
                        "procedure_name": cols[5].text,
                        "professional": cols[6].text if len(cols) > 6 else ""
                    }
                    extracted_data.append(data)
            
            return extracted_data
        except Exception as e:
            logging.error(f"Erro durante o scraping: {e}")
            return None

    def save_to_supabase(self, data, job_id):
        if not data: return
        
        logging.info(f"Enviando {len(data)} registros para o Supabase...")
        for item in data:
            item["job_id"] = job_id
            
            # 1. Garantir que o procedimento existe na lista do HTO
            # O sistema vai criar se não existir conforme pedido do usuário
            try:
                self.supabase.table("exam_procedures_list").upsert({"name": item["procedure_name"]}, on_conflict="name").execute()
            except: pass

            # 2. Inserir na tabela de importação
            try:
                self.supabase.table("exam_sisreg_import").upsert(item, on_conflict="exam_date,cns,procedure_name").execute()
            except Exception as e:
                logging.warning(f"Erro ao inserir item {item['cns']}: {e}")

    def run(self):
        logging.info("HTO Robot Iniciado - Monitorando Pedidos de Sincronização...")
        self.init_driver()
        
        if not self.wait_for_login():
            return

        while True:
            try:
                # Busca por jobs pendentes
                response = self.supabase.table("exam_sisreg_sync_jobs").select("*").eq("status", "pending").limit(1).execute()
                jobs = response.data

                if jobs:
                    job = jobs[0]
                    logging.info(f"Job encontrado para a data {job['target_date']}. Iniciando...")
                    
                    self.supabase.table("exam_sisreg_sync_jobs").update({"status": "processing"}).eq("id", job["id"]).execute()
                    
                    results = self.scrape_date(job["target_date"])
                    
                    if results is not None:
                        self.save_to_supabase(results, job["id"])
                        self.supabase.table("exam_sisreg_sync_jobs").update({"status": "completed"}).eq("id", job["id"]).execute()
                        logging.info("Sincronização concluída com sucesso!")
                    else:
                        self.supabase.table("exam_sisreg_sync_jobs").update({
                            "status": "failed", 
                            "error_message": "Erro ao ler a tabela do SISREG"
                        }).eq("id", job["id"]).execute()

                time.sleep(10) # Verifica a cada 10 segundos
            except KeyboardInterrupt:
                logging.info("Robô encerrado pelo usuário.")
                break
            except Exception as e:
                logging.error(f"Erro no loop principal: {e}")
                time.sleep(30)

if __name__ == "__main__":
    robot = SisregRobot()
    robot.run()
