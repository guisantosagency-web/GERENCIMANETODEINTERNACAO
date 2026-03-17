"use client"

import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Search, 
  User, 
  CreditCard, 
  ClipboardList, 
  CheckCircle2, 
  XCircle,
  Calendar,
  Filter,
  RefreshCcw,
  Loader2,
  Printer,
  FileText,
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { format, differenceInYears } from "date-fns"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { useRef } from "react"

export default function ListaTab() {
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const printRef = useRef<HTMLDivElement>(null)
  const [printingRecord, setPrintingRecord] = useState<any>(null)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { logos, user } = useAuth()

  const CHECKLIST_ITEMS = [
    { id: "lab", label: "Exames de Laboratório de Análises Clínicas" },
    { id: "rx", label: "Exames de imagem Radiografia" },
    { id: "risco", label: "Risco Cirúrgico" },
    { id: "tomografia", label: "Tomografia" },
    { id: "hemo", label: "Solicitação de Hemocomponentes" },
    { id: "opme", label: "OPME (Ambulatório)" },
    { id: "vacina", label: "Carteira de Vacinação" },
    { id: "resp", label: "Problemas Respiratórios" },
    { id: "diabetes", label: "Diabetes" },
    { id: "hipertensao", label: "Hipertensos" },
    { id: "medicamentos", label: "Uso de Medicamentos Contínuos" },
    { id: "alergias", label: "Possui Alergias?" },
    { id: "outros", label: "Outros" },
  ]

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("surgery_triage")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (!error) setRecords(data || [])
    setLoading(false)
  }

  const toggleLaunched = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("surgery_triage")
      .update({ is_launched: !currentStatus })
      .eq("id", id)
    
    if (!error) {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, is_launched: !currentStatus } : r))
      toast.success(`Status atualizado para ${!currentStatus ? 'Lançado' : 'Não Lançado'}`)
    }
  }

  const generateFichaPDF = (record: any) => {
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
          <h1 style="font-size: 13pt; margin: 0; text-transform: uppercase; font-weight: 900; color: #000;">Hospital de Traumatologia e Ortopedia - CAXIAS</h1>
          <p style="margin: 2px 0 0 0; font-size: 13pt; font-weight: 700; color: #000;">Checklist Pré-Operatório - Triagem Cirúrgica</p>
        </div>
      </div>
    `

    const checklistContent = CHECKLIST_ITEMS.map((item) => {
      const data = record.checklist_data?.[item.id] || { sim: false, entries: [{ data: "", motivo: "" }] }
      // Adapt for old format or new format
      const entries = data.entries || [{ data: data.data || "", motivo: data.motivo || "" }]
      
      return `
        <div style="margin-bottom: 8px; border: 1.5px solid #000; padding: 10px; border-radius: 6px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 5px;">
            <div style="font-weight: 900; text-transform: uppercase; font-size: 9pt;">${item.label}</div>
            <div style="font-weight: 700; font-size: 9pt;">
              STATUS: [ ${data.sim ? 'X' : '&nbsp;&nbsp;'} ] SIM &nbsp;&nbsp; [ ${!data.sim ? 'X' : '&nbsp;&nbsp;'} ] NÃO
            </div>
          </div>
          ${data.sim ? entries.map((e: any) => `
            <div style="display: flex; gap: 20px; font-size: 8.5pt; margin-top: 4px;">
              <div style="font-weight: 800; min-width: 100px;">DATA: ${e.data ? format(new Date(e.data), 'dd/MM/yyyy') : '___/___/____'}</div>
              <div style="flex: 1;"><span style="font-weight: 800;">MOTIVO/DESCRIÇÃO:</span> ${e.motivo || 'N/A'}</div>
            </div>
          `).join('') : ''}
        </div>
      `
    }).join('')

    const nirContent = `
      <div style="margin-top: 15px; border: 2px solid #000; border-radius: 8px; padding: 15px; page-break-inside: avoid;">
        <div style="text-align: center; font-weight: 900; text-transform: uppercase; font-size: 11pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; letter-spacing: 1px;">
          Núcleo Interno de Regulação - NIR
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 9.5pt;">
          <div style="grid-column: span 2; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: 900; text-transform: uppercase;">Procedência:</span> ${record.nir_data?.procedencia || '________________'}</div>
          <div style="border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: 900; text-transform: uppercase;">Contato:</span> ${record.nir_data?.nome_contato || '________________'}</div>
          <div style="border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: 900; text-transform: uppercase;">Data Cirurgia:</span> ${record.nir_data?.data_cirurgia ? format(new Date(record.nir_data.data_cirurgia), 'dd/MM/yyyy') : '____/____/_______'}</div>
          <div style="grid-column: span 2; border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: 900; text-transform: uppercase;">Procedimento:</span> ${record.nir_data?.procedimento || '________________'}</div>
          <div style="border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: 900; text-transform: uppercase;">Cirurgião:</span> ${record.nir_data?.cirurgiao || '________________'}</div>
          <div style="border-bottom: 1px solid #ccc; padding-bottom: 4px;"><span style="font-weight: 900; text-transform: uppercase;">OPME:</span> ${record.nir_data?.opme_nir || '________________'}</div>
          <div style="grid-column: span 2; border: 1.5px solid #000; padding: 10px; min-height: 80px; margin-top: 10px; border-radius: 4px;">
            <span style="font-weight: 900; text-transform: uppercase; font-size: 8pt; font-style: italic;">Observações da Triagem/NIR:</span><br/>
            <span style="font-size: 9pt;">${record.obs || 'NENHUMA OBSERVAÇÃO REGISTRADA.'}</span>
          </div>
        </div>
      </div>
    `

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Checklist de Triagem - ${record.patient_name}</title>
        <style>
          @page { size: A4; margin: 8mm 10mm; }
          body { font-family: 'Arial', sans-serif; font-size: 9pt; color: #000; line-height: 1.1; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
          .header-info { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; font-weight: 900; text-transform: uppercase; font-size: 10pt; }
          .patient-box { margin-bottom: 15px; border: 2px solid #000; border-radius: 8px; padding: 12px; background-color: #f9f9f9; }
          .row { display: flex; margin-bottom: 5px; }
          .label { font-weight: 900; text-transform: uppercase; min-width: 100px; font-size: 8.5pt; }
          .value { font-weight: 500; font-size: 9.5pt; border-bottom: 1px solid #eee; flex: 1; }
          .footer-section { margin-top: 30px; display: flex; justify-content: space-between; gap: 40px; }
          .sign-box { border-top: 1.5px solid #000; padding-top: 5px; width: 45%; text-align: center; font-weight: 900; text-transform: uppercase; font-size: 7.5pt; line-height: 1.3; }
          .dev-credit { position: fixed; bottom: 5mm; right: 10mm; font-size: 7px; color: #777; font-weight: 700; }
        </style>
      </head>
      <body>
        ${logoSection}
        
        <div class="header-info">
          <span>Prontuário de Triagem Cirúrgica</span>
          <span>DATA: ${format(new Date(record.created_at), 'dd/MM/yyyy')}</span>
        </div>

        <div class="patient-box">
          <div class="row">
            <span class="label">Paciente:</span> <span class="value" style="font-weight: 900; font-size: 11pt;">${record.patient_name}</span>
          </div>
          <div class="row">
            <div style="flex: 1; display: flex;"><span class="label">CPF:</span> <span class="value">${maskCPF(record.cpf)}</span></div>
            <div style="flex: 1; display: flex;"><span class="label">CNS:</span> <span class="value">${record.sus}</span></div>
          </div>
          <div class="row">
            <div style="flex: 1; display: flex;"><span class="label">DN:</span> <span class="value">${record.data_nascimento ? format(new Date(record.data_nascimento), 'dd/MM/yyyy') : '---'}</span></div>
            <div style="flex: 1; display: flex;"><span class="label">Idade:</span> <span class="value">${record.data_nascimento ? differenceInYears(new Date(), new Date(record.data_nascimento)) + ' ANOS' : '---'}</span></div>
          </div>
          <div class="row">
             <div style="flex: 1; display: flex;"><span class="label">Tipagem:</span> <span class="value">${record.tipagem_sanguinea || '---'}</span></div>
             <div style="flex: 1; display: flex;"><span class="label">Contato:</span> <span class="value">${record.contato || '---'}</span></div>
          </div>
        </div>

        ${checklistContent}
        
        ${nirContent}

        <div class="footer-section">
          <div class="sign-box">
             ${record.recepcionista || '________________'}<br/>
             ASSINATURA DO RESPONSÁVEL
          </div>
          <div class="sign-box">
             ASSINATURA DO PACIENTE / RESPONSÁVEL<br/>
             <span style="font-size: 6.5pt; font-weight: 400; normal-case;">Declaro estar ciente das orientações pré-operatórias recebidas.</span>
          </div>
        </div>

        <div class="dev-credit">HTO CAXIAS - SISTEMA DE GERENCIAMENTO DE INTERNAÇÃO - DESENVOLVIDO POR AVERO AGENCY</div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 500)
  }

  const handlePrint = (record: any) => {
    generateFichaPDF(record)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este atendimento? Esta ação não pode ser desfeita.")) return

    const { error } = await supabase
      .from("surgery_triage")
      .delete()
      .eq("id", id)
    
    if (error) {
      toast.error("Erro ao excluir: " + error.message)
    } else {
      setRecords(prev => prev.filter(r => r.id !== id))
      toast.success("Atendimento excluído com sucesso")
    }
  }

  const handleUpdate = async () => {
    if (!editingRecord) return
    setIsUpdating(true)
    
    const { error } = await supabase
      .from("surgery_triage")
      .update({
        patient_name: editingRecord.patient_name.toUpperCase(),
        cpf: editingRecord.cpf.replace(/\D/g, ""),
        sus: editingRecord.sus,
        contato: editingRecord.contato,
        data_nascimento: editingRecord.data_nascimento,
        tipagem_sanguinea: editingRecord.tipagem_sanguinea,
        checklist_data: editingRecord.checklist_data,
        obs: editingRecord.obs
      })
      .eq("id", editingRecord.id)

    if (error) {
      toast.error("Erro ao atualizar: " + error.message)
    } else {
      setRecords(prev => prev.map(r => r.id === editingRecord.id ? editingRecord : r))
      toast.success("Atendimento atualizado com sucesso")
      setEditingRecord(null)
    }
    setIsUpdating(false)
  }

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cpf?.includes(searchTerm) ||
      r.sus?.includes(searchTerm)
    )
  }, [records, searchTerm])

  const maskCPF = (v: string) => {
    if (!v) return ""
    v = v.replace(/\D/g, "")
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-24">
      {/* Search & Header Section - Premium Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 w-full relative group">
          <Input 
            placeholder="BUSCAR PACIENTE POR NOME OU CPF..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-16 h-16 bg-slate-50/50 border-none rounded-[1.8rem] text-sm font-bold uppercase tracking-wide shadow-inner focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-300 transition-all"
          />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
        </div>
        
        <div className="flex items-center gap-6 shrink-0 bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100/50">
          <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div className="pr-6">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registros</p>
            <p className="text-2xl font-black font-space text-slate-800">{filteredRecords.length}</p>
          </div>
        </div>
      </div>

      {/* Modern List View - Premium Cards */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-[2.5rem] animate-pulse" />
          ))
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white p-20 rounded-[4rem] flex flex-col items-center justify-center text-center space-y-6 border border-dashed border-slate-200">
            <div className="p-8 bg-slate-50 rounded-full">
              <Search className="h-12 w-12 text-slate-200" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 uppercase tracking-tight">Nenhum paciente encontrado</p>
              <p className="text-sm font-medium text-slate-400 mt-2">Tente ajustar sua busca ou filtros</p>
            </div>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div key={record.id} className="group bg-white rounded-[2.5rem] p-8 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-500 border border-slate-50 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[4rem] group-hover:bg-emerald-500/10 transition-colors" />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-8">
                  <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black text-white shadow-xl ${record.is_launched ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-300 shadow-slate-300/20'}`}>
                    {record.patient_name[0]}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{record.patient_name}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                        <CreditCard className="h-3 w-3" /> {maskCPF(record.cpf) || record.sus}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> {format(new Date(record.created_at), 'dd/MM/yyyy')}
                      </p>
                      {record.data_nascimento && (
                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black border border-emerald-100">
                          {differenceInYears(new Date(), new Date(record.data_nascimento))} ANOS
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  {/* Status Indicator */}
                  <div className="px-6 py-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${record.is_launched ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`} />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      {record.is_launched ? 'Lançado no Sistema' : 'Aguardando Lançamento'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingRecord(JSON.parse(JSON.stringify(record)))}
                      className="p-4 bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-500/20"
                      title="Editar Atendimento"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handlePrint(record)}
                      className="p-4 bg-slate-50 text-slate-400 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-500/20"
                      title="Imprimir Ficha"
                    >
                      <Printer className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => toggleLaunched(record.id, record.is_launched)}
                      className={`p-4 rounded-2xl transition-all shadow-sm hover:shadow-lg ${record.is_launched ? 'bg-red-50 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-red-500/20' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-600 hover:text-white hover:shadow-emerald-500/20'}`}
                      title={record.is_launched ? 'Marcar como NÃO Lançado' : 'Marcar como LANÇADO'}
                    >
                      {record.is_launched ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                    </button>
                    <button 
                      onClick={() => handleDelete(record.id)}
                      className="p-4 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-lg hover:shadow-red-500/20"
                      title="Excluir Registro"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Hidden Print Content */}
      {printingRecord && (
        <div className="hidden print:block p-8 font-serif" id="print-area">
          <div className="border-4 border-black p-6 space-y-6">
            <div className="text-center border-b-4 border-black pb-4 mb-6">
              <h1 className="text-2xl font-bold uppercase tracking-tighter">AMBULATÓRIO</h1>
              <div className="flex justify-between items-center mt-2 px-4">
                <span className="text-lg font-bold">Checklist para Agendamento de Cirurgia</span>
                <span className="text-lg">Data: ____/____/_______</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm border-b-4 border-black pb-6">
              <div className="col-span-2 border-b-2 border-black pb-2">
                <span className="font-bold">Nome: </span>{printingRecord.patient_name}
              </div>
              <div className="border-b-2 border-black pb-2">
                <span className="font-bold">CPF: </span>{maskCPF(printingRecord.cpf)}
              </div>
              <div className="border-b-2 border-black pb-2">
                <span className="font-bold">CNS: </span>{printingRecord.sus}
              </div>
              <div className="border-b-2 border-black pb-2">
                <span className="font-bold">D/N: </span>{printingRecord.data_nascimento ? format(new Date(printingRecord.data_nascimento), 'dd/MM/yyyy') : '____/____/_______'}
                {printingRecord.data_nascimento && (
                  <span className="ml-2 font-bold">({differenceInYears(new Date(), new Date(printingRecord.data_nascimento))} ANOS)</span>
                )}
              </div>
              <div className="border-b-2 border-black pb-2">
                <span className="font-bold">Tipagem Sanguínea: </span>{printingRecord.tipagem_sanguinea || '________________'}
              </div>
              <div className="col-span-2">
                <span className="font-bold">Contato: </span>{printingRecord.contato || '________________'}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs border-black pb-6">
              {Object.entries(printingRecord.checklist_data || {}).map(([key, data]: [string, any]) => (
                <div key={key} className="border-2 border-black p-3 rounded-lg flex flex-col gap-1">
                  <div className="flex justify-between items-center border-b border-black/10 pb-1">
                    <span className="font-black text-[10px] uppercase">{key.replace('_', ' ')}</span>
                    <div className="flex gap-4 items-center">
                      <span>( {data.sim ? 'X' : ' '} ) SIM</span>
                      <span>( {!data.sim ? 'X' : ' '} ) NÃO</span>
                      <span className="ml-4">Data: {data.data || '__/__/____'}</span>
                    </div>
                  </div>
                  {data.sim && data.motivo && (
                    <div className="text-[10px] italic">
                      <span className="font-bold">Motivo:</span> {data.motivo}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t-4 border-black">
              <h2 className="text-xl font-bold text-center uppercase tracking-widest mb-6">NÚCLEO INTERNO DE REGULAÇÃO - NIR</h2>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="col-span-2 border-b-2 border-black py-2">
                  <span className="font-bold uppercase">Procedência: </span>{printingRecord.nir_data?.procedencia || '________________'}
                </div>
                <div className="border-b-2 border-black py-2">
                  <span className="font-bold uppercase">Nome de Contato: </span>{printingRecord.nir_data?.nome_contato || '________________'}
                </div>
                <div className="border-b-2 border-black py-2">
                  <span className="font-bold uppercase">Data da Cirurgia: </span>{printingRecord.nir_data?.data_cirurgia ? format(new Date(printingRecord.nir_data.data_cirurgia), 'dd/MM/yyyy') : '____/____/_______'}
                </div>
                <div className="col-span-2 border-b-2 border-black py-2">
                  <span className="font-bold uppercase">Procedimento: </span>{printingRecord.nir_data?.procedimento || '________________'}
                </div>
                <div className="border-b-2 border-black py-2">
                  <span className="font-bold uppercase">Cirurgião: </span>{printingRecord.nir_data?.cirurgiao || '________________'}
                </div>
                <div className="border-b-2 border-black py-2">
                  <span className="font-bold uppercase">OPME: </span>{printingRecord.nir_data?.opme_nir || '________________'}
                </div>
                <div className="col-span-2 border-b-2 border-black py-2">
                  <span className="font-bold uppercase">Empresa: </span>{printingRecord.nir_data?.empresa || '________________'}
                </div>
                <div className="col-span-2 border-2 border-black p-4 mt-4 h-32">
                  <span className="font-bold uppercase italic text-xs">Observação: </span>
                  <p className="mt-2">{printingRecord.nir_data?.observacao_nir || printingRecord.obs}</p>
                </div>
              </div>
            </div>

            <div className="mt-16 flex justify-between gap-10 px-4">
              <div className="text-center w-72">
                <div className="border-t-2 border-black pt-2 text-[10px] font-black uppercase">Responsável pelo Preenchimento</div>
              </div>
              <div className="text-center w-[28rem]">
                <div className="border-t-2 border-black pt-2 text-[10px] font-black uppercase leading-tight">
                  Assinatura do Paciente<br/>
                  <span className="text-[8px] font-normal normal-case">Declaro que recebi meus exames e as orientações pré-operatórias</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Edit Modal */}
      <Dialog open={!!editingRecord} onOpenChange={(o) => !o && setEditingRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-10 space-y-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl text-white"><Pencil className="h-6 w-6" /></div>
                Editar Ficha de Triagem
              </DialogTitle>
            </DialogHeader>

            {editingRecord && (
              <div className="space-y-8">
                <div className="flex justify-between items-center bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                  <div className="flex items-center gap-4 text-amber-700">
                    <AlertTriangle className="h-6 w-6" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Atenção</p>
                      <p className="text-sm font-bold">As alterações serão salvas diretamente no banco de dados.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => generateFichaPDF(editingRecord)}
                    variant="outline" 
                    className="h-12 px-6 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-100 gap-2 font-black uppercase text-[10px]"
                  >
                    <Printer className="h-4 w-4" /> Pré-visualizar Impressão
                  </Button>
                </div>
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[2rem]">
                  <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black text-slate-400 ml-4">Nome do Paciente</Label>
                    <Input 
                      value={editingRecord.patient_name}
                      onChange={e => setEditingRecord({...editingRecord, patient_name: e.target.value})}
                      className="h-14 font-bold rounded-2xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black text-slate-400 ml-4">CPF</Label>
                    <Input 
                      value={editingRecord.cpf}
                      onChange={e => setEditingRecord({...editingRecord, cpf: e.target.value})}
                      className="h-14 font-bold rounded-2xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black text-slate-400 ml-4">SUS</Label>
                    <Input 
                      value={editingRecord.sus}
                      onChange={e => setEditingRecord({...editingRecord, sus: e.target.value})}
                      className="h-14 font-bold rounded-2xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black text-slate-400 ml-4">Tipagem Sanguínea</Label>
                    <select 
                      value={editingRecord.tipagem_sanguinea}
                      onChange={e => setEditingRecord({...editingRecord, tipagem_sanguinea: e.target.value})}
                      className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 font-bold"
                    >
                      <option value="">Selecione...</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black text-slate-400 ml-4">Contato</Label>
                    <Input 
                      value={editingRecord.contato}
                      onChange={e => setEditingRecord({...editingRecord, contato: e.target.value})}
                      className="h-14 font-bold rounded-2xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[9px] font-black text-slate-400 ml-4">Data de Nascimento</Label>
                    <div className="relative">
                      <Input 
                        type="date"
                        value={editingRecord.data_nascimento}
                        onChange={e => setEditingRecord({...editingRecord, data_nascimento: e.target.value})}
                        className="h-14 font-bold rounded-2xl border-slate-200 shadow-inner"
                      />
                      {editingRecord.data_nascimento && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase">
                          {differenceInYears(new Date(), new Date(editingRecord.data_nascimento))} anos
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="grid grid-cols-1 gap-4">
                  {CHECKLIST_ITEMS.map((item) => {
                    const data = editingRecord.checklist_data[item.id] || { sim: false, entries: [{ data: "", motivo: "" }] }
                    // Handle transition from old format to new format in modal
                    if (!data.entries) {
                      data.entries = [{ data: data.data || "", motivo: data.motivo || "" }]
                    }

                    return (
                      <div key={item.id} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] space-y-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${data.sim ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                              <ClipboardList className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-black uppercase text-slate-700 tracking-tight">{item.label}</span>
                          </div>
                          <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button 
                              onClick={() => {
                                const newChecklist = { ...editingRecord.checklist_data }
                                newChecklist[item.id] = { ...data, sim: true }
                                setEditingRecord({ ...editingRecord, checklist_data: newChecklist })
                              }}
                              className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${data.sim ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400'}`}
                            >SIM</button>
                            <button 
                              onClick={() => {
                                const newChecklist = { ...editingRecord.checklist_data }
                                newChecklist[item.id] = { ...data, sim: false }
                                setEditingRecord({ ...editingRecord, checklist_data: newChecklist })
                              }}
                              className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${!data.sim ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-slate-400'}`}
                            >NÃO</button>
                          </div>
                        </div>
                        
                        {data.sim && (
                          <div className="space-y-4 pt-4 border-t border-slate-50">
                            {data.entries.map((entry: any, entryIdx: number) => (
                              <div key={entryIdx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-2xl relative group">
                                <div className="md:col-span-4 space-y-1">
                                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Data</Label>
                                  <Input 
                                    type="date"
                                    value={entry.data || ""}
                                    onChange={e => {
                                      const newChecklist = { ...editingRecord.checklist_data }
                                      const newEntries = [...data.entries]
                                      newEntries[entryIdx] = { ...entry, data: e.target.value }
                                      newChecklist[item.id] = { ...data, entries: newEntries }
                                      setEditingRecord({ ...editingRecord, checklist_data: newChecklist })
                                    }}
                                    className="h-12 rounded-xl bg-white border-none shadow-sm font-bold text-xs"
                                  />
                                </div>
                                <div className="md:col-span-7 space-y-1">
                                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Motivo / Descrição</Label>
                                  <Input 
                                    placeholder="Descreva o motivo..."
                                    value={entry.motivo || ""}
                                    onChange={e => {
                                      const newChecklist = { ...editingRecord.checklist_data }
                                      const newEntries = [...data.entries]
                                      newEntries[entryIdx] = { ...entry, motivo: e.target.value }
                                      newChecklist[item.id] = { ...data, entries: newEntries }
                                      setEditingRecord({ ...editingRecord, checklist_data: newChecklist })
                                    }}
                                    className="h-12 rounded-xl bg-white border-none shadow-sm font-bold text-xs"
                                  />
                                </div>
                                <div className="md:col-span-1 flex justify-center pb-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    disabled={data.entries.length <= 1}
                                    onClick={() => {
                                      const newChecklist = { ...editingRecord.checklist_data }
                                      const newEntries = [...data.entries]
                                      newEntries.splice(entryIdx, 1)
                                      newChecklist[item.id] = { ...data, entries: newEntries }
                                      setEditingRecord({ ...editingRecord, checklist_data: newChecklist })
                                    }}
                                    className="h-10 w-10 text-red-300 hover:text-red-500 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                const newChecklist = { ...editingRecord.checklist_data }
                                const newEntries = [...data.entries, { data: "", motivo: "" }]
                                newChecklist[item.id] = { ...data, entries: newEntries }
                                setEditingRecord({ ...editingRecord, checklist_data: newChecklist })
                              }}
                              className="w-full h-12 border-dashed border-2 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-500 font-black uppercase text-[9px] tracking-widest rounded-xl transition-all"
                            >
                              <Plus className="h-4 w-4 mr-2" /> Adicionar Detalhe
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-2">
                  <Label className="uppercase text-[9px] font-black text-slate-400 ml-4">Observações Adicionais</Label>
                  <textarea 
                    value={editingRecord.obs}
                    onChange={e => setEditingRecord({...editingRecord, obs: e.target.value})}
                    className="w-full h-24 p-4 bg-slate-50 border-none rounded-[1.5rem] text-sm resize-none shadow-inner"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-4">
              <Button onClick={() => setEditingRecord(null)} variant="outline" className="h-14 px-8 rounded-2xl font-black uppercase text-xs">Cancelar</Button>
              <Button onClick={handleUpdate} disabled={isUpdating} className="h-14 px-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-500/20">
                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
