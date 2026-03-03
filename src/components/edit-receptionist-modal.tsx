"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth, type Receptionist } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Check, ShieldCheck, ClipboardCheck, PhoneCall } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface EditReceptionistModalProps {
  receptionist: Receptionist
}

export function EditReceptionistModal({ receptionist }: EditReceptionistModalProps) {
  const { updateReceptionist } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [formData, setFormData] = useState({
    name: receptionist.name,
    username: receptionist.username,
    allowedModules: receptionist.allowedModules || [],
    allowedSubmodules: receptionist.allowedSubmodules || [],
  })

  useEffect(() => {
    if (open) {
      setFormData({
        name: receptionist.name,
        username: receptionist.username,
        allowedModules: receptionist.allowedModules || [],
        allowedSubmodules: receptionist.allowedSubmodules || [],
      })
      setSuccessMessage("")
    }
  }, [open, receptionist])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.username.trim()) return

    setIsSubmitting(true)
    await updateReceptionist({
      id: receptionist.id,
      name: formData.name.trim().toUpperCase(),
      username: formData.username.trim().toLowerCase(),
      allowedModules: formData.allowedModules,
      allowedSubmodules: formData.allowedSubmodules,
    })
    setIsSubmitting(false)
    setSuccessMessage("Recepcionista atualizada com sucesso!")
    setTimeout(() => {
      setOpen(false)
      setSuccessMessage("")
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-lg">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pencil className="h-5 w-5 text-primary" />
            </div>
            Editar Recepcionista
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-receptionist-name">Nome Completo</Label>
              <Input
                id="edit-receptionist-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Maria Silva"
                className="uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-receptionist-username">Usuário de Login</Label>
              <Input
                id="edit-receptionist-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="maria"
                className="lowercase bg-muted/50"
                required
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <Label className="text-sm font-black uppercase tracking-tight text-primary">Permissões de Acesso</Label>

            <div className="grid gap-3">
              <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50">
                <Checkbox
                  id="edit-module-internacoes"
                  checked={formData.allowedModules.includes("INTERNACOES")}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      allowedModules: checked
                        ? [...prev.allowedModules, "INTERNACOES"]
                        : prev.allowedModules.filter(m => m !== "INTERNACOES")
                    }))
                  }}
                />
                <Label htmlFor="edit-module-internacoes" className="grid gap-1.5 leading-none cursor-pointer">
                  <span className="font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    INTERNAÇÕES
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">Fluxo de pacientes e dashboard.</span>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50">
                <Checkbox
                  id="edit-module-triagem"
                  checked={formData.allowedModules.includes("TRIAGEM")}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      allowedModules: checked
                        ? [...prev.allowedModules, "TRIAGEM"]
                        : prev.allowedModules.filter(m => m !== "TRIAGEM")
                    }))
                  }}
                />
                <Label htmlFor="edit-module-triagem" className="grid gap-1.5 leading-none cursor-pointer">
                  <span className="font-bold flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-emerald-500" />
                    TRIAGEM
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">Módulo de classificação de risco.</span>
                </Label>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50">
                  <Checkbox
                    id="edit-module-recepcao"
                    checked={formData.allowedModules.includes("RECEPCAO")}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({
                        ...prev,
                        allowedModules: checked
                          ? [...prev.allowedModules, "RECEPCAO"]
                          : prev.allowedModules.filter(m => m !== "RECEPCAO")
                      }))
                    }}
                  />
                  <Label htmlFor="edit-module-recepcao" className="grid gap-1.5 leading-none cursor-pointer">
                    <span className="font-bold flex items-center gap-2">
                      <PhoneCall className="h-4 w-4 text-purple-500" />
                      RECEPÇÃO
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">Submódulos de atendimento.</span>
                  </Label>
                </div>

                {formData.allowedModules.includes("RECEPCAO") && (
                  <div className="ml-8 grid grid-cols-1 gap-2 border-l-2 border-purple-500/20 pl-4 py-1 animate-in slide-in-from-left-2 duration-300">
                    {["EXAMES", "RETORNO", "CONSULTA"].map(sub => (
                      <div key={sub} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-500/5 transition-colors">
                        <Checkbox
                          id={`edit-sub-${sub}`}
                          checked={formData.allowedSubmodules.includes(sub)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              allowedSubmodules: checked
                                ? [...prev.allowedSubmodules, sub]
                                : prev.allowedSubmodules.filter(s => s !== sub)
                            }))
                          }}
                        />
                        <Label htmlFor={`edit-sub-${sub}`} className="text-xs font-bold cursor-pointer">{sub}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 animate-in zoom-in-50 duration-300">
              <Check className="h-4 w-4" />
              {successMessage}
            </div>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
