"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Pencil } from "lucide-react"

interface EditProcedenciaModalProps {
  procedencia: {
    id: string
    name: string
  }
}

export function EditProcedenciaModal({ procedencia }: EditProcedenciaModalProps) {
  const { editProcedencia } = useAuth()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(procedencia.name)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await editProcedencia(procedencia.id, name)
      setOpen(false)
      alert("Unidade atualizada com sucesso! Todos os pacientes relacionados foram atualizados.")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao atualizar unidade")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onSetChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Unidade de Procedência</DialogTitle>
            <DialogDescription>
              Altere o nome da unidade. Todos os pacientes com esta procedência serão atualizados automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Unidade</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: HOSPITAL MUNICIPAL"
                required
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
