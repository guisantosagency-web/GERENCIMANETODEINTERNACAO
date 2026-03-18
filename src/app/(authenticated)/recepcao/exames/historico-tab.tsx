"use client"

import { useState, useMemo, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Search, Calendar, User, Activity, FileText, Download, Filter, Loader2, Clock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAuth } from "@/lib/auth-context"

const MONTHS_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default function HistoricoTab() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDay, setSelectedDay] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedProcedure, setSelectedProcedure] = useState("")
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

      if (selectedYear) {
        // We filter manually or via query if possible. 
        // exam_date is 'YYYY-MM-DD'
        query = query.gte("exam_date", `${selectedYear}-01-01`).lte("exam_date", `${selectedYear}-12-31`)
      }

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
  }, [selectedYear])

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      // Search term (Name, CPF, SUS)
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        appt.patient_name.toLowerCase().includes(searchLower) ||
        (appt.cpf && appt.cpf.includes(searchTerm)) ||
        (appt.sus && appt.sus.includes(searchTerm))

      // Date Filters
      const apptDate = parseISO(appt.exam_date)
      const matchesDay = !selectedDay || format(apptDate, 'dd') === selectedDay.padStart(2, '0')
      const matchesMonth = !selectedMonth || (apptDate.getMonth() + 1).toString() === selectedMonth
      
      // Other Filters
      const matchesProcedure = !selectedProcedure || appt.procedure_name === selectedProcedure
      const matchesReceptionist = !selectedReceptionist || appt.receptionist_name === selectedReceptionist

      return matchesSearch && matchesDay && matchesMonth && matchesProcedure && matchesReceptionist
    })
  }, [appointments, searchTerm, selectedDay, selectedMonth, selectedProcedure, selectedReceptionist])

  const procedures = useMemo(() => Array.from(new Set(appointments.map(a => a.procedure_name))), [appointments])
  const receptionists = useMemo(() => Array.from(new Set(appointments.map(a => a.receptionist_name).filter(Boolean))), [appointments])
  const years = useMemo(() => {
    const list = Array.from(new Set(appointments.map(a => a.exam_date.substring(0, 4))))
    if (list.length === 0) list.push(new Date().getFullYear().toString())
    return list.sort().reverse()
  }, [appointments])

  const generateRelatorioPDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const { logos } = user as any || {}
    const logoHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px;">
        <div style="display: flex; gap: 20px; height: 60px;">
          <img src="/logo-hto.png" style="height: 100%;"/>
          <img src="/logo-instituto.png" style="height: 100%;"/>
          <img src="/logo-maranhao.png" style="height: 100%;"/>
          <img src="/logo-sus.png" style="height: 100%;"/>
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
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: sans-serif; color: #000; line-height: 1.4; margin: 0; padding: 0; }
          h1 { font-size: 14pt; font-weight: 900; text-align: center; text-transform: uppercase; margin-bottom: 5mm; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 10mm; font-size: 8.5pt; }
          th { background-color: #f0f0f0; border: 1px solid #000; padding: 2mm; text-transform: uppercase; font-weight: 800; text-align: left; }
          td { border: 1px solid #000; padding: 2mm; text-transform: uppercase; }
          .footer { margin-top: 15mm; border-top: 1px solid #000; padding-top: 5mm; text-align: center; font-size: 8pt; font-weight: bold; opacity: 0.5; }
        </style>
      </head>
      <body>
        ${logoHtml}
        <h1>Relatório de Atendimentos - Exames</h1>
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
                <td>${appt.chave_sisreg || "---"}</td>
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
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
      
      {/* FILTROS PREMIUM */}
      <div className="glass-card !bg-white/40 border-none rounded-[3rem] p-8 lg:p-10 shadow-xl">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg">
                <Clock className="h-6 w-6" />
             </div>
             <div>
                <h2 className="text-3xl font-black font-space uppercase tracking-tight text-slate-800">Histórico de Agendamentos</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consulte e gerencie todos os registros passados</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            <div className="space-y-1.5 xl:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Pesquisa Geral</Label>
              <div className="relative">
                <Input 
                  placeholder="NOME, CPF OU SUS..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white border-slate-100 rounded-2xl text-xs font-black uppercase tracking-tight focus:ring-blue-500/20"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Ano</Label>
              <select 
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full appearance-none h-12 bg-white border border-slate-100 px-4 rounded-2xl text-xs font-black uppercase cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Mês</Label>
              <select 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full appearance-none h-12 bg-white border border-slate-100 px-4 rounded-2xl text-xs font-black uppercase cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">Todos</option>
                {MONTHS_NAMES.map((m, i) => <option key={m} value={(i+1).toString()}>{m}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Procedimento</Label>
              <select 
                value={selectedProcedure} 
                onChange={e => setSelectedProcedure(e.target.value)}
                className="w-full appearance-none h-12 bg-white border border-slate-100 px-4 rounded-2xl text-xs font-black uppercase cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">Todos</option>
                {procedures.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Atendente</Label>
              <select 
                value={selectedReceptionist} 
                onChange={e => setSelectedReceptionist(e.target.value)}
                className="w-full appearance-none h-12 bg-white border border-slate-100 px-4 rounded-2xl text-xs font-black uppercase cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">Todos</option>
                {receptionists.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500/60">Carregando Histórico...</p>
        </div>
      ) : (
        <div className="glass-card bg-white border-none rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Paciente</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Documentos</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Exame</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Data / Hora</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Chave SISREG</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Atendente</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Search className="h-12 w-12" />
                        <p className="font-black uppercase tracking-widest text-sm">Nenhum registro encontrado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(appt => (
                    <tr key={appt.id} onClick={() => setSelectedPatient(appt)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600 text-xs">
                            {appt.patient_name.charAt(0)}
                          </div>
                          <span className="font-black text-slate-700 uppercase text-sm">{appt.patient_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400">CPF: {appt.cpf || "---"}</p>
                          <p className="text-[9px] font-bold text-slate-400">SUS: {appt.sus || "---"}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="font-black text-slate-700 text-xs uppercase">{appt.procedure_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{appt.exam_type}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span className="text-xs font-black uppercase tracking-tighter">
                            {format(parseISO(appt.exam_date), 'dd/MM/yyyy')}
                          </span>
                          <span className="text-xs font-black text-slate-400 ml-2">{appt.exam_time}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full inline-block">
                          {appt.chave_sisreg || "N/A"}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                          {appt.receptionist_name || "SISTEMA"}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          appt.status === 'presente' ? 'bg-emerald-100 text-emerald-600' :
                          appt.status === 'falta' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            appt.status === 'presente' ? 'bg-emerald-500' :
                            appt.status === 'falta' ? 'bg-red-500' :
                            'bg-blue-500'
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
          
          <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Total de registros filtrados: <span className="text-slate-800">{filteredAppointments.length}</span>
            </div>
            <Button variant="ghost" onClick={generateRelatorioPDF} className="rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-white shadow-sm border border-transparent hover:border-slate-100 transition-all">
              <Download className="h-4 w-4" /> Exportar Relatório
            </Button>
          </div>
        </div>
      )}

      {/* PAINEL LATERAL COM DETALHES DO PACIENTE E HISTÓRICO COMPLETO */}
      <Sheet open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <SheetContent side="right" className="min-w-[400px] w-[500px] sm:max-w-[600px] sm:w-[90vw] p-0 border-l border-white/20 bg-slate-50/95 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl">
          <SheetHeader className="p-8 bg-white border-b border-slate-100 shrink-0 relative z-10">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-[1.5rem] bg-blue-100 text-blue-600 flex items-center justify-center font-black text-2xl shadow-inner uppercase">
                {selectedPatient?.patient_name.charAt(0)}
              </div>
              <div>
                <SheetTitle className="text-2xl font-black font-space uppercase tracking-tight text-slate-800">
                  {selectedPatient?.patient_name}
                </SheetTitle>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5"/> Histórico de Exames</span>
                </div>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="glass-card bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Dados do Paciente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CPF</p>
                  <p className="font-bold text-slate-700 text-sm whitespace-nowrap">{selectedPatient?.cpf || "Não Informado"}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cartão SUS</p>
                  <p className="font-bold text-slate-700 text-sm whitespace-nowrap">{selectedPatient?.sus || "Não Informado"}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 col-span-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Chave SISREG</p>
                  <p className="font-black text-purple-600 uppercase text-sm">{selectedPatient?.chave_sisreg || "Não Informado"}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Todos os Agendamentos Cadastrados</h3>
              <div className="space-y-3 relative pl-4 border-l-2 border-slate-200">
                {appointments.filter(a => a.cpf === selectedPatient?.cpf && a.cpf).length > 0 
                  ? appointments.filter(a => a.cpf === selectedPatient?.cpf && a.cpf).map((historyItem, idx) => (
                      <div key={idx} className="relative bg-white p-5 rounded-2xl shadow-sm border border-slate-100 ml-2">
                        <div className="absolute top-8 -left-[27px] w-3 h-3 rounded-full bg-blue-500 border-[3px] border-slate-50 shadow-sm" />
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-black text-slate-700 uppercase">{historyItem.procedure_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{historyItem.exam_type}</p>
                          </div>
                          <span className={`px-2.5 py-1 text-[9px] rounded-full uppercase font-black tracking-widest ${
                            historyItem.status === 'presente' ? 'bg-emerald-100 text-emerald-600' :
                            historyItem.status === 'falta' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {historyItem.status}
                          </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-blue-500"/> {format(parseISO(historyItem.exam_date), 'dd/MM/yyyy')}</span>
                          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-emerald-500"/> {historyItem.exam_time}</span>
                          <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full">{historyItem.receptionist_name || "SISTEMA"}</span>
                        </div>
                      </div>
                    ))
                  : (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 ml-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Nenhum histórico passado encontrado.</p>
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
