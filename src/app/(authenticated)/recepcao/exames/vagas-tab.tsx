"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Calendar, Save, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

const FALLBACK_SLOT_PROCEDURES = [
  "Ultrassom",
  "Ecocardiograma",
  "Tomografia sem Contraste",
  "Tomografia com Contraste",
  "Angiotomografia",
  "Laboratoriais"
]

export default function VagasTab() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedDates, setSelectedDates] = useState<string[]>([format(new Date(), 'yyyy-MM-dd')])
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
      // Garantir que os novos tipos estejam na lista se não vierem do banco
      const merged = Array.from(new Set([...names, ...FALLBACK_SLOT_PROCEDURES]))
      setDynamicProcedures(merged)
      setNewProcedure(merged[0])
    }
  }

  const loadSlots = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("exam_slots").select("*").eq("exam_date", date)
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
        exam_date: d,
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

  const toggleDate = (d: string) => {
    if (selectedDates.includes(d)) {
      if (selectedDates.length > 1) {
        setSelectedDates(selectedDates.filter(date => date !== d))
      }
    } else {
      setSelectedDates([...selectedDates, d].sort())
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card !bg-card/40 border-none rounded-[2.5rem] p-8 max-w-5xl mx-auto shadow-sm">
        <h2 className="text-2xl font-black font-space uppercase tracking-tight mb-6 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Calendar className="h-6 w-6" /></div>
          Gestão de Vagas por Período
        </h2>

        <div className="grid md:grid-cols-2 gap-10">
           {/* Formulário */}
           <form onSubmit={handleSave} className="space-y-6 bg-muted/20 p-8 rounded-[2rem] border border-border/20">
             <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Selecionar Datas Aplicáveis</Label>
               
               <div className="flex gap-2">
                 <Input type="date" value={date} onChange={e => {
                   setDate(e.target.value)
                   // Se não houver datas selecionadas ou se quiser adicionar a nova data à lista
                 }} className="font-bold bg-background h-12 rounded-xl" />
                 <Button type="button" onClick={() => toggleDate(date)} className="h-12 rounded-xl bg-slate-800 text-white font-bold gap-2">
                    <Plus className="h-4 w-4" /> Adicionar
                 </Button>
               </div>

               <div className="flex flex-wrap gap-2 min-h-[48px] p-4 bg-background/50 rounded-2xl border border-dashed border-border/50">
                  {selectedDates.length === 0 && <p className="text-[10px] text-muted-foreground font-bold italic">Nenhuma data selecionada</p>}
                  {selectedDates.map(d => (
                    <div key={d} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 animate-in zoom-in duration-300">
                      {format(new Date(d + 'T00:00:00'), 'dd/MM')}
                      <button type="button" onClick={() => toggleDate(d)} className="hover:scale-110 transition-transform"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
               </div>
             </div>

             <div className="space-y-4">
                <div className="space-y-2 relative">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Procedimento Alvo</Label>
                  <select 
                      value={newProcedure} 
                      onChange={e => setNewProcedure(e.target.value)}
                      className="w-full appearance-none h-14 bg-background border border-border px-5 rounded-2xl text-sm font-black shadow-sm focus:ring-2 focus:ring-amber-500/20"
                  >
                    {dynamicProcedures.map((p: any) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Vagas (Por Dia Selecionado)</Label>
                  <Input type="number" min="0" value={newTotalSlots} onChange={e => setNewTotalSlots(e.target.value)} required placeholder="Ex: 20" className="font-black bg-background text-xl h-14 rounded-2xl text-center" />
                </div>
             </div>

             <Button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm uppercase tracking-widest h-16 mt-4 gap-3 shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="h-5 w-5" /> Aplicar Vagas em Lote</>}
             </Button>
           </form>

           {/* Lista do Dia Selecionado */}
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Configurado para: <span className="text-amber-600">{format(new Date(date + 'T00:00:00'), 'dd/MM/yyyy')}</span></h3>
              </div>
              
              <div className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="h-20 animate-pulse bg-muted rounded-2xl" />
                    <div className="h-20 animate-pulse bg-muted rounded-2xl" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-10 text-center bg-muted/10 rounded-[2.5rem] border border-dashed border-border/50">
                    <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nenhuma restrição encontrada para este dia.</p>
                  </div>
                ) : (
                  slots.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-6 bg-background rounded-3xl border border-border/50 shadow-sm group hover:border-amber-500/20 transition-all">
                       <div>
                         <p className="font-black text-slate-800 uppercase tracking-tight">{s.procedure_name}</p>
                         <div className="flex items-center gap-3 mt-1.5">
                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{s.total_slots} vagas</span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Limite Diário</span>
                         </div>
                       </div>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="h-12 w-12 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
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

