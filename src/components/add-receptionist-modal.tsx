"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus } from "lucide-react"

export function AddReceptionistModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addReceptionist, receptionists } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "@htocaxias",
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
      })

      setIsOpen(false)
      setFormData({
        name: "",
        username: "",
        password: "@htocaxias",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            Cadastrar Nova Recepcionista
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">Senha padrão: @htocaxias</p>
          </div>
          <DialogFooter className="gap-2">
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
