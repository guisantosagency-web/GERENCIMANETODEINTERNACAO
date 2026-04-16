"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  Calendar, 
  Filter, 
  ArrowRight, 
  SearchX, 
  CheckCircle,
  XCircle,
  Truck,
  ClipboardCheck,
  PackageCheck,
  UserCheck,
  History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function ResultadosTab() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"todos" | "pendentes" | "entregues">("pendentes")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const loadAppointments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("exam_appointments")
        .select("*")
        .neq("status", "cancelado")
        .order("exam_date", { ascending: false })
      
      if (error) throw error
      if (data) setAppointments(data)
    } catch (err) {
      console.error(err)
      toast.error("Erro ao carregar lista de exames")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const handleDelivery = async (id: string, isDelivered: boolean) => {
    setIsUpdating(id)
    try {
      const { error } = await supabase
        .from("exam_appointments")
        .update({
          result_delivered: isDelivered,
          result_delivered_at: isDelivered ? new Date().toISOString() : null,
          result_delivered_by: isDelivered ? user?.name || "LOGADO" : null
        })
        .eq("id", id)

      if (error) {
        // If it's a missing column error, we might want to try using metadata or inform the user
        if (error.code === "PGRST204" || error.message.includes("column")) {
           toast.error("Erro: A tabela do banco de dados ainda não possui as colunas para controle de entrega.")
           return
        }
        throw error
      }

      setAppointments(prev => prev.map(a => 
        a.id === id ? { 
          ...a, 
          result_delivered: isDelivered, 
          result_delivered_at: isDelivered ? new Date().toISOString() : null,
          result_delivered_by: isDelivered ? user?.name || "LOGADO" : null
        } : a
      ))
      
      toast.success(isDelivered ? "Entrega registrada com sucesso!" : "Registro removido.")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao processar solicitação")
    } finally {
      setIsUpdating(null)
    }
  }

  const filteredData = useMemo(() => {
    return appointments.filter(a => {
      const matchesSearch = 
        a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (a.cpf && a.cpf.includes(searchTerm)) ||
        (a.sus && a.sus.includes(searchTerm))
      
      const matchesFilter = 
        filter === "todos" ? true :
        filter === "pendentes" ? !a.result_delivered :
        a.result_delivered
      
      return matchesSearch && matchesFilter
    })
  }, [appointments, searchTerm, filter])

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pendentes: appointments.filter(a => !a.result_delivered).length,
      entregues: appointments.filter(a => a.result_delivered).length
    }
  }, [appointments])

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative pb-32">
      {/* HUD DASHBOARD SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-csgo p-8 rounded-[3rem] border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
          <div className="relative z-10 flex items-center gap-8">
            <div className="h-20 w-20 bg-[#161B22] border border-white/10 text-[#00D9FF] rounded-[1.8rem] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
              <ClipboardCheck className="h-10 w-10" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7E8C9A] mb-1">Total Scan</p>
              <p className="text-4xl font-black text-white tracking-tighter font-space">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card-csgo p-8 rounded-[3rem] border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#FF6B35]/5 group-hover:bg-[#FF6B35]/10 transition-colors" />
          <div className="relative z-10 flex items-center gap-8">
            <div className="h-20 w-20 bg-[#161B22] border border-white/10 text-[#FF6B35] rounded-[1.8rem] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
              <Clock className="h-10 w-10 animate-pulse text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7E8C9A] mb-1">Queued Results</p>
              <p className="text-4xl font-black text-white tracking-tighter font-space">{stats.pendentes}</p>
            </div>
          </div>
        </div>

        <div className="card-csgo p-8 rounded-[3rem] border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#00FF88]/5 group-hover:bg-[#00FF88]/10 transition-colors" />
          <div className="relative z-10 flex items-center gap-8">
            <div className="h-20 w-20 bg-[#161B22] border border-white/10 text-[#00FF88] rounded-[1.8rem] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
              <UserCheck className="h-10 w-10" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7E8C9A] mb-1">Released Files</p>
              <p className="text-4xl font-black text-white tracking-tighter font-space">{stats.entregues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH COMMAND CENTER */}
      <div className="card-csgo rounded-[4rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-14">
          <div>
            <div className="flex items-center gap-6 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#00D9FF] blur-2xl opacity-20" />
                <div className="p-4 bg-gradient-to-br from-[#00D9FF] to-[#0088FF] text-white rounded-xl shadow-lg relative border border-white/20">
                  <PackageCheck className="h-6 w-6" />
                </div>
              </div>
              <h2 className="text-3xl font-black font-space uppercase tracking-tight text-white leading-tight">Entrega de Resultados</h2>
            </div>
            <p className="text-[#7E8C9A] text-[9px] font-black uppercase tracking-[0.3em] ml-20">PROTOCOLO DE ENTREGA DE RESULTADOS MÉDICOS • MONITORAMENTO ATIVO</p>
          </div>

          <div className="flex items-center gap-3 bg-[#161B22] p-2 rounded-[2rem] border border-white/5">
             {[
               { id: 'todos', label: 'Todos', color: 'text-white' },
               { id: 'pendentes', label: 'Pendentes', color: 'text-[#FF6B35]' },
               { id: 'entregues', label: 'Entregues', color: 'text-[#00FF88]' }
             ].map((t) => (
               <button 
                 key={t.id}
                 onClick={() => setFilter(t.id as any)}
                 className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${filter === t.id ? `bg-white ${t.color.replace('text-', 'text-[#0F1419]')} shadow-2xl scale-105` : 'text-[#7E8C9A] hover:text-white'}`}
               >
                 {t.label}
               </button>
             ))}
          </div>
        </div>

        {/* SEARCH BAR TERMINAL */}
        <div className="relative mb-14 group">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-7 w-7 text-[#7E8C9A] group-focus-within:text-[#00D9FF] transition-all" />
          <Input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="PROCURAR POR NOME DO PACIENTE, CPF OU ID..."
            className="h-16 pl-20 pr-10 text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl bg-[#161B22] border-white/5 shadow-xl text-white placeholder:text-white/10 transition-all focus:border-[#00D9FF]/40"
          />
        </div>

        {/* RESULTS FLOW */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-8 animate-pulse">
              <div className="h-16 w-16 border-[6px] border-[#00D9FF]/20 border-t-[#00D9FF] rounded-full animate-spin shadow-[0_0_30px_rgba(0,217,255,0.2)]" />
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[#7E8C9A]">Acessando Registros...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 opacity-30">
              <div className="w-40 h-40 rounded-[3rem] bg-[#161B22] border border-dashed border-white/10 flex items-center justify-center mb-10 overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#00D9FF]/5 to-transparent rotate-45 animate-pulse" />
                 <SearchX className="h-20 w-20 text-white relative z-10" />
              </div>
              <p className="text-2xl font-black font-space uppercase tracking-[0.2em] text-[#7E8C9A]">Nenhum Resultado Encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredData.map(a => (
                <div 
                  key={a.id} 
                  className={`p-8 lg:p-10 rounded-[4rem] border transition-all duration-700 flex flex-col xl:flex-row xl:items-center justify-between gap-10 group relative overflow-hidden ${a.result_delivered ? 'bg-[#00FF88]/5 border-[#00FF88]/20' : 'card-csgo border-white/5 hover:border-[#00D9FF]/40 shadow-2xl'}`}
                >
                   <div className="absolute top-0 right-0 p-12 opacity-[0.01] group-hover:opacity-[0.05] group-hover:scale-125 transition-all text-white pointer-events-none">
                      <History className="h-64 w-64" />
                   </div>

                  <div className="flex flex-1 items-center gap-10 relative z-10">
                    <div className={`h-24 w-24 rounded-[2.5rem] flex items-center justify-center font-black text-4xl transition-all duration-700 border shadow-2xl shrink-0 ${a.result_delivered ? 'bg-[#00FF88] text-white border-white/20' : 'bg-[#161B22] text-[#7E8C9A] border-white/5 group-hover:text-[#00D9FF] group-hover:border-[#00D9FF]/30'}`}>
                      {a.patient_name.charAt(0)}
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-black text-3xl text-white uppercase tracking-tight group-hover:text-[#00D9FF] transition-colors leading-tight">{a.patient_name}</h4>
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3 px-5 py-2 rounded-2xl bg-[#161B22] border border-white/5">
                          <Calendar className="h-4 w-4 text-[#FF6B35]" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{format(parseISO(a.exam_date), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-2 rounded-2xl bg-[#161B22] border border-white/5">
                          <Truck className="h-4 w-4 text-[#FF1493]" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{a.exam_type}</span>
                        </div>
                        <div className="px-5 py-2 bg-white/[0.03] text-white/50 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest group-hover:text-[#00D9FF] group-hover:border-[#00D9FF]/20 transition-all">
                          {a.procedure_name}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row items-center gap-12 shrink-0 relative z-10">
                    {a.result_delivered && (
                      <div className="flex flex-col items-center lg:items-end animate-in fade-in slide-in-from-right-10 duration-700">
                        <div className="px-6 py-2 bg-[#00FF88]/10 text-[#00FF88] rounded-full mb-3 flex items-center gap-3 border border-[#00FF88]/20 shadow-xl">
                          <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-ping" />
                          <span className="text-[9px] font-black uppercase tracking-[0.1em]">ARQUIVO ENTREGUE</span>
                        </div>
                        <span className="text-[11px] font-black text-white uppercase tracking-wider mb-1">POR: {a.result_delivered_by || "SISTEMA AUTORIZADO"}</span>
                        <span className="text-[9px] font-bold text-[#7E8C9A] uppercase tracking-widest">{format(parseISO(a.result_delivered_at), 'dd/MM/yy • HH:mm')}</span>
                      </div>
                    )}

                    <div className="w-full lg:w-auto">
                      {a.result_delivered ? (
                        <Button 
                          variant="ghost" 
                          disabled={isUpdating === a.id}
                          onClick={() => handleDelivery(a.id, false)}
                          className="h-16 w-full lg:w-48 rounded-[1.5rem] bg-white/5 text-[#7E8C9A] hover:bg-[#FF1493] hover:text-white transition-all duration-500 font-black uppercase text-[10px] tracking-widest gap-4 border border-white/5"
                        >
                          {isUpdating === a.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5" />}
                          Desfazer
                        </Button>
                      ) : (
                        <Button 
                          disabled={isUpdating === a.id}
                          onClick={() => handleDelivery(a.id, true)}
                          className="h-16 w-full lg:w-auto px-10 rounded-2xl bg-white text-[#0F1419] hover:bg-[#00D9FF] hover:text-white transition-all duration-500 font-black uppercase text-[11px] tracking-[0.1em] shadow-xl gap-4 group/btn"
                        >
                          {isUpdating === a.id ? <Loader2 className="h-6 w-6 animate-spin text-[#00D9FF]" /> : <CheckCircle2 className="h-6 w-6 group-hover:scale-125 transition-transform" />}
                          Entregar Resultado
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-3 transition-transform duration-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

