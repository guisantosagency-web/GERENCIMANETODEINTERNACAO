"use client"

import { useState, useMemo, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Search, Calendar, User, Activity, FileText, Download, Filter, Loader2, Clock, Trash2, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAuth } from "@/lib/auth-context"

function MultiSelect({ label, options, selected, onChange, icon: Icon }: any) {
  return (
    <div className="space-y-1.5">
      <Label className="uppercase text-[9px] font-bold tracking-widest text-slate-500 ml-2">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full h-12 bg-white border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest justify-between px-4 hover:bg-slate-50 hover:border-teal-300 transition-all shadow-sm text-slate-700">
            <div className="flex items-center gap-3 truncate">
              {Icon && <Icon className="h-4 w-4 text-teal-600" />}
              {selected.length === 0 ? "TODOS" : selected.length === 1 ? selected[0] : `${selected.length} SELECIONADOS`}
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 rounded-xl shadow-lg border-slate-100 bg-white z-50">
          <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
            <button
              onClick={() => onChange([])}
              className="w-full text-left px-4 py-3 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors flex items-center justify-between group text-slate-600 hover:text-slate-800"
            >
              <span>MOSTRAR TODOS</span>
              {selected.length === 0 && <Check className="h-4 w-4 text-teal-600" />}
            </button>
            <div className="h-px bg-slate-100 my-1" />
            {options.map((opt: string) => {
              const isSelected = selected.includes(opt)
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (isSelected) onChange(selected.filter((s: string) => s !== opt))
                    else onChange([...selected, opt])
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-between group ${isSelected ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-800'}`}
                >
                  <span className="truncate pr-4">{opt}</span>
                  {isSelected && <Check className="h-4 w-4 text-teal-600" />}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}


export default function HistoricoTab() {
  const { user, logos } = useAuth()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedReceptionist, setSelectedReceptionist] = useState("")

  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("exam_appointments")
        .select("*")
        .order("exam_date", { ascending: false })
        .order("exam_time", { ascending: false })

      if (startDate) query = query.gte("exam_date", startDate)
      if (endDate) query = query.lte("exam_date", endDate)

      const { data, error } = await query
      if (!error && data) {
        setAppointments(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [startDate, endDate])

  const normalizeProcedureName = (name: string) => {
    if (!name) return "NÃO INFORMADO"
    const n = name.toUpperCase()
    if (n.includes("TOMOGRAFIA")) {
      if (n.includes("COM CONTRASTE")) return "TOMOGRAFIA COM CONTRASTE"
      return "TOMOGRAFIA"
    }
    return n
  }

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm ||
        appt.patient_name.toLowerCase().includes(searchLower) ||
        (appt.cpf && appt.cpf.includes(searchTerm)) ||
        (appt.sus && appt.sus.includes(searchTerm))

      const matchesProcedure = selectedProcedures.length === 0 || selectedProcedures.includes(normalizeProcedureName(appt.procedure_name))
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(appt.exam_type)
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(appt.status)
      const matchesReceptionist = !selectedReceptionist || appt.receptionist_name === selectedReceptionist

      return matchesSearch && matchesProcedure && matchesType && matchesStatus && matchesReceptionist
    })
  }, [appointments, searchTerm, selectedProcedures, selectedTypes, selectedStatuses, selectedReceptionist])

  const groupedProcedures = useMemo(() => {
    const set = new Set<string>()
    appointments.forEach(a => set.add(normalizeProcedureName(a.procedure_name)))
    return Array.from(set).sort()
  }, [appointments])

  const availableTypes = useMemo(() => {
    const filteredByType = selectedProcedures.length === 0
      ? appointments
      : appointments.filter(a => selectedProcedures.includes(normalizeProcedureName(a.procedure_name)))

    return Array.from(new Set(filteredByType.map(a => a.exam_type).filter(Boolean))).sort()
  }, [appointments, selectedProcedures])

  const availableStatuses = useMemo(() => Array.from(new Set(appointments.map(a => a.status).filter(Boolean))), [appointments])
  const receptionists = useMemo(() => Array.from(new Set(appointments.map(a => a.receptionist_name).filter(Boolean))), [appointments])

  const generateRelatorioPDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const logoHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px;">
        <div style="display: flex; gap: 20px; height: 60px;">
          ${logos?.logo_hto ? `<img src="${logos.logo_hto}" style="height: 100%;"/>` : ""}
          ${logos?.logo_instituto ? `<img src="${logos.logo_instituto}" style="height: 100%;"/>` : ""}
          ${logos?.logo_maranhao ? `<img src="${logos.logo_maranhao}" style="height: 100%;"/>` : ""}
          ${logos?.logo_sus ? `<img src="${logos.logo_sus}" style="height: 100%;"/>` : ""}
        </div>
        <div style="text-align: right; font-size: 8pt; font-weight: bold; opacity: 0.6;">
          EMITIDO EM ${format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>
    `

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Atendimentos - Exames</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: sans-serif; color: #000; line-height: 1.4; margin: 0; padding: 0; }
          h1 { font-size: 14pt; font-weight: 900; text-align: center; text-transform: uppercase; margin-bottom: 5mm; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 10mm; font-size: 7.5pt; }
          th { background-color: #f0f0f0; border: 1px solid #000; padding: 1.5mm; text-transform: uppercase; font-weight: 800; text-align: left; }
          td { border: 1px solid #000; padding: 1.5mm; text-transform: uppercase; word-break: break-word; }
          .footer { margin-top: 15mm; border-top: 1px solid #000; padding-top: 5mm; text-align: center; font-size: 8pt; font-weight: bold; opacity: 0.5; }
        </style>
      </head>
      <body>
        ${logoHtml}
        <h1>Relatório de Atendimentos - Exames</h1>
        <p style="text-align: center; font-size: 8pt; margin-bottom: 4mm;">PERÍODO: ${format(parseISO(startDate), 'dd/MM/yyyy')} ATÉ ${format(parseISO(endDate), 'dd/MM/yyyy')}</p>
        <p style="text-align: right; font-size: 8pt; margin-bottom: 2mm;"><strong>TOTAL DE REGISTROS: ${filteredAppointments.length}</strong></p>
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>CPF / SUS</th>
              <th>Chave SISREG</th>
              <th>Procedimento / Exame</th>
              <th>Data / Hora</th>
              <th>Status</th>
              <th>Atendente</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAppointments.map(appt => `
              <tr>
                <td><strong>${appt.patient_name}</strong></td>
                <td>CPF: ${appt.cpf || "---"}<br/>SUS: ${appt.sus || "---"}</td>
                <td>${(appt.chave_sisreg && !appt.chave_sisreg.includes('IMPORT_SISREG')) ? appt.chave_sisreg : "---"}</td>
                <td>${appt.procedure_name}<br/><span style="font-size: 7.5pt; opacity: 0.8;">${appt.exam_type}</span></td>
                <td>${format(parseISO(appt.exam_date), 'dd/MM/yyyy')} ${appt.exam_time}</td>
                <td>${appt.status}</td>
                <td>${appt.receptionist_name || "SISTEMA"}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">DESENVOLVIDO POR GUILHERME SANTOS - AVERO AGENCY</div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `
    printWindow.document.write(content)
    printWindow.document.close()
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative pb-40">
      {/* FILTROS PREMIUM */}
      <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl shadow-sm border border-teal-100">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-space uppercase tracking-tight text-slate-800 leading-tight">Histórico Auditável</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Terminal de Consulta e Relatórios</p>
              </div>
            </div>
            
            <Button 
              onClick={generateRelatorioPDF}
              className="h-12 px-8 rounded-xl bg-teal-500 text-white font-bold uppercase tracking-wider text-[11px] hover:bg-teal-600 transition-all shadow-sm group"
            >
              <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
              Exportar Protocolo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="xl:col-span-4 space-y-2">
              <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Identificação / Busca Geral</Label>
              <div className="relative group">
                <Input
                  placeholder="NOME, CPF OU SUS..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white border-slate-200 rounded-xl text-[11px] font-bold uppercase text-slate-700 transition-all focus:border-teal-400 shadow-sm outline-none"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500" />
              </div>
            </div>

            <div className="xl:col-span-2 space-y-2">
              <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-12 px-4 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase focus:border-teal-400 shadow-sm outline-none"
              />
            </div>

            <div className="xl:col-span-2 space-y-2">
              <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-12 px-4 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase focus:border-teal-400 shadow-sm outline-none"
              />
            </div>

            <div className="xl:col-span-2 space-y-2">
              <Label className="uppercase text-[9px] font-bold tracking-wider text-slate-500 ml-2">Atendente</Label>
              <select
                value={selectedReceptionist}
                onChange={e => setSelectedReceptionist(e.target.value)}
                className="w-full h-12 bg-white border border-slate-200 px-4 rounded-xl text-[10px] font-bold uppercase text-slate-700 shadow-sm focus:border-teal-400 outline-none cursor-pointer"
              >
                <option value="">TODOS</option>
                {receptionists.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="xl:col-span-2 flex items-end">
              <div className="w-full h-12 bg-teal-50 rounded-xl border border-teal-100 flex flex-col items-center justify-center">
                <p className="text-[8px] font-bold text-teal-600/70 uppercase tracking-widest">Registros</p>
                <p className="text-lg font-bold text-teal-700 leading-none">{filteredAppointments.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Carregando Histórico...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Paciente</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Documentos</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Exame</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Data / Hora</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Chave SISREG</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Atendente</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <Search className="h-10 w-10 text-slate-400" />
                        <p className="font-bold uppercase tracking-wider text-xs text-slate-500">Nenhum registro encontrado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(appt => (
                    <tr key={appt.id} onClick={() => setSelectedPatient(appt)} className="hover:bg-slate-50 transition-colors duration-200 cursor-pointer border-b border-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center font-bold text-teal-600 text-xs border border-teal-100">
                            {appt.patient_name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800 uppercase text-sm">{appt.patient_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-500 uppercase">CPF: <span className="text-slate-700">{appt.cpf || "---"}</span></p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">SUS: <span className="text-slate-700">{appt.sus || "---"}</span></p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 text-xs uppercase">{appt.procedure_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{appt.exam_type}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-3 w-3 text-emerald-500" />
                          <span className="text-xs font-bold uppercase tracking-tight">
                            {format(parseISO(appt.exam_date), 'dd/MM/yyyy')}
                          </span>
                          <span className="text-xs font-bold text-slate-400 ml-1">{appt.exam_time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md inline-block border border-purple-100">
                          {(appt.chave_sisreg && !appt.chave_sisreg.includes('IMPORT_SISREG')) ? appt.chave_sisreg : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 shadow-sm px-2.5 py-1 rounded-md">
                          {appt.receptionist_name || "SISTEMA"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${appt.status === 'presente' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            appt.status === 'falta' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              'bg-cyan-50 text-cyan-600 border border-cyan-100'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${appt.status === 'presente' ? 'bg-emerald-500' :
                              appt.status === 'falta' ? 'bg-rose-500' :
                                'bg-cyan-500'
                            }`} />
                          {appt.status}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total de registros filtrados: <span className="text-slate-800">{filteredAppointments.length}</span>
            </div>
            <div className="flex items-center gap-3">
              {(selectedProcedures.length > 0 || selectedStatuses.length > 0 || searchTerm) && (
                <button
                  onClick={() => { setSelectedProcedures([]); setSelectedStatuses([]); setSearchTerm("") }}
                  className="text-[9px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors px-3 py-1.5 bg-rose-50 rounded-md border border-rose-100"
                >
                  LIMPAR FILTROS ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAINEL LATERAL COM DETALHES DO PACIENTE E HISTÓRICO COMPLETO */}
      <Sheet open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <SheetContent side="right" className="min-w-[400px] w-[500px] sm:max-w-[600px] sm:w-[90vw] p-0 border-l border-slate-200 bg-slate-50 overflow-hidden flex flex-col shadow-2xl">
          <SheetHeader className="p-8 bg-white border-b border-slate-100 shrink-0 relative z-10">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center font-bold text-xl uppercase shadow-sm">
                {selectedPatient?.patient_name.charAt(0)}
              </div>
              <div>
                <SheetTitle className="text-xl font-bold font-space uppercase tracking-tight text-slate-800">
                  {selectedPatient?.patient_name}
                </SheetTitle>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-teal-400" /> Histórico de Exames</span>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-50 pb-2">Dados do Paciente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">CPF</p>
                  <p className="font-bold text-slate-700 text-xs whitespace-nowrap">{selectedPatient?.cpf || "Não Informado"}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cartão SUS</p>
                  <p className="font-bold text-slate-700 text-xs whitespace-nowrap">{selectedPatient?.sus || "Não Informado"}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 col-span-2">
                  <p className="text-[9px] font-bold text-purple-400 uppercase tracking-wider mb-1">Chave SISREG</p>
                  <p className="font-bold text-purple-700 uppercase text-xs">{(selectedPatient?.chave_sisreg && !selectedPatient.chave_sisreg.includes('IMPORT_SISREG')) ? selectedPatient.chave_sisreg : "Não Informado"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">Todos os Agendamentos Cadastrados</h3>
              <div className="space-y-3 relative pl-4 border-l-2 border-teal-100">
                {appointments.filter(a => (a.cpf === selectedPatient?.cpf && a.cpf) || (a.sus === selectedPatient?.sus && a.sus)).length > 0
                  ? appointments.filter(a => (a.cpf === selectedPatient?.cpf && a.cpf) || (a.sus === selectedPatient?.sus && a.sus)).map((historyItem, idx) => (
                    <div key={idx} className="relative bg-white p-5 rounded-2xl shadow-sm border border-slate-100 ml-2 hover:border-teal-200 transition-colors">
                      <div className="absolute top-6 -left-[23px] w-3 h-3 rounded-full bg-teal-400 border-[3px] border-slate-50 shadow-sm" />
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800 uppercase">{historyItem.procedure_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{historyItem.exam_type}</p>
                        </div>
                        <span className={`px-2 py-1 text-[8px] rounded-md uppercase font-bold tracking-wider border ${historyItem.status === 'presente' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            historyItem.status === 'falta' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              'bg-cyan-50 text-cyan-600 border-cyan-100'
                          }`}>
                          {historyItem.status}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[9px] font-bold text-slate-500">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-emerald-500" /> {format(parseISO(historyItem.exam_date), 'dd/MM/yyyy')}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-orange-400" /> {historyItem.exam_time}</span>
                        <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">{historyItem.receptionist_name || "SISTEMA"}</span>
                       </div>
                    </div>
                  ))
                  : (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 ml-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Nenhum histórico passado encontrado.</p>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
