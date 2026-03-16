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
  AlertTriangle
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

  const handlePrint = (record: any) => {
    setPrintingRecord(record)
    setTimeout(() => {
      window.print()
      setPrintingRecord(null)
    }, 100)
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search and Filters */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative w-full md:max-w-xl">
          <Input 
            placeholder="BUSCAR POR NOME, CPF OU SUS..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-16 h-16 bg-slate-50 border-none rounded-[1.5rem] font-black uppercase shadow-inner text-sm"
          />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
        </div>
        
        <div className="flex gap-4">
          <Button onClick={fetchRecords} variant="ghost" className="h-16 w-16 rounded-[1.5rem] bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <RefreshCcw className="h-6 w-6" />}
          </Button>
          <div className="h-16 px-8 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20">
            {filteredRecords.length} REGISTROS
          </div>
        </div>
      </div>

      {/* Records Table/List */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Paciente</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Documentos</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-10 py-8"><div className="h-10 bg-slate-100 rounded-2xl w-full" /></td>
                  </tr>
                ))
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-slate-400 font-black uppercase italic italic text-xs tracking-widest">Nenhum atendimento na lista</td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          {record.patient_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-sm leading-tight">{record.patient_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-2">
                            <Calendar className="h-3 w-3" /> Triagem em {format(new Date(record.created_at), 'dd/MM/yyyy')}
                            {record.data_nascimento && (
                              <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md text-[8px] font-black">
                                {differenceInYears(new Date(), new Date(record.data_nascimento))} ANOS
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3 text-emerald-500" />
                          <span className="text-[10px] font-black text-slate-600 uppercase">CPF: {maskCPF(record.cpf)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-3 w-3 text-slate-300" />
                          <span className="text-[10px] font-black text-slate-600 uppercase">SUS: {record.sus || "NÃO INF."}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex justify-center">
                        <div className={`px-5 py-2 rounded-full flex items-center gap-2 border ${record.is_launched ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                          {record.is_launched ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          <span className="text-[10px] font-black uppercase tracking-widest">{record.is_launched ? 'Lançado' : 'Não Lançado'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex justify-end gap-3">
                        <Button 
                          onClick={() => handlePrint(record)}
                          variant="outline"
                          className="rounded-2xl h-12 w-12 p-0 flex items-center justify-center border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all"
                          title="Imprimir Ficha"
                        >
                          <Printer className="h-5 w-5" />
                        </Button>
                        <Button 
                          onClick={() => setEditingRecord(JSON.parse(JSON.stringify(record)))}
                          variant="outline"
                          className="rounded-2xl h-12 w-12 p-0 flex items-center justify-center border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all"
                          title="Editar Ficha"
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(record.id)}
                          variant="outline"
                          className="rounded-2xl h-12 w-12 p-0 flex items-center justify-center border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                          title="Excluir Ficha"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                        <Button 
                          onClick={() => toggleLaunched(record.id, record.is_launched)}
                          className={`rounded-2xl px-6 h-12 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg transition-all ${record.is_launched ? 'bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-600' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'}`}
                        >
                          {record.is_launched ? 'Desfazer Lançamento' : 'Marcar como Lançado'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                  {CHECKLIST_ITEMS.map((item) => (
                    <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-600">{item.label}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingRecord({
                              ...editingRecord, 
                              checklist_data: {
                                ...editingRecord.checklist_data,
                                [item.id]: { ...editingRecord.checklist_data[item.id], sim: true }
                              }
                            })}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${editingRecord.checklist_data[item.id]?.sim ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                          >SIM</button>
                          <button 
                            onClick={() => setEditingRecord({
                              ...editingRecord, 
                              checklist_data: {
                                ...editingRecord.checklist_data,
                                [item.id]: { ...editingRecord.checklist_data[item.id], sim: false }
                              }
                            })}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${!editingRecord.checklist_data[item.id]?.sim ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                          >NÃO</button>
                        </div>
                      </div>
                      
                      {editingRecord.checklist_data[item.id]?.sim && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Data</Label>
                            <Input 
                              type="date"
                              value={editingRecord.checklist_data[item.id]?.data || ""}
                              onChange={e => setEditingRecord({
                                ...editingRecord,
                                checklist_data: {
                                  ...editingRecord.checklist_data,
                                  [item.id]: { ...editingRecord.checklist_data[item.id], data: e.target.value }
                                }
                              })}
                              className="h-10 rounded-xl"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Motivo</Label>
                            {item.id === 'outros' ? (
                              <textarea 
                                value={editingRecord.checklist_data[item.id]?.motivo || ""}
                                onChange={e => setEditingRecord({
                                  ...editingRecord,
                                  checklist_data: {
                                    ...editingRecord.checklist_data,
                                    [item.id]: { ...editingRecord.checklist_data[item.id], motivo: e.target.value }
                                  }
                                })}
                                className="w-full h-10 p-2 rounded-xl border border-slate-200 text-xs resize-none"
                              />
                            ) : (
                              <Input 
                                placeholder="Descreva o motivo..."
                                value={editingRecord.checklist_data[item.id]?.motivo || ""}
                                onChange={e => setEditingRecord({
                                  ...editingRecord,
                                  checklist_data: {
                                    ...editingRecord.checklist_data,
                                    [item.id]: { ...editingRecord.checklist_data[item.id], motivo: e.target.value }
                                  }
                                })}
                                className="h-10 rounded-xl"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
