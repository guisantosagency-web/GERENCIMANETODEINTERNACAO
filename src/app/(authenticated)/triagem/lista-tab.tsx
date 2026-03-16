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
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRef } from "react"

export default function ListaTab() {
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const printRef = useRef<HTMLDivElement>(null)
  const [printingRecord, setPrintingRecord] = useState<any>(null)

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
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Triagem em {format(new Date(record.created_at), 'dd/MM/yyyy HH:mm')}
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
              </div>
              <div className="border-b-2 border-black pb-2">
                <span className="font-bold">Tipagem Sanguínea: </span>{printingRecord.tipagem_sanguinea || '________________'}
              </div>
              <div className="col-span-2">
                <span className="font-bold">Contato: </span>{printingRecord.contato || '________________'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border-black pb-6">
              {Object.entries(printingRecord.checklist_data || {}).map(([key, data]: [string, any]) => (
                <div key={key} className="border-2 border-black p-3 rounded-lg flex flex-col gap-2">
                  <span className="font-bold text-[10px] uppercase">{key.replace('_', ' ')}</span>
                  <div className="flex gap-4 items-center">
                    <span>( {data.sim ? 'X' : ' '} ) SIM</span>
                    <span>( {!data.sim ? 'X' : ' '} ) NÃO</span>
                    <span className="ml-auto">Data: {data.data || '__/__/____'}</span>
                  </div>
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

            <div className="mt-20 flex justify-center gap-20">
              <div className="text-center w-64">
                <div className="border-t-2 border-black pt-2 text-[10px] font-bold uppercase">Responsável pelo Preenchimento</div>
              </div>
               <div className="text-center w-64">
                <div className="border-t-2 border-black pt-2 text-[10px] font-bold uppercase">Assinatura do Paciente</div>
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
    </div>
  )
}
