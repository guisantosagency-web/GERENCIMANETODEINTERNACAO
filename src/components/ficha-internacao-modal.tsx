"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Printer, UserCircle, Loader2 } from "lucide-react"
import type { Patient } from "@/lib/data"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

interface FichaInternacaoModalProps {
  patient: Patient
}

export function FichaInternacaoModal({ patient }: FichaInternacaoModalProps) {
  const [open, setOpen] = useState(false)
  const { logos, receptionists, visitingHours, updatePatient } = useAuth()
  const [selectedReceptionist, setSelectedReceptionist] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fichaId, setFichaId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    mae: patient.mae || "",
    pai: patient.pai || "",
    estadoCivil: patient.estadoCivil || "",
    rg: patient.rg || "",
    sexo: patient.sexo || "",
    telefone: patient.telefone || "",
    municipioNascimento: patient.municipioNascimento || "",
    endereco: patient.endereco || "",
    bairro: patient.bairro || "",
    cep: patient.cep || "",
    responsavelNome: "",
    responsavelCpf: "",
    responsavelEstadoCivil: "",
    responsavelTelefone: "",
    acompanhanteNome: "",
    acompanhanteCpf: "",
    acompanhanteParentesco: "",
  })

  // Carregar dados salvos da ficha
  useEffect(() => {
    if (open && patient.id) {
      loadFichaData()
    }
  }, [open, patient.id])

  const loadFichaData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("fichas_internacao")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (data && !error) {
        setFichaId(data.id)
        setFormData({
          mae: data.mae || patient.mae || "",
          pai: data.pai || patient.pai || "",
          estadoCivil: data.estado_civil || patient.estadoCivil || "",
          rg: data.rg || patient.rg || "",
          sexo: data.sexo || patient.sexo || "",
          telefone: data.telefone || patient.telefone || "",
          municipioNascimento: data.municipio_nascimento || patient.municipioNascimento || "",
          endereco: data.endereco || patient.endereco || "",
          bairro: data.bairro || patient.bairro || "",
          cep: data.cep || patient.cep || "",
          responsavelNome: data.responsavel_nome || "",
          responsavelCpf: data.responsavel_cpf || "",
          responsavelEstadoCivil: data.responsavel_estado_civil || "",
          responsavelTelefone: data.responsavel_telefone || "",
          acompanhanteNome: data.acompanhante_nome || "",
          acompanhanteCpf: data.acompanhante_cpf || "",
          acompanhanteParentesco: data.acompanhante_parentesco || "",
        })
        if (data.recepcionista_nome) {
          const rec = receptionists.find(r => r.name === data.recepcionista_nome)
          if (rec) setSelectedReceptionist(rec.id)
        }
      }
    } catch (err) {
      console.error("Erro ao carregar ficha:", err)
    } finally {
      setLoading(false)
    }
  }

  const saveFichaData = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const recepcionistaNome = selectedReceptionist 
        ? receptionists.find(r => r.id === selectedReceptionist)?.name || ""
        : ""

      const fichaData = {
        patient_id: patient.id,
        mae: formData.mae,
        pai: formData.pai,
        estado_civil: formData.estadoCivil,
        rg: formData.rg,
        sexo: formData.sexo,
        telefone: formData.telefone,
        municipio_nascimento: formData.municipioNascimento,
        endereco: formData.endereco,
        bairro: formData.bairro,
        cep: formData.cep,
        responsavel_nome: formData.responsavelNome,
        responsavel_cpf: formData.responsavelCpf,
        responsavel_estado_civil: formData.responsavelEstadoCivil,
        responsavel_telefone: formData.responsavelTelefone,
        acompanhante_nome: formData.acompanhanteNome,
        acompanhante_cpf: formData.acompanhanteCpf,
        acompanhante_parentesco: formData.acompanhanteParentesco,
        recepcionista_nome: recepcionistaNome,
        updated_at: new Date().toISOString()
      }

      // Sincronizar com o registro do paciente
      await updatePatient({
        ...patient,
        mae: formData.mae,
        pai: formData.pai,
        estadoCivil: formData.estadoCivil,
        rg: formData.rg,
        sexo: formData.sexo,
        telefone: formData.telefone,
        municipioNascimento: formData.municipioNascimento,
        endereco: formData.endereco,
        bairro: formData.bairro,
        cep: formData.cep,
      })

      if (fichaId) {
        await supabase
          .from("fichas_internacao")
          .update(fichaData)
          .eq("id", fichaId)
      } else {
        const { data } = await supabase
          .from("fichas_internacao")
          .insert(fichaData)
          .select("id")
          .single()
        if (data) setFichaId(data.id)
      }
    } catch (err) {
      console.error("Erro ao salvar ficha:", err)
    } finally {
      setSaving(false)
    }
  }

  const ESTADOS_CIVIS = ["SOLTEIRO(A)", "CASADO(A)", "DIVORCIADO(A)", "VIÚVO(A)", "UNIÃO ESTÁVEL"]
  const SEXOS = ["MASCULINO", "FEMININO"]
  const PARENTESCOS = ["PAI", "MÃE", "FILHO(A)", "IRMÃO/IRMÃ", "CÔNJUGE", "OUTROS"]

  const maskCPF = (value: string) => {
    const digits = value.replace(/\D/g, "")
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }

  const maskPhone = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 9)
  }

  const handleInputChange = (field: string, value: string) => {
    let finalValue = value.toUpperCase()
    if (field.toLowerCase().includes("cpf")) finalValue = maskCPF(value)
    if (field === "telefone" || field === "responsavelTelefone") finalValue = maskPhone(value)
    if (field === "cep") finalValue = maskCEP(value)
    
    setFormData(prev => ({ ...prev, [field]: finalValue }))
  }

  const lookupCentralCEP = async (input: string) => {
    if (!input) return

    let city = input.trim()
    let uf = patient.estado || "MA"

    // Extrai MUNICIPIO-UF
    if (city.includes("-")) {
      const parts = city.split("-")
      city = parts[0].trim()
      if (parts[1] && parts[1].trim().length === 2) {
        uf = parts[1].trim().toUpperCase()
      }
    }

    // Remove acentuação (ViaCEP é sensível em alguns casos)
    const normalize = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    const normalizedCity = normalize(city)

    const fetchCEP = async (logradouro: string) => {
      try {
        const url = `https://viacep.com.br/ws/${uf}/${encodeURIComponent(normalizedCity)}/${encodeURIComponent(logradouro)}/json/`
        const response = await fetch(url)
        if (!response.ok) return null

        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          return data[0].cep
        }
      } catch (e) {
        return null
      }
      return null
    }

    try {
      // Tentativa principal: Centro
      let cep = await fetchCEP("Centro")

      // Fallback: nome da cidade
      if (!cep) {
        cep = await fetchCEP(normalizedCity)
      }

      if (cep) {
        setFormData(prev => ({
          ...prev,
          cep
        }))
      }
    } catch (error) {
      console.error("Erro ao buscar CEP central:", error)
    }
  }

    const copiarPacienteParaResponsavel = () => {
      setFormData(prev => ({
        ...prev,
        responsavelNome: patient.paciente,
        responsavelCpf: patient.cpf || "",
        responsavelEstadoCivil: prev.estadoCivil,
        responsavelTelefone: prev.telefone
      }))
    }

    const copiarResponsavelParaAcompanhante = () => {
      setFormData(prev => ({
        ...prev,
        acompanhanteNome: prev.responsavelNome,
        acompanhanteCpf: prev.responsavelCpf
      }))
    }

    const generatePDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const logoSection = `
      <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 12px;">
        <div style="border: 1.5px solid #000; border-radius: 8px; padding: 10px 15px; margin-bottom: 12px; display: flex; justify-content: center; align-items: center; gap: 40px; background-color: #fcfcfc; height: 95px; box-sizing: border-box;">
          ${logos.logo_hto ? `<img src="${logos.logo_hto}" style="height: 100%; width: auto; object-fit: contain;"/>` : ""}
          ${logos.logo_instituto ? `<img src="${logos.logo_instituto}" style="height: 85%; width: auto; object-fit: contain;"/>` : ""}
          ${logos.logo_maranhao ? `<img src="${logos.logo_maranhao}" style="height: 80%; width: auto; object-fit: contain;"/>` : ""}
          ${logos.logo_sus ? `<img src="${logos.logo_sus}" style="height: 80%; width: auto; object-fit: contain;"/>` : ""}
        </div>
        <div style="line-height: 1.2;">
          <h1 style="font-size: 13pt; margin: 0; text-transform: uppercase; font-weight: 900; color: #000;">Hospital de Traumatologia e Ortopedia</h1>
          <p style="margin: 2px 0 0 0; font-size: 13pt; font-weight: 700; color: #000;">Caxias Maranhão | Sistema Único de Saúde SUS</p>
        </div>
      </div>
    `

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha de Internação - ${patient.paciente}</title>
          <style>
            @page { size: A4; margin: 6mm 7mm 5mm 7mm; }
            body { font-family: 'Arial', sans-serif; font-size: 9.2pt; color: #000; line-height: 1.1; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
            
            .title-bar { 
              text-align: left; 
              margin: 10px 0 8px 0; 
              font-size: 13pt; 
              font-weight: 900; 
              text-transform: uppercase; 
              letter-spacing: 0.8px;
              display: flex;
              justify-content: space-between;
            }
            
            .section { margin-bottom: 8px; }
            .section-title { 
              font-weight: 900; 
              border-bottom: 2px solid #000; 
              margin-bottom: 6px; 
              text-transform: uppercase; 
              font-size: 10.5pt; 
              padding-bottom: 2px;
              display: flex;
              align-items: center;
            }
            
            .row { display: flex; margin-bottom: 3px; flex-wrap: wrap; }
            .col { flex: 1; display: flex; align-items: baseline; }
            .label { font-weight: 900; text-transform: uppercase; margin-right: 6px; font-size: 8.5pt; white-space: nowrap; color: #111; }
            .value { font-size: 9.2pt; text-transform: uppercase; font-weight: 500; color: #000; }
            
            .termo-text { font-size: 8.5pt; text-align: justify; line-height: 1.2; margin-top: 8px; font-weight: 500; }
            .termo-intro { font-size: 9.5pt; margin-bottom: 8px; line-height: 1.1; }
            
            .visitas-box { 
              margin: 12px 0; 
              font-size: 8.8pt; 
              line-height: 1.3; 
              padding: 8px 10px;
              border: 1.5px solid #000;
              border-radius: 6px;
              background-color: #fcfcfc;
            }
            .visitas-title { font-weight: 900; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
            
.footer-info { margin-top: 10px; text-align: left; font-weight: 900; font-size: 9pt; text-transform: uppercase; }
              
              .signatures-container { margin-top: 20px; }
              .footer-signs-top { display: flex; justify-content: space-between; text-align: center; gap: 40px; margin-bottom: 35px; }
              .footer-signs-bottom { display: flex; justify-content: center; text-align: center; margin-top: 10px; }
              .sign-box { border-top: 1px solid #000; padding-top: 4px; font-size: 7pt; font-weight: 700; text-transform: uppercase; line-height: 1.2; }
              .sign-box-top { flex: 1; max-width: 45%; }
              .sign-box-bottom { width: 60%; }
            
            .dev-credit {
              position: fixed;
              bottom: 3mm;
              right: 7mm;
                font-size: 8px;
              color: #555;
              font-weight: 600;
              letter-spacing: 0.2px;
            }


          /* Modern subtle touches */
          .section-title::after {
            content: "";
            flex: 1;
            height: 1px;
            background: #ccc;
            margin-left: 12px;
          }
        </style>
      </head>
      <body>
        ${logoSection}
        
        <div class="title-bar">
          <span>FICHA DE INTERNAÇÃO</span>
          <span>DATA: ${patient.data?.split(' ')[0] || ""}</span>
        </div>

        <div class="section">
          <div class="section-title">Dados do Paciente</div>
          <div class="row">
            <div class="col" style="flex: 1;"><span class="label">Prontuário:</span> <span class="value">${patient.prontuario}</span></div>
            <div class="col" style="flex: 2;"><span class="label">CNS:</span> <span class="value">${patient.sus}</span></div>
          </div>
          <div class="row"><span class="label">Paciente:</span> <span class="value" style="font-weight: 900; font-size: 11pt; border-bottom: 1px solid #eee; padding-bottom: 1px; flex: 1;">${patient.paciente}</span></div>
          <div class="row">
            <div class="col"><span class="label">Mãe:</span> <span class="value">${formData.mae || ""}</span></div>
          </div>
          <div class="row">
            <div class="col"><span class="label">Pai:</span> <span class="value">${formData.pai || ""}</span></div>
          </div>
          <div class="row">
            <div class="col"><span class="label">Nascimento:</span> <span class="value">${patient.dataNascimento}</span></div>
            <div class="col"><span class="label">Idade:</span> <span class="value">${patient.idade?.toString().toUpperCase().includes("ANO") ? patient.idade : patient.idade + " ANOS"}</span></div>
            <div class="col"><span class="label">Estado Civil:</span> <span class="value">${formData.estadoCivil}</span></div>
          </div>
          <div class="row">
            <div class="col"><span class="label">RG:</span> <span class="value">${formData.rg}</span></div>
            <div class="col"><span class="label">CPF:</span> <span class="value">${patient.cpf}</span></div>
            <div class="col"><span class="label">Sexo:</span> <span class="value">${formData.sexo}</span></div>
          </div>
          <div class="row">
            <div class="col"><span class="label">Município de Nascimento:</span> <span class="value">${formData.municipioNascimento}</span></div>
          </div>
          <div class="row">
            <div class="col"><span class="label">Telefone:</span> <span class="value">${formData.telefone}</span></div>
          </div>
          <div class="row">
            <div class="col"><span class="label">Endereço:</span> <span class="value">${formData.endereco}</span></div>
          </div>
          <div class="row">
            <div class="col" style="flex: 2;"><span class="label">Município:</span> <span class="value">${patient.cidadeOrigem}</span></div>
            <div class="col" style="flex: 1;"><span class="label">CEP:</span> <span class="value">${formData.cep}</span></div>
            <div class="col" style="flex: 1;"><span class="label">Bairro:</span> <span class="value">${formData.bairro}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Dados do Responsável/Acompanhante</div>
          <div class="row"><span class="label">Acompanhante:</span> <span class="value">${formData.acompanhanteNome}</span></div>
          <div class="row">
            <div class="col"><span class="label">CPF:</span> <span class="value">${formData.acompanhanteCpf}</span></div>
            <div class="col"><span class="label">Grau de Parentesco:</span> <span class="value">${formData.acompanhanteParentesco}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Internação</div>
          <div class="row">
             <div class="col" style="flex: 1;"><span class="label">Procedência:</span> <span class="value">${patient.procedencia}</span></div>
             <div class="col" style="flex: 1;"><span class="label">Especialidade:</span> <span class="value">${patient.procedimento}</span></div>
          </div>
          <div class="row">
            <div class="col"><span class="label">Hora:</span> <span class="value">${patient.horario}</span></div>
            <div class="col"><span class="label">Médico Responsável:</span> <span class="value">${patient.medico}</span></div>
          </div>
          <div class="row">
            <div class="col"><span class="label">Leito:</span> <span class="value">${patient.leito}</span></div>
            <div class="col"><span class="label">Setor:</span> <span class="value">${patient.destino}</span></div>
          </div>
        </div>

        <div class="section" style="margin-bottom: 5px;">
          <div class="section-title">Termo de Responsabilidade</div>
          <div class="termo-intro">
            Pelo presente: <b>${formData.responsavelNome}</b>, CPF: <b>${formData.responsavelCpf}</b>, Estado Civil: <b>${formData.responsavelEstadoCivil || "-"}</b>, Telefone: <b>${formData.responsavelTelefone || "-"}</b>.
          </div>
          <div class="termo-text">
            AUTORIZA O CORPO CLÍNICO DESTA INSTITUIÇÃO PRATICAR TODOS OS ATOS MÉDICOS, TÉCNICOS, TAIS COMO: ATENDIMENTOS, EXAMES, CIRÚRGICOS, MEDICAÇÕES E OUTROS, TUDO QUE SE FIZER NECESSÁRIO PARA ADEQUADO TRATAMENTO HOSPITALAR.
            <br/><br/>
            1. DECLARO ESTAR INFORMADO QUE A INTERNAÇÃO DÁ DIREITO AO LEITO EM ENFERMARIA E QUE O HOSPITAL NÃO AUTORIZA A COBRANÇA DE QUALQUER TAXA OU SERVIÇO NESTES APOSENTOS.
            <br/>
            2. DECLARO EXPRESSAMENTE A FACULDADE DE PEDIR EXONERAÇÃO DA FIANÇA ASSEGURADA NOS ARTIGOS 1.491, PARÁGRAFO ÚNICO; 1500, 1502 E 1503 DO CÓDIGO CIVIL BRASILEIRO.
            <br/>
            3. RESPONSABILIZO-ME PELA RETIRADA DO PACIENTES BEM COMO NO PRAZO MÁXIMO DE 04 (QUATRO) HORAS SUBSEQUENTES À ALTA.
            <br/>
            4. NA OCORRÊNCIA DE SAÍDA PREMATURA FORA DAS HIPÓTESES DE ALTA MÉDICA OU ADMINISTRATIVA, O HOSPITAL FICARÁ ISENTO DE QUALQUER RESPONSABILIDADE PELO MESMO E SEUS ATOS.
            <br/>
            5. DECLARO TER RECEBIDO FOLHETO EXPLICATIVO CONTENDO INFORMAÇÕES SOBRE PERMISSÕES E PROIBIÇÕES, BEM COMO HORÁRIO DE TROCAS DE ACOMPANHANTES E VISITAS.
          </div>
        </div>

        <div class="visitas-box">
          <div class="visitas-title">Horários de Visitas e Informações</div>
          <b>ENFERMARIA:</b> ${visitingHours?.enfermaria || "Não informado"} | <b>UTI:</b> 16h às 17h<br/>
          <b>HORÁRIOS DE TROCAS DE ACOMPANHANTES:</b> 8h às 09h, 19h às 20h
        </div>

        <div class="footer-info">
          CAXIAS-MA, ${patient.data?.split(' ')[0] || new Date().toLocaleDateString("pt-BR")}
        </div>

<div class="signatures-container">
            <div class="footer-signs-top">
              <div class="sign-box sign-box-top">
                ${selectedReceptionist ? receptionists.find(r => r.id === selectedReceptionist)?.name : (patient.recepcionista || "")}<br/>
                ASSINATURA DA RECEPCIONISTA
              </div>
              <div class="sign-box sign-box-top">
                ASSINATURA DO MÉDICO(A)
              </div>
            </div>
            <div class="footer-signs-bottom">
              <div class="sign-box sign-box-bottom">
                ASSINATURA DO PACIENTE/RESPONSÁVEL
              </div>
            </div>
          </div>

        <div class="dev-credit">Desenvolvido por Guilherme Santos - Avero Agency</div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 py-4 border-bottom bg-muted/30 sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Ficha de Internação
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Dados do Paciente */}
          <section className="space-y-4">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm uppercase">Dados do Paciente</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm px-2">
              <div className="flex flex-col"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Prontuário:</span><span className="font-bold">{patient.prontuario}</span></div>
              <div className="flex flex-col"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Cartão SUS:</span><span className="font-bold">{patient.sus}</span></div>
              <div className="flex flex-col"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Paciente:</span><span className="font-bold uppercase">{patient.paciente}</span></div>
              <div className="flex flex-col"><span className="text-muted-foreground font-semibold uppercase text-[10px]">CPF:</span><span className="font-bold">{patient.cpf}</span></div>
              <div className="flex flex-col"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Nascimento:</span><span className="font-bold">{patient.dataNascimento}</span></div>
              <div className="flex flex-col"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Idade:</span><span className="font-bold uppercase">{patient.idade?.toString().toUpperCase().includes("ANO") ? patient.idade : patient.idade + " ANOS"}</span></div>
              <div className="flex flex-col"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Cidade de Origem:</span><span className="font-bold uppercase">{patient.cidadeOrigem}</span></div>
            </div>
          </section>

          {/* Dados Complementares */}
          <section className="space-y-4">
            <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-bold text-sm uppercase">Dados Complementares (preencher antes de imprimir)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">Nome da Mãe</Label><Input placeholder="Nome completo da mãe" value={formData.mae} onChange={(e) => handleInputChange("mae", e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">Nome do Pai</Label><Input placeholder="Nome completo do pai" value={formData.pai} onChange={(e) => handleInputChange("pai", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Estado Civil</Label>
                <Select value={formData.estadoCivil} onValueChange={(v) => handleInputChange("estadoCivil", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{ESTADOS_CIVIS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">RG</Label><Input placeholder="000000000" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Sexo</Label>
                <Select value={formData.sexo} onValueChange={(v) => handleInputChange("sexo", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{SEXOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">Telefone</Label><Input placeholder="(00) 00000-0000" value={formData.telefone} onChange={(e) => handleInputChange("telefone", e.target.value)} /></div>
            </div>
                <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">Município de Nascimento</Label><Input placeholder="EX: CAXIAS-MA" value={formData.municipioNascimento} onChange={(e) => handleInputChange("municipioNascimento", e.target.value)} onBlur={(e) => lookupCentralCEP(e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">Endereço</Label><Input placeholder="Rua, número, complemento" value={formData.endereco} onChange={(e) => handleInputChange("endereco", e.target.value)} /></div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">Bairro</Label><Input placeholder="Nome do bairro" value={formData.bairro} onChange={(e) => handleInputChange("bairro", e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">CEP</Label><Input placeholder="00000-000" value={formData.cep} onChange={(e) => handleInputChange("cep", e.target.value)} /></div>
            </div>
          </section>

          {/* Termo de Responsabilidade */}
          <section className="space-y-4">
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-bold text-sm uppercase flex justify-between items-center">
              Termo de Responsabilidade
              <Button size="sm" variant="outline" onClick={copiarPacienteParaResponsavel} className="h-6 text-[10px] bg-white hover:bg-white/90"><UserCircle className="h-3 w-3 mr-1" /> PACIENTE</Button>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">Nome do Responsável</Label><Input placeholder="Nome completo do responsável legal" value={formData.responsavelNome} onChange={(e) => handleInputChange("responsavelNome", e.target.value)} /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">CPF</Label><Input placeholder="000.000.000-00" value={formData.responsavelCpf} onChange={(e) => handleInputChange("responsavelCpf", e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Estado Civil</Label>
                <Select value={formData.responsavelEstadoCivil} onValueChange={(v) => handleInputChange("responsavelEstadoCivil", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{ESTADOS_CIVIS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">Telefone</Label><Input placeholder="(00) 00000-0000" value={formData.responsavelTelefone} onChange={(e) => handleInputChange("responsavelTelefone", e.target.value)} /></div>
            </div>
          </section>

          {/* Dados do Responsável/Acompanhante */}
          <section className="space-y-4">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm uppercase flex justify-between items-center">
              Dados do Responsável/Acompanhante
              <Button size="sm" variant="outline" onClick={copiarResponsavelParaAcompanhante} className="h-6 text-[10px] bg-white hover:bg-white/90"><UserCircle className="h-3 w-3 mr-1" /> ACOMPANHANTE</Button>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">Nome do Acompanhante</Label><Input placeholder="Nome completo do acompanhante" value={formData.acompanhanteNome} onChange={(e) => handleInputChange("acompanhanteNome", e.target.value)} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase">CPF do Acompanhante</Label><Input placeholder="000.000.000-00" value={formData.acompanhanteCpf} onChange={(e) => handleInputChange("acompanhanteCpf", e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Grau de Parentesco</Label>
                <Select value={formData.acompanhanteParentesco} onValueChange={(v) => handleInputChange("acompanhanteParentesco", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{PARENTESCOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Recepcionista */}
          <section className="space-y-4">
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-bold text-sm uppercase">Recepcionista Responsável pelo Atendimento</div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase">Selecione a Recepcionista *</Label>
              <Select value={selectedReceptionist} onValueChange={setSelectedReceptionist}>
                <SelectTrigger><SelectValue placeholder="Selecione a recepcionista que preencheu esta ficha" /></SelectTrigger>
                <SelectContent>{receptionists.filter(r => r.id).map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </section>

          {/* Dados da Internação */}
          <section className="space-y-4">
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm uppercase">Dados da Internação</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm px-2">
              <div className="flex justify-between border-b border-blue-100 pb-1"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Data:</span><span className="font-bold">{patient.data}</span></div>
              <div className="flex justify-between border-b border-blue-100 pb-1"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Horário:</span><span className="font-bold">{patient.horario}</span></div>
              <div className="flex justify-between border-b border-blue-100 pb-1"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Leito:</span><span className="font-bold uppercase">{patient.leito}</span></div>
              <div className="flex justify-between border-b border-blue-100 pb-1"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Destino/Setor:</span><span className="font-bold uppercase">{patient.destino}</span></div>
              <div className="flex justify-between border-b border-blue-100 pb-1"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Procedência:</span><span className="font-bold uppercase">{patient.procedencia}</span></div>
              <div className="flex justify-between border-b border-blue-100 pb-1"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Médico:</span><span className="font-bold uppercase">{patient.medico}</span></div>
              <div className="flex justify-between border-b border-blue-100 pb-1"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Procedimento:</span><span className="font-bold uppercase">{patient.procedimento}</span></div>
              <div className="flex justify-between border-b border-blue-100 pb-1"><span className="text-muted-foreground font-semibold uppercase text-[10px]">Recepcionista:</span><span className="font-bold uppercase">{patient.recepcionista}</span></div>
            </div>
          </section>
        </div>

<div className="px-6 py-4 bg-muted/30 border-t flex justify-end gap-3 sticky bottom-0 z-10">
            <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
            <Button variant="outline" onClick={saveFichaData} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Dados
            </Button>
            <Button onClick={async () => { await saveFichaData(); generatePDF(); }} className="bg-primary hover:bg-primary/90 text-white gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Imprimir Ficha
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  )
}
