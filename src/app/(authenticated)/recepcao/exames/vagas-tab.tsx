"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Calendar as CalendarIcon, Save, Search, Trash2, Settings2, Loader2 } from "lucide-react"
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
      if (data && !error) setSlots(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadProcedures() }, [])
  useEffect(() => { loadSlots() }, [date])

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
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-xl border border-orange-100">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Configuração de Vagas</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Configuração de Disponibilidade</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setIsManagerOpen(true)}
            className="h-10 px-5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold uppercase text-[10px] tracking-wider gap-2 shadow-sm"
          >
            <Settings2 className="h-4 w-4" />
            Editar Procedimentos
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          {/* Left: Calendar + Parameters */}
          <div className="space-y-6">
            <div className="grid md:grid-cols-[auto_1fr] gap-6">
              {/* Calendar */}
              <div className="space-y-3">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 ml-1">1. Selecionar Período</Label>
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-2">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => dates && setSelectedDates(dates)}
                    className="p-2 text-slate-700"
                  />
                </div>
                <div className="flex items-center justify-center">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDates([new Date()])} className="text-[9px] font-bold uppercase text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors rounded-lg">
                    Resetar Seleção
                  </Button>
                </div>
              </div>

              {/* Parameters */}
              <div className="flex flex-col gap-5 pt-1">
                <div className="space-y-5">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 ml-1">2. Parâmetros Operacionais</Label>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase text-slate-500 ml-1">Procedimento Médico</Label>
                    <select
                      value={newProcedure}
                      onChange={e => setNewProcedure(e.target.value)}
                      className="w-full h-12 bg-white border border-slate-200 px-4 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-teal-400 shadow-sm"
                    >
                      {dynamicProcedures.map((p: any) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase text-slate-500 ml-1">Total de Vagas</Label>
                    <Input
                      type="number"
                      min="0"
                      value={newTotalSlots}
                      onChange={e => setNewTotalSlots(e.target.value)}
                      required
                      placeholder="0"
                      className="font-bold bg-white text-slate-800 text-3xl h-20 rounded-xl text-center border-slate-200 focus:border-teal-400 outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <div className="py-3 px-4 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                      {selectedDates.length} DIA(S) SELECIONADO(S)
                    </p>
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading || selectedDates.length === 0 || !newTotalSlots}
                    className="w-full h-14 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm uppercase tracking-wider gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="h-5 w-5" /> Confirmar Aplicação</>}
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary - Selected Dates */}
            <div className="space-y-2">
              <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 ml-1">Resumo da Seleção:</Label>
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 min-h-[60px]">
                {selectedDates.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic font-bold p-1 uppercase tracking-wider mx-auto mt-1">Nenhum dia selecionado</p>
                )}
                {selectedDates.sort((a, b) => a.getTime() - b.getTime()).map(d => (
                  <div key={d.toISOString()} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 animate-in zoom-in duration-300 shadow-sm">
                    <span className="text-teal-600">{format(d, 'dd/MM')}</span>
                    <div className="w-px h-3 bg-slate-200" />
                    <button type="button" onClick={() => setSelectedDates(selectedDates.filter(date => date !== d))} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Day Monitor */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
              <div className="space-y-5">
                <div>
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 ml-1">Monitor do Dia</Label>
                  <div className="mt-3 flex items-center justify-between pb-4 border-b border-slate-200">
                    <Input
                      type="date"
                      value={format(date, 'yyyy-MM-dd')}
                      onChange={e => setDate(new Date(e.target.value + 'T00:00:00'))}
                      className="bg-white border-slate-200 text-slate-700 h-10 w-[160px] rounded-xl px-3 text-xs font-bold focus:border-teal-400 outline-none shadow-sm"
                    />
                    <div className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 font-bold text-[10px] uppercase tracking-wide">
                      {format(date, 'dd MMM yyyy')}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse bg-slate-200 rounded-xl" />)}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
                        <Search className="h-6 w-6 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sem Limites Manuais</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Padrão sistêmico ativo</p>
                      </div>
                    </div>
                  ) : (
                    slots.map(s => (
                      <div key={s.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm group hover:border-teal-200 transition-all">
                        <div className="space-y-1.5">
                          <p className="font-bold text-slate-800 uppercase tracking-tight text-xs">{s.procedure_name}</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-teal-50 border border-teal-100 text-teal-600 rounded-lg text-[9px] font-bold uppercase">{s.total_slots} VAGAS</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                          className="h-9 w-9 rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
                        >
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

      <ExamManagerModal
        isOpen={isManagerOpen}
        onOpenChange={setIsManagerOpen}
        onUpdate={loadProcedures}
      />
    </div>
  )
}
