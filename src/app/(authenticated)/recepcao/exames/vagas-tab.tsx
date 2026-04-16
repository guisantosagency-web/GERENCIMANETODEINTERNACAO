"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Calendar as CalendarIcon, Save, Plus, Search, Trash2, Settings2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { useAuth } from "@/lib/auth-context"
import { ExamManagerModal } from "@/components/exam-manager-modal"

const FALLBACK_SLOT_PROCEDURES = [
  "Ultrassom",
  "Ecocardiograma",
  "Tomografia",
  "Tomografia com Contraste",
  "Laboratoriais",
  "Raio X",
  "Eletrocardiograma"
]

export default function VagasTab() {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()])
  const [slots, setSlots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const [dynamicProcedures, setDynamicProcedures] = useState<string[]>(FALLBACK_SLOT_PROCEDURES)
  const [newProcedure, setNewProcedure] = useState(FALLBACK_SLOT_PROCEDURES[0])
  const [newTotalSlots, setNewTotalSlots] = useState("")
  const [isManagerOpen, setIsManagerOpen] = useState(false)

  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  const loadProcedures = async () => {
    const { data } = await supabase.from("exam_procedures_list").select("name")
    if (data && data.length > 0) {
      const names = data.map((p: any) => p.name)
      const merged = Array.from(new Set([...names, ...FALLBACK_SLOT_PROCEDURES]))
      setDynamicProcedures(merged)
      setNewProcedure(merged[0])
    }
  }

  const loadSlots = async () => {
    setIsLoading(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const { data, error } = await supabase.from("exam_slots").select("*").eq("exam_date", dateStr)
      if (data && !error) {
        setSlots(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProcedures()
  }, [])

  useEffect(() => {
    loadSlots()
  }, [date])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTotalSlots || selectedDates.length === 0) return

    setIsLoading(true)
    try {
      const inserts = selectedDates.map(d => ({
        exam_date: format(d, 'yyyy-MM-dd'),
        procedure_name: newProcedure,
        total_slots: parseInt(newTotalSlots)
      }))

      const { error } = await supabase.from("exam_slots").upsert(inserts, { onConflict: "exam_date,procedure_name" })

      if (error) throw error
      setNewTotalSlots("")
      alert(`Vagas salvas para ${selectedDates.length} dia(s).`)
      loadSlots()
    } catch (e) {
      console.error(e)
      alert("Erro ao salvar vagas.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta configuração de limite?")) return
    try {
      await supabase.from("exam_slots").delete().eq("id", id)
      loadSlots()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-csgo rounded-[2.5rem] p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-space uppercase tracking-tight flex items-center gap-3 text-white">
              <div className="p-3 bg-[#FF6B35]/10 text-[#FF6B35] rounded-xl shadow-lg shadow-[#FF6B35]/10"><CalendarIcon className="h-6 w-6" /></div>
              Limite de Vagas
            </h2>
            <p className="text-[#7E8C9A] text-[10px] font-black uppercase tracking-[0.2em] ml-16 opacity-60">Configuração de Disponibilidade</p>
          </div>
          {isAdmin && (
            <Button 
              type="button"
              onClick={() => setIsManagerOpen(true)}
              variant="outline"
              className="h-12 px-6 rounded-2xl bg-[#161B22] border-white/5 text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl transition-all"
            >
              <Settings2 className="h-4 w-4" />
              Editar Procedimentos
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
           {/* Esquerda: Calendário e Configuração */}
           <div className="space-y-8">
              <div className="grid md:grid-cols-[auto_1fr] gap-8 bg-white/[0.02] p-6 rounded-[2.5rem] border border-white/5 shadow-inner">
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#7E8C9A] ml-2">1. Selecionar Período</Label>
                    <div className="bg-[#161B22] rounded-2xl border border-white/10 overflow-hidden shadow-2xl p-2 premium-calendar">
                      <Calendar
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={(dates) => dates && setSelectedDates(dates)}
                        className="p-3 text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                       <Button variant="ghost" size="sm" onClick={() => setSelectedDates([new Date()])} className="text-[9px] font-black uppercase text-[#7E8C9A] hover:text-white transition-colors">Resetar Seleção</Button>
                    </div>
                 </div>

                 <div className="flex flex-col gap-6 pt-2">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-[#7E8C9A] ml-2">2. Parâmetros Operacionais</Label>
                      
                      <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase text-[#7E8C9A] ml-1">Procedimento Médico</Label>
                        <select 
                            value={newProcedure} 
                            onChange={e => setNewProcedure(e.target.value)}
                            className="w-full appearance-none h-14 bg-[#161B22] border border-white/10 px-6 rounded-2xl text-sm font-black text-white shadow-xl focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]/50 transition-all outline-none"
                        >
                          {dynamicProcedures.map((p: any) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase text-[#7E8C9A] ml-1">Total de Vagas</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          value={newTotalSlots} 
                          onChange={e => setNewTotalSlots(e.target.value)} 
                          required 
                          placeholder="00" 
                          className="font-black bg-[#161B22] text-white text-3xl h-20 rounded-2xl text-center border-white/10 focus:border-[#FF6B35]/50 transition-all" 
                        />
                      </div>
                    </div>

                    <div className="mt-auto space-y-4">
                       <div className="p-4 bg-[#FF6B35]/5 rounded-2xl border border-[#FF6B35]/10 flex items-center justify-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] animate-pulse shadow-[0_0_8px_rgba(255,107,53,0.5)]" />
                          <p className="text-[10px] font-black text-[#FF6B35] uppercase tracking-widest">
                            {selectedDates.length} DIA(S) EM FILA
                          </p>
                       </div>
                       <Button 
                        onClick={handleSave} 
                        disabled={isLoading || selectedDates.length === 0} 
                        className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C00] hover:scale-[1.02] active:scale-[0.98] text-white font-black text-sm uppercase tracking-[0.2em] h-16 gap-3 shadow-xl shadow-[#FF6B35]/20 transition-all duration-500 ease-out disabled:opacity-50"
                       >
                          {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="h-5 w-5" /> Confirmar Aplicação</>}
                       </Button>
                    </div>
                 </div>
              </div>

              {/* Datas Selecionadas (Visual) */}
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-[#7E8C9A] ml-2">Resumo da Seleção:</Label>
                 <div className="flex flex-wrap gap-2 p-5 bg-white/[0.02] rounded-2xl border border-dashed border-white/10 min-h-[70px]">
                    {selectedDates.length === 0 && <p className="text-[10px] text-[#7E8C9A] italic font-bold p-2 uppercase tracking-widest opacity-30 mx-auto mt-2">Nenhum dia selecionado no calendário</p>}
                    {selectedDates.sort((a,b) => a.getTime() - b.getTime()).map(d => (
                      <div key={d.toISOString()} className="bg-[#161B22] border border-white/5 text-white px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-3 animate-in zoom-in duration-300 shadow-lg">
                        <span className="text-[#FF6B35]">{format(d, 'dd/MM')}</span>
                        <div className="w-px h-3 bg-white/10" />
                        <button type="button" onClick={() => setSelectedDates(selectedDates.filter(date => date !== d))} className="text-rose-500 hover:text-rose-400 transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Direita: Visualização do Dia Focado */}
           <div className="space-y-6">
              <div className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 h-full shadow-inner">
                <div className="space-y-8">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#7E8C9A] ml-2">Monitor do Dia</Label>
                    <div className="mt-4 flex items-center justify-between pb-6 border-b border-white/10">
                      <Input 
                        type="date" 
                        value={format(date, 'yyyy-MM-dd')} 
                        onChange={e => setDate(new Date(e.target.value + 'T00:00:00'))} 
                        className="bg-[#161B22] border border-white/5 text-white shadow-xl font-black text-xs h-12 w-[180px] rounded-xl px-4" 
                      />
                      <div className="px-4 py-2 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-[#FF6B35] font-black text-[10px] uppercase tracking-widest">
                        {format(date, 'dd MMM yyyy')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 no-scrollbar">
                    {isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse bg-white/5 rounded-3xl" />)}
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="py-20 text-center flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                          <Search className="h-8 w-8 text-white/10" />
                        </div>
                        <p className="text-[10px] font-black text-[#7E8C9A] uppercase tracking-[0.3em] leading-loose">
                          Padrão Sistêmico Ativo<br/>
                          <span className="text-white/20 mt-2 block">Sem limites manuais</span>
                        </p>
                      </div>
                    ) : (
                      slots.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-6 bg-[#161B22] rounded-[2rem] border border-white/5 shadow-xl group hover:border-[#FF6B35]/40 transition-all duration-500">
                           <div className="space-y-3">
                             <p className="font-black text-white uppercase tracking-tight text-xs font-space">{s.procedure_name}</p>
                             <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-[#FF6B35] text-white rounded-lg text-[9px] font-black uppercase shadow-lg shadow-[#FF6B35]/20">{s.total_slots} VAGAS EM ALVO</span>
                             </div>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => handleDelete(s.id)} 
                             className="h-12 w-12 rounded-2xl text-rose-500/40 hover:bg-rose-500 hover:text-white transition-all duration-300"
                           >
                             <Trash2 className="h-5 w-5" />
                           </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
           </div>
        </div>
      </div>
      <ExamManagerModal 
        isOpen={isManagerOpen} 
        onOpenChange={setIsManagerOpen} 
        onUpdate={loadProcedures} 
      />
    </div>
  )
}



