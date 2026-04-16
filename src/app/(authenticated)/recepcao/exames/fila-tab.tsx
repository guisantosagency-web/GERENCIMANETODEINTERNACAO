"use client"

import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Play, Users, Search, RefreshCw, Loader2, 
  MapPin, Clock, Calendar, CheckSquare, X,
  AlertCircle, ChevronRight, UserCircle, Printer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format, parseISO, differenceInYears } from "date-fns"

export default function FilaTab() {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<any>({})
  const [allPatients, setAllPatients] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [originsData, setOriginsData] = useState<any>({})
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
  }, [selectedDate])

  async function loadData() {
    try {
      setLoading(true)

      // 1. Carregar origens para mapeamento
      const { data: oData } = await supabase.from('exam_origins').select('*')
      const oMap = (oData || []).reduce((acc: any, curr: any) => {
        acc[curr.id] = curr.name
        return acc
      }, {})
      setOriginsData(oMap)

      // 2. Buscar pacientes que chegaram hoje (reception_arrival ou presentes na fila)
      // Ajuste: Vamos buscar por exam_appointments que tenham status 'presente' ou 'realizando'
      const { data, error } = await supabase
        .from("exam_appointments")
        .select("*")
        .eq("exam_date", selectedDate)
        .in("status", ["presente", "realizando", "finalizado"])
        .order("arrival_time", { ascending: true })

      if (error) throw error

      setAllPatients(data || [])

      // 3. Agrupar por procedimento para visualização em cards
      const groups = (data || []).reduce((acc: any, curr: any) => {
        const cat = curr.procedure_name || "Outros"
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(curr)
        return acc
      }, {})

      setAppointments(groups)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("exam_appointments")
        .update({ status: newStatus })
        .eq("id", id)

      if (error) throw error
      loadData()
    } catch (err) {
      console.error(err)
      alert("Erro ao atualizar status")
    }
  }

  const generateRelatorio = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fila de Atendimento - ${format(parseISO(selectedDate), 'dd/MM/yyyy')}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: sans-serif; color: #000; line-height: 1.4; }
          h1 { text-align: center; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 5mm; }
          .meta { margin-bottom: 10mm; display: flex; justify-content: space-between; font-weight: bold; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10mm; }
          th { background: #f0f0f0; border: 1px solid #000; padding: 3mm; font-size: 9pt; }
          td { border: 1px solid #000; padding: 3mm; font-size: 10pt; }
          .footer { margin-top: 10mm; text-align: center; font-size: 8pt; opacity: 0.5; border-top: 1px solid #ccc; padding-top: 5mm; }
        </style>
      </head>
      <body>
        <h1>Fila de Atendimento Exames</h1>
        <div class="meta">
          <span>DATA: ${format(parseISO(selectedDate), 'dd/MM/yyyy')}</span>
          <span>TOTAL DE PACIENTES: ${allPatients.length}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th width="8%">Horário</th>
              <th width="32%">Paciente</th>
              <th width="15%">Chave SISREG</th>
              <th width="35%">Exames</th>
              <th width="10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${allPatients.sort((a,b) => (a.arrival_time || '').localeCompare(b.arrival_time || '')).map(p => `
              <tr>
                <td style="text-align: center;">${p.arrival_time ? format(new Date(p.arrival_time), 'HH:mm') : '--:--'}</td>
                <td><strong>${p.patient_name}</strong></td>
                <td style="text-align: center; font-weight: bold; color: #666;">${(p.chave_sisreg && !p.chave_sisreg.includes('IMPORT_SISREG')) ? p.chave_sisreg : '--'}</td>
                <td>${p.procedure_name} (${p.exam_type})</td>
                <td style="text-align: center;">${p.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">DESENVOLVIDO POR GUILHERME SANTOS - AVERO AGENCY</div>
      </body>
      </html>
    `
    printWindow.document.write(content)
    printWindow.document.close()
  }

  if (loading) {
     return (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
           <Loader2 className="h-12 w-12 animate-spin text-[#00D9FF]" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00D9FF]/50">Sincronizando Fila...</p>
        </div>
     )
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 relative pb-32">
      {/* HEADER CONTROL TERMINAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-white/5">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-space uppercase tracking-tight text-white flex items-center gap-5">
            <div className="p-4 bg-gradient-to-br from-[#FF6B35] to-[#FF8C00] text-white rounded-3xl shadow-[0_10px_30px_rgba(255,107,53,0.3)]">
              <Play className="h-8 w-8" />
            </div>
            Fila de Realização
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#7E8C9A] ml-24">Terminal de Chamada Operacional</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-5 bg-[#161B22] border border-white/5 p-2 pl-6 rounded-[2rem] shadow-2xl transition-all hover:border-white/10 group">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-[#7E8C9A] uppercase tracking-widest leading-none mb-1">Data de Referência</span>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-black text-white focus:ring-0 p-0 uppercase cursor-pointer"
                />
             </div>
             <div className="h-10 w-[1px] bg-white/5 mx-2" />
             <Button 
              variant="ghost" 
              onClick={() => generateRelatorio()} 
              className="h-14 px-6 rounded-2xl bg-white/[0.03] text-[#00D9FF] hover:bg-[#00D9FF] hover:text-white transition-all duration-500 font-black uppercase text-[10px] tracking-widest gap-3"
             >
               <Printer className="h-5 w-5" />
               Gerar Relatório
             </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {Object.keys(appointments).length === 0 ? (
          <div className="glass-premium rounded-[2.5rem] p-32 flex flex-col items-center justify-center gap-6 opacity-30">
             <div className="p-8 bg-white/5 rounded-full"><Users className="h-16 w-16 text-[#7E8C9A]" /></div>
             <p className="font-black uppercase tracking-[0.5em] text-sm text-[#7E8C9A]">Nenhum paciente em espera para hoje</p>
          </div>
        ) : (
          Object.keys(appointments).map(category => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                  <div className="relative">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <div className="absolute inset-0 h-2 w-2 rounded-full bg-purple-500 ping-subtle" />
                  </div>
                  <h3 className="text-sm font-black font-space text-purple-600 tracking-[0.15em] uppercase">{category}</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-purple-100 to-transparent" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{appointments[category].length} Pac.</span>
              </div>
              
              <div className="glass-premium rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#161B22] font-black uppercase tracking-wider text-[10px] border-b border-white/5 text-[#7E8C9A]">
                    <tr>
                      <th className="p-6 px-10 text-center">Chegada</th>
                      <th className="p-6">Paciente</th>
                      <th className="p-6">Exame / Especificação</th>
                      <th className="p-6 text-center">Idade</th>
                      <th className="p-6 text-center">Status Atendimento</th>
                      <th className="p-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {appointments[category].map((a: any) => {
                      const age = a.birth_date ? differenceInYears(new Date(), parseISO(a.birth_date)) : "--"
                      return (
                        <tr key={a.id} className={`hover:bg-white/[0.02] transition-colors group ${a.status === 'presente' ? '' : a.status === 'finalizado' ? 'opacity-40 grayscale' : 'bg-blue-500/5'}`}>
                          <td className="p-6 px-10 text-center font-black text-white/50">{a.arrival_time ? format(new Date(a.arrival_time), 'HH:mm') : '--:--'}</td>
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-xs shadow-xl ${
                                a.priority !== 'Sem Prioridade' ? 'bg-[#FF6B35] text-white animate-pulse' : 'bg-[#1D232A] text-[#7E8C9A]'
                              }`}>
                                {a.patient_name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-white uppercase text-xs tracking-tight">{a.patient_name}</span>
                                <span className="text-[9px] font-bold text-[#7E8C9A] uppercase tracking-tighter">
                                  {a.priority !== 'Sem Prioridade' ? `PRIORIDADE: ${a.priority}` : 'ATENDIMENTO NORMAL'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                             <div className="flex flex-col">
                                <span className="text-white font-black text-xs uppercase">{a.procedure_name}</span>
                                <span className="text-[9px] font-bold text-[#00D9FF] uppercase tracking-widest">{a.exam_type}</span>
                             </div>
                          </td>
                          <td className="p-6 text-center text-xs font-black text-[#7E8C9A]">{age} anos</td>
                          <td className="p-6 text-center">
                             <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                               a.status === 'presente' ? 'bg-[#FF6B35]/10 text-[#FF6B35]' :
                               a.status === 'realizando' ? 'bg-[#00D9FF]/10 text-[#00D9FF]' :
                               'bg-[#00FF88]/10 text-[#00FF88]'
                             }`}>
                               {a.status}
                             </span>
                          </td>
                          <td className="p-6 text-center">
                            <div className="flex items-center justify-center gap-3">
                              {a.status === 'presente' && (
                                <button
                                  onClick={() => updateStatus(a.id, 'realizando')}
                                  className="h-10 px-4 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#00D9FF]/20"
                                >
                                  Chamada
                                </button>
                              )}
                              {a.status === 'realizando' && (
                                <button
                                  onClick={() => updateStatus(a.id, 'finalizado')}
                                  className="h-10 px-4 bg-[#00FF88] hover:bg-[#00FF88]/80 text-[#0F1419] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#00FF88]/20"
                                >
                                  Finalizar
                                </button>
                              )}
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-[#7E8C9A] hover:bg-white/5 rounded-xl"><Printer className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes ping-subtle {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .ping-subtle {
          animation: ping-subtle 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  )
}
