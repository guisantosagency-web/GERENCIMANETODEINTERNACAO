"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth, type Doctor } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Check } from "lucide-react"

interface EditDoctorModalProps {
  doctor: Doctor
}

export function EditDoctorModal({ doctor }: EditDoctorModalProps) {
  const { updateDoctor } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [formData, setFormData] = useState({
    name: doctor.name,
    specialty: doctor.specialty,
  })

  useEffect(() => {
    if (open) {
      setFormData({
        name: doctor.name,
        specialty: doctor.specialty,
      })
      setSuccessMessage("")
    }
  }, [open, doctor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.specialty.trim()) return

    setIsSubmitting(true)
    await updateDoctor({
      id: doctor.id,
      name: formData.name.trim().toUpperCase(),
      specialty: formData.specialty.trim().toUpperCase(),
    })
    setIsSubmitting(false)
    setSuccessMessage("Médico atualizado com sucesso!")
    setTimeout(() => {
      setOpen(false)
      setSuccessMessage("")
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Médico
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-doctor-name">Nome do Médico</Label>
            <Input
              id="edit-doctor-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Dr. João Silva"
              className="uppercase"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-doctor-specialty">Especialidade</Label>
            <Input
              id="edit-doctor-specialty"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              placeholder="Ortopedia"
              className="uppercase"
              required
            />
          </div>

          {successMessage && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
              <Check className="h-4 w-4" />
              {successMessage}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
