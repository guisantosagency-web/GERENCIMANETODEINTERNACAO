"use client"

import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Calendar, Save, CheckCircle, Flame, FileText } from "lucide-react"

export const EXAM_TYPES = [
  "Ultrassom",
  "Ecocardiograma",
  "Tomografia",
  "Tomografia c/ Contraste e Angiotomografia"
]

export function DailyExamsModal({ isOpen, setIsOpen, onSuccess, existingRecord }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    exame: EXAM_TYPES[0],
    presentes: "",
    faltas: ""
  })

  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    [],
  )

  useEffect(() => {
    if (existingRecord) {
      setFormData({
        date: existingRecord.date,
        exame: existingRecord.exame || EXAM_TYPES[0],
        presentes: existingRecord.presentes?.toString() || "",
        faltas: existingRecord.faltas?.toString() || ""
      })
    } else {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        exame: EXAM_TYPES[0],
        presentes: "",
        faltas: ""
      })
    }
  }, [existingRecord, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload: any = {
        date: formData.date,
        exame: formData.exame,
        presentes: parseInt(formData.presentes) || 0,
        faltas: parseInt(formData.faltas) || 0,
      }

      // Se for edição, mantemos o ID para atualizar o registro correto
      if (existingRecord && existingRecord.id) {
        payload.id = existingRecord.id
      }

      const { error } = await supabase
        .from("daily_exams")
        .upsert([payload], { onConflict: existingRecord ? "id" : "date,exame" })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        onSuccess?.()
        setSuccess(false)
      }, 1000)
    } catch (e) {
      console.error(e)
      alert("Erro ao salvar! Verifique se já existe um registro deste exame para a data informada.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-3xl border-white/10 shadow-premium">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-black font-space uppercase tracking-tight">
             <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
               <Flame className="h-6 w-6" />
             </div>
             {existingRecord ? "Editar Registro" : "Registrar Exame"}
          </DialogTitle>
          <DialogDescription className="font-medium">
            Registre a quantidade de pacientes presentes e faltas para um exame específico nesta data.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-in zoom-in-50 duration-500">
             <CheckCircle className="h-16 w-16 text-emerald-500 animate-bounce" />
             <p className="font-black text-xl uppercase tracking-widest text-emerald-500">Salvo com Sucesso!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            
            <div className="space-y-2 relative">
              <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">Data do Registro</Label>
              <div className="relative">
                 <Input 
                   type="date" 
                   value={formData.date}
                   onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                   required
                   max={format(new Date(), 'yyyy-MM-dd')}
                   className="pl-10 font-bold bg-muted/50 focus:ring-purple-500"
                 />
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
              </div>
            </div>

            <div className="space-y-2 relative">
              <Label className="uppercase text-xs font-black tracking-widest text-muted-foreground">Tipo de Exame</Label>
              <div className="relative group/filter">
                <select
                  value={formData.exame}
                  onChange={(e) => setFormData(prev => ({ ...prev, exame: e.target.value }))}
                  required
                  disabled={!!existingRecord}
                  className="w-full appearance-none bg-muted/50 border border-white/5 px-4 py-3 pl-10 pr-10 rounded-xl text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-md cursor-pointer disabled:opacity-50"
                >
                  {EXAM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground opacity-50 text-[10px]">▼</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 p-3 rounded-2xl bg-card border border-white/5 hover:border-emerald-500/30 transition-all shadow-sm group">
                <Label htmlFor="presentes" className="text-xs font-black uppercase tracking-tight opacity-70 group-hover:opacity-100 flex flex-col gap-1 text-emerald-500">
                  Presentes
                </Label>
                <Input 
                  id="presentes"
                  type="number"
                  min="0"
                  value={formData.presentes}
                  onChange={e => setFormData(prev => ({ ...prev, presentes: e.target.value }))}
                  placeholder="Qtd"
                  className="font-black text-lg h-12 text-center"
                  required
                />
              </div>

              <div className="space-y-2 p-3 rounded-2xl bg-card border border-white/5 hover:border-red-500/30 transition-all shadow-sm group">
                <Label htmlFor="faltas" className="text-xs font-black uppercase tracking-tight opacity-70 group-hover:opacity-100 flex flex-col gap-1 text-red-500">
                  Faltas
                </Label>
                <Input 
                  id="faltas"
                  type="number"
                  min="0"
                  value={formData.faltas}
                  onChange={e => setFormData(prev => ({ ...prev, faltas: e.target.value }))}
                  placeholder="Qtd"
                  className="font-black text-lg h-12 text-center"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/10">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl px-6">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold tracking-wide gap-2">
                {isSubmitting ? "Salvando..." : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Registro
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
