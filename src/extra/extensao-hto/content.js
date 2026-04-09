// CONFIGURAÇÕES
const API_URL = "https://dhphlokdzbzewirnuxds.supabase.co/rest/v1/exam_sisreg_import";
const API_KEY = "@averoagency@";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocGhsb2tkemJ6ZXdpcm51eGRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg4ODI2NCwiZXhwIjoyMDgzNDY0MjY0fQ.2lVMW6Hbc2LYLWPFbXBlkVVEZoWrr8uHeOXm5CuhUvs";

// 1. JANELA PRINCIPAL (BOTÃO)
if (window.self === window.top) {
    function injectButton() {
        if (document.getElementById('btn-hto-import')) return;
        const btn = document.createElement('button');
        btn.id = 'btn-hto-import';
        btn.innerHTML = '🚀 IMPORTAR TODAS AS PÁGINAS';
        btn.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            padding: 15px 25px; background-color: #28a745; color: white;
            border: none; border-radius: 50px; cursor: pointer;
            font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-family: sans-serif;
        `;
        btn.onclick = () => {
            if (confirm("Deseja iniciar a importação automática de todas as páginas disponíveis?")) {
                btn.innerHTML = '⏳ IMPORTANDO... NÃO FECHE A ABA';
                btn.style.backgroundColor = '#dc3545';
                btn.disabled = true;
                // Ativa o modo de importação contínua
                chrome.storage.local.set({ "hto_import_state": "active", "hto_trigger": Date.now() });
            }
        };
        document.body.appendChild(btn);
    }

    // Escuta quando o processo termina
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.hto_import_state && changes.hto_import_state.newValue === "finished") {
            const btn = document.getElementById('btn-hto-import');
            btn.innerHTML = '🚀 IMPORTAR TODAS AS PÁGINAS';
            btn.style.backgroundColor = '#28a745';
            btn.disabled = false;
            alert("✅ TODAS AS PÁGINAS FORAM IMPORTADAS COM SUCESSO!");
            chrome.storage.local.set({ "hto_import_state": "idle" });
        }
    });

    injectButton();
    setInterval(injectButton, 3000);
}

// 2. LÓGICA DE EXTRAÇÃO (RODA EM TODAS AS PÁGINAS/FRAMES)
async function runAutoScrape() {
    const state = await chrome.storage.local.get("hto_import_state");
    if (state.hto_import_state !== "active") return;

    const rows = document.querySelectorAll("table.table_listagem tr");
    if (rows.length === 0) return;

    console.log("Extraindo dados desta página...");
    const extracted = [];
    rows.forEach((row, index) => {
        if (index === 0) return;
        const cols = row.querySelectorAll("td");
        if (cols.length >= 6) {
            const procName = cols[5].innerText.trim().toUpperCase();
            
            // IGNORAR CONSULTAS - Filtro solicitado pelo usuário
            if (procName.includes("CONSULTA")) {
                console.log("Ignorando consulta:", procName);
                return;
            }

            extracted.push({
                exam_date: new Date().toISOString().split('T')[0],
                soliciting_unit: cols[1].innerText.trim(),
                cns: cols[2].innerText.trim(),
                patient_name: cols[3].innerText.trim(),
                phone: cols[4].innerText.trim(),
                procedure_name: cols[5].innerText.trim(),
                professional: cols[6] ? cols[6].innerText.trim() : ""
            });
        }
    });

    if (extracted.length > 0) {
        await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'X-HTO-API-KEY': API_KEY,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(extracted)
        });
        console.log(`Página enviada: ${extracted.length} registros.`);
    }

    // Tentar encontrar botão PRÓXIMA
    const nextBtn = Array.from(document.querySelectorAll('a, button, img')).find(el => 
        (el.innerText && el.innerText.includes('Próxima')) || 
        (el.alt && el.alt.includes('Próxima')) ||
        (el.title && el.title.includes('Próxima')) ||
        (el.src && el.src.includes('next'))
    );

    if (nextBtn) {
        console.log("Pulando para a próxima página em 2 segundos...");
        setTimeout(() => {
            nextBtn.click();
        }, 2000);
    } else {
        console.log("Fim das páginas alcançado.");
        chrome.storage.local.set({ "hto_import_state": "finished" });
    }
}

// Executa ao carregar a página se estiver no modo ativo
runAutoScrape();

// Também escuta o trigger inicial
chrome.storage.onChanged.addListener((changes) => {
    if (changes.hto_trigger) runAutoScrape();
});
