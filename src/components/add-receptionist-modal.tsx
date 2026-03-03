"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus, ShieldCheck, ClipboardCheck, PhoneCall } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export function AddReceptionistModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addReceptionist, receptionists } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "@htocaxias",
    allowedModules: [] as string[],
    allowedSubmodules: [] as string[],
  })
  const [error, setError] = useState("")

  const handleNameChange = (name: string) => {
    const username = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .replace(/[^a-z]/g, "")
    setFormData((prev) => ({ ...prev, name, username }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verificar se username já existe
    const existingUsernames = receptionists.map((r) => r.username.toLowerCase())
    if (existingUsernames.includes(formData.username.toLowerCase())) {
      setError("Este usuário já existe!")
      return
    }

    setIsSubmitting(true)

    try {
      await addReceptionist({
        name: formData.name.toUpperCase(),
        username: formData.username,
        allowedModules: formData.allowedModules,
        allowedSubmodules: formData.allowedSubmodules,
      } as any)

      setIsOpen(false)
      setFormData({
        name: "",
        username: "",
        password: "@htocaxias",
        allowedModules: [],
        allowedSubmodules: [],
      })
      setError("")
    } catch (error) {
      console.error("Erro ao cadastrar recepcionista:", error)
      setError("Erro ao cadastrar. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 shadow-sm bg-transparent hover:bg-primary/5 hover:border-primary">
          <UserPlus className="h-4 w-4" />
          Nova Recepcionista
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            Cadastrar Nova Recepcionista
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Ex: Maria Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuário (gerado automaticamente)</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                  setError("")
                }}
                required
                placeholder="Usuário será gerado do nome"
                className="bg-muted/50"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <Label className="text-sm font-black uppercase tracking-tight text-primary">Permissões de Acesso</Label>

            <div className="grid gap-3">
              <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50">
                <Checkbox
                  id="module-internacoes"
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
                <Label htmlFor="module-internacoes" className="grid gap-1.5 leading-none cursor-pointer">
                  <span className="font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    INTERNAÇÕES
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">Fluxo de pacientes e dashboard.</span>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50">
                <Checkbox
                  id="module-triagem"
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
                <Label htmlFor="module-triagem" className="grid gap-1.5 leading-none cursor-pointer">
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
                    id="module-recepcao"
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
                  <Label htmlFor="module-recepcao" className="grid gap-1.5 leading-none cursor-pointer">
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
                          id={`sub-${sub}`}
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
                        <Label htmlFor={`sub-${sub}`} className="text-xs font-bold cursor-pointer">{sub}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label htmlFor="password">Senha de Acesso</Label>
            <Input
              id="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <p className="text-[10px] text-muted-foreground">Senha padrão: @htocaxias</p>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Cadastrando..." : "Cadastrar Recepcionista"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
