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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="h-14 w-14 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center">
            <ClipboardCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Geral</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.total}</p>
          </div>
        </div>
        <div className="glass-card bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="h-14 w-14 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aguardando Entrega</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.pendentes}</p>
          </div>
        </div>
        <div className="glass-card bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="h-14 w-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
            <UserCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resultados Entregues</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.entregues}</p>
          </div>
        </div>
      </div>

      <div className="glass-card bg-white/40 border-none rounded-[3.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div>
            <h2 className="text-4xl font-black font-space uppercase tracking-tight text-slate-800 flex items-center gap-4">
               <div className="p-4 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-500/20"><PackageCheck className="h-8 w-8" /></div>
               Entrega de Resultados
            </h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-3 ml-20">Controle e Registro de Retirada de Exames</p>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
               <button 
                 onClick={() => setFilter("todos")}
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'todos' ? 'bg-white text-slate-800 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Todos
               </button>
               <button 
                 onClick={() => setFilter("pendentes")}
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pendentes' ? 'bg-white text-amber-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Pendentes
               </button>
               <button 
                 onClick={() => setFilter("entregues")}
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'entregues' ? 'bg-white text-emerald-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Entregues
               </button>
             </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
          <Input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="PESQUISAR PACIENTE POR NOME OU CPF..."
            className="h-20 pl-16 pr-8 text-xl font-black uppercase rounded-3xl bg-slate-50 border-none shadow-inner tracking-tight placeholder:text-slate-300"
          />
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-10 w-10 border-4 border-purple-500/30 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Consultando Registros...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <SearchX className="h-24 w-24 text-slate-400 mb-6 stroke-[1px]" />
              <p className="text-xl font-black font-space uppercase tracking-widest text-slate-400">Nenhum resultado encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredData.map(a => (
                <div 
                  key={a.id} 
                  className={`group p-6 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-6 ${a.result_delivered ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50' : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-xl hover:-translate-y-1'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`h-16 w-16 rounded-3xl flex items-center justify-center font-black text-2xl transition-all duration-500 ${a.result_delivered ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-purple-100 group-hover:text-purple-600'}`}>
                      {a.patient_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-slate-800 uppercase tracking-tight">{a.patient_name}</h4>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" /> {format(parseISO(a.exam_date), 'dd/MM/yyyy')}
                        </span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {a.procedure_name}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {a.exam_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                    {a.result_delivered && (
                      <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-4 duration-500">
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded-full mb-1 flex items-center gap-1">
                          <CheckCircle className="h-2 w-2" /> Entregue
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Por: {a.result_delivered_by}</span>
                        <span className="text-[8px] font-medium text-slate-300 italic">{format(parseISO(a.result_delivered_at), 'dd/MM/yy HH:mm')}</span>
                      </div>
                    )}

                    <div className="w-full md:w-auto">
                      {a.result_delivered ? (
                        <Button 
                          variant="ghost" 
                          disabled={isUpdating === a.id}
                          onClick={() => handleDelivery(a.id, false)}
                          className="h-14 w-full md:w-auto px-8 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-500 font-black uppercase text-[10px] tracking-widest gap-2"
                        >
                          {isUpdating === a.id ? <div className="h-4 w-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Cancelar Entrega
                        </Button>
                      ) : (
                        <Button 
                          disabled={isUpdating === a.id}
                          onClick={() => handleDelivery(a.id, true)}
                          className="h-14 w-full md:w-auto px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 gap-3 group/btn"
                        >
                          {isUpdating === a.id ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                          Registrar Entrega
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
