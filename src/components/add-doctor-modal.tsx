"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Stethoscope, Plus } from "lucide-react"

export function AddDoctorModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addDoctor } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    crm: "",
    specialty: "ORTOPEDIA",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await addDoctor({
        name: formData.name,
        specialty: formData.specialty,
      })

      setIsOpen(false)
      setFormData({ name: "", crm: "", specialty: "ORTOPEDIA" })
    } catch (error) {
      console.error("Erro ao cadastrar médico:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-indicator gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
          <Plus className="h-4 w-4" />
          Novo Médico
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Stethoscope className="h-5 w-5 text-emerald-500" />
            </div>
            Cadastrar Novo Médico
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
              required
              placeholder="DR. NOME DO MÉDICO"
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crm">CRM</Label>
            <Input
              id="crm"
              value={formData.crm}
              onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
              placeholder="0000-MA"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialty">Especialidade</Label>
            <Input
              id="specialty"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value.toUpperCase() })}
              placeholder="ORTOPEDIA"
              className="uppercase"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar Médico"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
