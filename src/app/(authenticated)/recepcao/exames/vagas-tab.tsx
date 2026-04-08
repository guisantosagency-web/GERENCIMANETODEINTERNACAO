"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Calendar as CalendarIcon, Save, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"

const FALLBACK_SLOT_PROCEDURES = [
  "Ultrassom",
  "Ecocardiograma",
  "Tomografia sem Contraste",
  "Tomografia com Contraste",
  "Angiotomografia",
  "Laboratoriais"
]

export default function VagasTab() {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()])
  const [slots, setSlots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const [dynamicProcedures, setDynamicProcedures] = useState<string[]>(FALLBACK_SLOT_PROCEDURES)
  const [newProcedure, setNewProcedure] = useState(FALLBACK_SLOT_PROCEDURES[0])
  const [newTotalSlots, setNewTotalSlots] = useState("")

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
      <div className="glass-card !bg-card/40 border-none rounded-[2.5rem] p-8 max-w-6xl mx-auto shadow-sm">
        <h2 className="text-2xl font-black font-space uppercase tracking-tight mb-8 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><CalendarIcon className="h-6 w-6" /></div>
          Gestão de Vagas Interativa
        </h2>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
           {/* Esquerda: Calendário e Configuração */}
           <div className="space-y-8">
              <div className="grid md:grid-cols-[auto_1fr] gap-8 bg-white/50 p-6 rounded-[2.5rem] border border-border/50">
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">1. Selecione os Dias</Label>
                    <div className="bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                      <Calendar
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={(dates) => dates && setSelectedDates(dates)}
                        className="p-3"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                       <Button variant="ghost" size="sm" onClick={() => setSelectedDates([new Date()])} className="text-[9px] font-black uppercase opacity-60 hover:opacity-100">Resetar Seleção</Button>
                    </div>
                 </div>

                 <div className="flex flex-col gap-6 pt-2">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">2. Detalhes da Vaga</Label>
                      
                      <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Procedimento</Label>
                        <select 
                            value={newProcedure} 
                            onChange={e => setNewProcedure(e.target.value)}
                            className="w-full appearance-none h-12 bg-white border border-border/50 px-5 rounded-2xl text-sm font-black shadow-sm focus:ring-2 focus:ring-amber-500/20 transition-all"
                        >
                          {dynamicProcedures.map((p: any) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Vagas por Dia</Label>
                        <Input type="number" min="0" value={newTotalSlots} onChange={e => setNewTotalSlots(e.target.value)} required placeholder="Ex: 20" className="font-black bg-white text-xl h-14 rounded-2xl text-center border-border/50" />
                      </div>
                    </div>

                    <div className="mt-auto space-y-4">
                       <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">Status: {selectedDates.length} dia(s) selecionados</p>
                       </div>
                       <Button onClick={handleSave} disabled={isLoading || selectedDates.length === 0} className="w-full rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-widest h-16 gap-3 shadow-xl transition-all active:scale-95 group">
                          {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="h-5 w-5 group-hover:scale-110 transition-transform" /> Aplicar em Lote</>}
                       </Button>
                    </div>
                 </div>
              </div>

              {/* Datas Selecionadas (Visual) */}
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Datas na Lista de Aplicação:</Label>
                 <div className="flex flex-wrap gap-2 p-4 bg-muted/10 rounded-2xl border border-dashed border-border/30 min-h-[60px]">
                    {selectedDates.length === 0 && <p className="text-[10px] text-muted-foreground italic font-medium p-2">Clique no calendário para selecionar...</p>}
                    {selectedDates.sort((a,b) => a.getTime() - b.getTime()).map(d => (
                      <div key={d.toISOString()} className="bg-white border border-border/50 text-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 animate-in zoom-in duration-300 shadow-sm">
                        {format(d, 'dd/MM')}
                        <button type="button" onClick={() => setSelectedDates(selectedDates.filter(date => date !== d))} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Direita: Visualização do Dia Focado */}
           <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-border/50 h-full">
                <div className="space-y-6">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Visualizar Configuração Existente</Label>
                    <div className="mt-3 flex items-center justify-between pb-4 border-b border-border/20">
                      <Input type="date" value={format(date, 'yyyy-MM-dd')} onChange={e => setDate(new Date(e.target.value + 'T00:00:00'))} className="bg-white border-none shadow-sm font-black text-xs h-10 w-[160px] rounded-xl" />
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase">{format(date, 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-20 animate-pulse bg-white rounded-3xl" />)}
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="p-12 text-center">
                        <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-loose text-center">Nenhuma vaga restrita<br/>configurada para este dia.</p>
                      </div>
                    ) : (
                      slots.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-6 bg-white rounded-3xl border border-border/30 shadow-sm group hover:border-amber-500/20 transition-all">
                           <div>
                             <p className="font-black text-slate-800 uppercase tracking-tight text-xs">{s.procedure_name}</p>
                             <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-amber-500 text-white rounded-md text-[9px] font-black uppercase">{s.total_slots} VAGAS</span>
                             </div>
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="h-10 w-10 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                             <Trash2 className="h-4 w-4" />
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
    </div>
  )
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}


function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

