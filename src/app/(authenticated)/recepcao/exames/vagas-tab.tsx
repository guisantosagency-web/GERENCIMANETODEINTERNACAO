"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Calendar, Save, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

export const PROCEDURES_WITH_SLOTS = [
  "Ultrassom",
  "Ecocardiograma",
  "Tomografia",
  "Tomografia com Contraste e Angiotomografia"
]

export default function VagasTab() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [slots, setSlots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const [newProcedure, setNewProcedure] = useState(PROCEDURES_WITH_SLOTS[0])
  const [newTotalSlots, setNewTotalSlots] = useState("")

  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

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
    loadSlots()
  }, [date])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTotalSlots) return

    try {
      const { error } = await supabase.from("exam_slots").upsert({
        exam_date: date,
        procedure_name: newProcedure,
        total_slots: parseInt(newTotalSlots)
      }, { onConflict: "exam_date,procedure_name" })

      if (error) throw error
      setNewTotalSlots("")
      loadSlots()
    } catch (e) {
      console.error(e)
      alert("Erro ao salvar vagas.")
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
      <div className="glass-card !bg-card/40 border-none rounded-[2.5rem] p-8 max-w-4xl mx-auto shadow-sm">
        <h2 className="text-2xl font-black font-space uppercase tracking-tight mb-6 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Calendar className="h-6 w-6" /></div>
          Limites de Vagas Diárias
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
           {/* Formulário */}
           <form onSubmit={handleSave} className="space-y-4 bg-muted/20 p-6 rounded-3xl border border-border/20">
             <div className="space-y-2">
               <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data Base</Label>
               <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="font-bold bg-background h-12" />
             </div>
             <div className="space-y-2 relative">
               <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Procedimento</Label>
               <select 
                  value={newProcedure} 
                  onChange={e => setNewProcedure(e.target.value)}
                  className="w-full appearance-none h-12 bg-background border border-border px-4 rounded-xl text-sm font-bold shadow-sm"
               >
                 {PROCEDURES_WITH_SLOTS.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
             </div>
             <div className="space-y-2">
               <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quantidade de Vagas</Label>
               <Input type="number" min="0" value={newTotalSlots} onChange={e => setNewTotalSlots(e.target.value)} required placeholder="Ex: 20" className="font-bold bg-background text-lg h-12" />
             </div>
             <Button type="submit" className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 mt-4 gap-2">
                <Save className="h-4 w-4" /> Salvar Vagas
             </Button>
           </form>

           {/* Lista do Dia */}
           <div>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-muted-foreground">Configurado em: {format(new Date(date + 'T00:00:00'), 'dd/MM/yyyy')}</h3>
              
              <div className="space-y-3">
                {isLoading ? (
                  <div className="h-20 animate-pulse bg-muted rounded-2xl" />
                ) : slots.length === 0 ? (
                  <div className="p-8 text-center bg-muted/20 rounded-3xl border border-dashed border-border/50">
                    <p className="text-sm font-bold text-muted-foreground">Nenhuma restrição de vaga para este dia.</p>
                  </div>
                ) : (
                  slots.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-4 bg-background rounded-2xl border border-border/50 shadow-sm group">
                       <div>
                         <p className="font-black text-sm">{s.procedure_name}</p>
                         <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-widest">Limite: <span className="text-amber-500">{s.total_slots}</span> vagas</p>
                       </div>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
  )
}
