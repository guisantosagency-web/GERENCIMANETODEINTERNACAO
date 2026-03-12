"use client"

import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Calendar, Save, CheckCircle, Flame } from "lucide-react"

export function DailyExamsModal({ isOpen, setIsOpen, onSuccess, existingRecord }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    ultrassom: "",
    ecocardiograma: "",
    tomografia: "",
    tomografiaContraste: ""
  })

  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    [],
  )

  useEffect(() => {
    if (existingRecord) {
      setFormData({
        date: existingRecord.date,
        ultrassom: existingRecord.ultrassom?.toString() || "",
        ecocardiograma: existingRecord.ecocardiograma?.toString() || "",
        tomografia: existingRecord.tomografia?.toString() || "",
        tomografiaContraste: existingRecord.tomografia_contraste?.toString() || ""
      })
    }
  }, [existingRecord])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        date: formData.date,
        ultrassom: parseInt(formData.ultrassom) || 0,
        ecocardiograma: parseInt(formData.ecocardiograma) || 0,
        tomografia: parseInt(formData.tomografia) || 0,
        tomografia_contraste: parseInt(formData.tomografiaContraste) || 0,
      }

      const { error } = await supabase
        .from("daily_exams")
        .upsert([payload], { onConflict: "date" })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        onSuccess?.()
        setSuccess(false)
      }, 1000)
    } catch (e) {
      console.error(e)
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
             Registrar Exames
          </DialogTitle>
          <DialogDescription className="font-medium">
            Registre a quantidade de exames realizados na data selecionada.
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

            <div className="grid grid-cols-2 gap-4">
               {[
                 { id: "ultrassom", label: "Ultrassom", color: "text-blue-500" },
                 { id: "ecocardiograma", label: "Ecocardiograma", color: "text-emerald-500" },
                 { id: "tomografia", label: "Tomografia s/ Constraste", color: "text-amber-500" },
                 { id: "tomografiaContraste", label: "Tomografia c/ Angio", color: "text-purple-500" },
               ].map((field) => (
                 <div key={field.id} className="space-y-2 p-3 rounded-2xl bg-card border border-white/5 hover:border-purple-500/30 transition-all shadow-sm group">
                   <Label htmlFor={field.id} className="text-xs font-black uppercase tracking-tight opacity-70 group-hover:opacity-100 flex flex-col gap-1">
                      <span className={field.color}>{field.label}</span>
                   </Label>
                   <Input 
                     id={field.id}
                     type="number"
                     min="0"
                     value={(formData as any)[field.id]}
                     onChange={e => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                     placeholder="Qtd (Ex: 10)"
                     className="font-black text-lg h-12 text-center"
                   />
                 </div>
               ))}
            </div>

            <DialogFooter className="pt-4 border-t border-border/10">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl px-6">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold tracking-wide gap-2">
                {isSubmitting ? "Salvando..." : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Quantidades
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
