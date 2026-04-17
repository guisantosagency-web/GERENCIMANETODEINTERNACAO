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
  History,
  Loader2
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
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-50 group-hover:bg-blue-100/50 transition-colors opacity-50" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="h-16 w-16 bg-blue-50 text-blue-500 border border-blue-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-500">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Analisado</p>
              <p className="text-3xl font-bold text-slate-800 tracking-tight font-space">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute inset-0 bg-orange-50 group-hover:bg-orange-100/50 transition-colors opacity-50" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="h-16 w-16 bg-orange-50 text-orange-500 border border-orange-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-500">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Fila de Espera</p>
              <p className="text-3xl font-bold text-slate-800 tracking-tight font-space">{stats.pendentes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute inset-0 bg-teal-50 group-hover:bg-teal-100/50 transition-colors opacity-50" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="h-16 w-16 bg-teal-50 text-teal-500 border border-teal-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-500">
              <UserCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Resultados Liberados</p>
              <p className="text-3xl font-bold text-slate-800 tracking-tight font-space">{stats.entregues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH COMMAND CENTER */}
      <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shadow-sm border border-teal-100">
                <PackageCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold font-space uppercase tracking-tight text-slate-800 leading-tight">Entrega de Resultados</h2>
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider ml-14">Protocolo Ativo • Área de Recepção</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
             {[
               { id: 'todos', label: 'Todos', activeColor: 'text-slate-800 bg-white shadow-sm' },
               { id: 'pendentes', label: 'Aguardando', activeColor: 'text-orange-600 bg-white shadow-sm' },
               { id: 'entregues', label: 'Concluídos', activeColor: 'text-teal-600 bg-white shadow-sm' }
             ].map((t) => (
               <button 
                 key={t.id}
                 onClick={() => setFilter(t.id as any)}
                 className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${filter === t.id ? t.activeColor : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
               >
                 {t.label}
               </button>
             ))}
          </div>
        </div>

        {/* SEARCH BAR TERMINAL */}
        <div className="relative mb-10 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-teal-500 transition-all" />
          <Input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="PROCURAR POR NOME DO PACIENTE, CPF OU ID..."
            className="h-14 pl-16 pr-6 text-[11px] font-bold uppercase tracking-wider rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all outline-none"
          />
        </div>

        {/* RESULTS FLOW */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <Loader2 className="h-12 w-12 text-teal-500 animate-spin" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Verificando arquivos...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
                 <SearchX className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-lg font-bold font-space uppercase tracking-wider text-slate-500">A Busca Não Retornou Resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredData.map(a => (
                <div 
                  key={a.id} 
                  className={`p-6 lg:p-8 rounded-3xl border transition-all duration-300 flex flex-col xl:flex-row xl:items-center justify-between gap-8 group/card relative overflow-hidden ${a.result_delivered ? 'bg-teal-50/50 border-teal-100 shadow-sm' : 'bg-white border-slate-200 hover:border-teal-300 shadow-sm hover:shadow-md'}`}
                >
                   <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover/card:opacity-[0.04] group-hover/card:scale-110 transition-transform duration-700 pointer-events-none">
                      <History className="h-40 w-40 text-slate-800" />
                   </div>

                  <div className="flex flex-1 items-center gap-6 relative z-10">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-2xl transition-colors border shrink-0 ${a.result_delivered ? 'bg-teal-500 text-white border-teal-600' : 'bg-slate-50 text-slate-400 border-slate-200 group-hover/card:text-teal-500 group-hover/card:bg-teal-50 group-hover/card:border-teal-200'}`}>
                      {a.patient_name.charAt(0)}
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-lg text-slate-800 uppercase tracking-tight group-hover/card:text-teal-600 transition-colors leading-tight truncate max-w-[300px] md:max-w-full">{a.patient_name}</h4>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                          <Calendar className="h-3 w-3 text-cyan-500" />
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{format(parseISO(a.exam_date), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                          <Truck className="h-3 w-3 text-orange-400" />
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{a.exam_type}</span>
                        </div>
                        <div className="px-3 py-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-[9px] font-bold uppercase tracking-wider group-hover/card:text-teal-600 group-hover/card:border-teal-200 group-hover/card:bg-teal-50 transition-colors">
                          {a.procedure_name}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center gap-6 shrink-0 relative z-10">
                    {a.result_delivered && (
                      <div className="flex flex-col items-start lg:items-end bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="px-3 py-1.5 bg-teal-50 text-teal-600 rounded-md mb-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Arquivo Entregue</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-700 uppercase mb-0.5">Por: {a.result_delivered_by || "AUTORIZADO"}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{format(parseISO(a.result_delivered_at), 'dd/MM/yy • HH:mm')}</span>
                      </div>
                    )}

                    <div className="w-full lg:w-max">
                      {a.result_delivered ? (
                        <Button 
                          variant="ghost" 
                          disabled={isUpdating === a.id}
                          onClick={() => handleDelivery(a.id, false)}
                          className="h-12 w-full lg:w-40 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all font-bold uppercase text-[10px] tracking-wider gap-2 border border-slate-200 shadow-sm"
                        >
                          {isUpdating === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Desfazer
                        </Button>
                      ) : (
                        <Button 
                          disabled={isUpdating === a.id}
                          onClick={() => handleDelivery(a.id, true)}
                          className="h-12 w-full lg:w-auto px-6 rounded-xl bg-teal-500 hover:bg-teal-600 text-white transition-all font-bold uppercase text-[11px] tracking-wider shadow-sm gap-3 group/btn focus:ring-2 focus:ring-teal-200"
                        >
                          {isUpdating === a.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />}
                          Confirmar Entrega
                          <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1.5 transition-transform" />
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
