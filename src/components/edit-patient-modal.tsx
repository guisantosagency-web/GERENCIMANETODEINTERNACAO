"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Patient } from "@/lib/data"
import { useAuth } from "@/lib/auth-context"
import { estados } from "@/lib/brazil-cities"
import { fetchMunicipiosByEstado } from "@/lib/ibge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Home, CheckCircle, Plus, ChevronsUpDown } from "lucide-react"
import { calculateAge } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface EditPatientModalProps {
  patient: Patient | null
  isOpen: boolean
  onClose: () => void
  onSave: (patient: Patient) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string }
}

export function EditPatientModal({ patient, isOpen, onClose, onSave }: EditPatientModalProps) {
  const [formData, setFormData] = useState<Patient | null>(null)
  const [isResidencia, setIsResidencia] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openProcedencia, setOpenProcedencia] = useState(false)
  const [openCity, setOpenCity] = useState(false)
  const [municipiosIBGE, setMunicipiosIBGE] = useState<string[]>([])
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false)
  const [newProcedenciaName, setNewProcedenciaName] = useState("")
  const [showAddProcedencia, setShowAddProcedencia] = useState(false)

  const { doctors, receptionists, procedencias, addProcedencia } = useAuth()

  useEffect(() => {
    if (patient) {
      setFormData({ ...patient })
      setIsResidencia(patient.isResidencia || patient.procedencia.toUpperCase() === "RESIDÊNCIA")
      setError(null)
      setSuccess(null)
      setIsSubmitting(false)
    }
  }, [patient])

  useEffect(() => {
    async function loadMunicipios() {
      if (formData?.estado) {
        setIsLoadingMunicipios(true)
        const cities = await fetchMunicipiosByEstado(formData.estado)
        setMunicipiosIBGE(cities)
        setIsLoadingMunicipios(false)
      } else {
        setMunicipiosIBGE([])
      }
    }
    loadMunicipios()
  }, [formData?.estado])

  if (!formData) return null

  const handleChange = (field: keyof Patient, value: string | boolean) => {
    if (field === "estado") {
      setFormData((prev) => (prev ? { ...prev, estado: value as string, cidadeOrigem: "" } : null))
    } else {
      setFormData((prev) => (prev ? { ...prev, [field]: value } : null))
    }
    setError(null)
    setSuccess(null)

    if (field === "dataNascimento" && typeof value === "string") {
      const calculatedAge = calculateAge(value)
      setFormData((prev) => (prev ? { ...prev, dataNascimento: value, idade: calculatedAge } : null))
    }
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData && !isSubmitting) {
      setIsSubmitting(true)
      const updatedData = {
        ...formData,
        procedencia: isResidencia ? "RESIDÊNCIA" : formData.procedencia,
        isResidencia,
      }
      try {
        const result = await onSave(updatedData)
        if (result.success) {
          setSuccess("Alterações salvas com sucesso!")
          setError(null)
          setTimeout(() => {
            onClose()
          }, 800)
        } else {
          setError(result.message)
          setSuccess(null)
          setIsSubmitting(false)
        }
      } catch (error) {
        setError("Erro ao salvar alterações.")
        setSuccess(null)
        setIsSubmitting(false)
      }
    }
  }

  const handleAddProcedencia = async () => {
    if (newProcedenciaName.trim()) {
      await addProcedencia(newProcedenciaName.trim())
      handleChange("procedencia", newProcedenciaName.trim().toUpperCase())
      setNewProcedenciaName("")
      setShowAddProcedencia(false)
      setOpenProcedencia(false)
    }
  }

  const doctorsList = doctors || []
  const receptionistsList = receptionists || []

  const allDoctors = doctorsList.some((d) => d.name.toUpperCase() === formData.medico.toUpperCase())
    ? doctorsList
    : [...doctorsList, { id: `current-${Date.now()}`, name: formData.medico, specialty: "" }]

  const allReceptionists = receptionistsList.some((r) => r.name.toUpperCase() === formData.recepcionista.toUpperCase())
    ? receptionistsList
    : [...receptionistsList, { id: `current-${Date.now()}`, name: formData.recepcionista, username: "" }]

  const allDestinos = ["UTI", "ENFERMARIA", "CENTRO CIRÚRGICO", "OBSERVAÇÃO", "ALTA"].includes(
    formData.destino.toUpperCase(),
  )
    ? ["UTI", "ENFERMARIA", "CENTRO CIRÚRGICO", "OBSERVAÇÃO", "ALTA"]
    : [...["UTI", "ENFERMARIA", "CENTRO CIRÚRGICO", "OBSERVAÇÃO", "ALTA"], formData.destino]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">Editar Paciente</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50 text-green-700">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="paciente">Nome do Paciente</Label>
              <Input
                id="paciente"
                value={formData.paciente}
                onChange={(e) => handleChange("paciente", e.target.value.toUpperCase())}
                className="font-medium uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prontuario">Prontuário (ID)</Label>
              <Input
                id="prontuario"
                value={formData.prontuario}
                onChange={(e) => handleChange("prontuario", e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf || ""}
                onChange={(e) => handleChange("cpf", formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ""}
                onChange={(e) => handleChange("telefone", formatPhone(e.target.value))}
                placeholder="(99) 99999-9999"
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data de Internação</Label>
              <Input
                id="data"
                value={formData.data}
                onChange={(e) => handleChange("data", e.target.value)}
                placeholder="DD/MM/AAAA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario">Horário</Label>
              <Input id="horario" value={formData.horario} onChange={(e) => handleChange("horario", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => handleChange("estado", v)}>
                  <SelectTrigger className="font-medium">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {estados.map((estado) => (
                      <SelectItem key={estado.sigla} value={estado.sigla}>
                        {estado.nome} ({estado.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Município</Label>
                <Popover open={openCity} onOpenChange={setOpenCity}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCity}
                      className="w-full justify-between font-medium bg-transparent"
                      disabled={!formData.estado}
                    >
                      {formData.cidadeOrigem || "Buscar município..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Digite o nome..." />
                      <CommandList>
                        {isLoadingMunicipios ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Carregando municípios...
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>Nenhum município encontrado.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                              {municipiosIBGE.map((city) => (
                                <CommandItem
                                  key={city}
                                  value={city}
                                  onSelect={() => {
                                    handleChange("cidadeOrigem", city)
                                    setOpenCity(false)
                                  }}
                                >
                                  {city}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destino">Destino</Label>
              <Select value={formData.destino} onValueChange={(value) => handleChange("destino", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destino">
                    {formData.destino || "Selecione o destino"}
                  </SelectValue>
                </SelectTrigger>
<SelectContent>
                    {allDestinos.filter((destino) => destino).map((destino) => (
                      <SelectItem key={destino} value={destino}>
                        {destino}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leito">Leito</Label>
              <Input
                id="leito"
                value={formData.leito}
                onChange={(e) => handleChange("leito", e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sus">Cartão SUS</Label>
              <Input id="sus" value={formData.sus} onChange={(e) => handleChange("sus", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                value={formData.dataNascimento}
                onChange={(e) => handleChange("dataNascimento", e.target.value)}
                placeholder="DD/MM/AAAA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idade">Idade</Label>
              <Input
                id="idade"
                value={formData.idade}
                readOnly
                placeholder="Calculada automaticamente"
                className="bg-muted/50 cursor-not-allowed"
              />
            </div>

            <div className="col-span-2 p-4 rounded-xl bg-muted/50 border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" />
                  <Label htmlFor="isResidenciaEdit" className="font-medium">
                    Paciente vem de RESIDÊNCIA?
                  </Label>
                </div>
                <Switch
                  id="isResidenciaEdit"
                  checked={isResidencia}
                  onCheckedChange={(checked) => {
                    setIsResidencia(checked)
                    if (checked) {
                      handleChange("procedencia", "RESIDÊNCIA")
                    }
                  }}
                />
              </div>

              {!isResidencia && (
                <div className="space-y-2">
                  <Label>Procedência</Label>
                  <Popover open={openProcedencia} onOpenChange={setOpenProcedencia}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openProcedencia}
                        className="w-full justify-between font-normal bg-transparent"
                      >
                        {formData.procedencia || "Selecione a unidade..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar unidade..." />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-4 text-center">
                              <p className="text-sm text-muted-foreground mb-2">Nenhuma unidade encontrada.</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAddProcedencia(true)}
                                className="gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Adicionar Nova Unidade
                              </Button>
                            </div>
                          </CommandEmpty>
                            <CommandGroup>
                            {procedencias.map((proc) => (
                              <CommandItem
                                key={proc.id}
                                value={proc.name}
                                onSelect={() => {
                                  handleChange("procedencia", proc.name)
                                  setOpenProcedencia(false)
                                }}
                              >
                                <div
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.procedencia === proc.name ? "opacity-100" : "opacity-0",
                                  )}
                                >
                                  {/* Check icon goes here */}
                                </div>
                                {proc.name}
                              </CommandItem>
                            ))}
                            {procedencias.length > 0 && (
                              <div className="p-2 border-t">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowAddProcedencia(true)}
                                  className="w-full gap-2 text-primary"
                                >
                                  <Plus className="h-4 w-4" />
                                  Adicionar Nova Unidade
                                </Button>
                              </div>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>

                      {showAddProcedencia && (
                        <div className="p-3 border-t space-y-2">
                          <Label htmlFor="newProcedenciaEdit" className="text-sm">
                            Nome da Nova Unidade
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="newProcedenciaEdit"
                              value={newProcedenciaName}
                              onChange={(e) => setNewProcedenciaName(e.target.value.toUpperCase())}
                              placeholder="Ex: HOSPITAL MUNICIPAL"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddProcedencia()
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddProcedencia}
                              disabled={!newProcedenciaName.trim()}
                            >
                              {/* Check icon goes here */}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowAddProcedencia(false)
                                setNewProcedenciaName("")
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="medico">Médico</Label>
              <Select value={formData.medico} onValueChange={(value) => handleChange("medico", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o médico">{formData.medico || "Selecione o médico"}</SelectValue>
                </SelectTrigger>
<SelectContent className="max-h-60">
                    {allDoctors.filter((doctor) => doctor.name).map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.name}>
                        {doctor.name}
                        {doctor.specialty ? ` - ${doctor.specialty}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recepcionista">Recepcionista</Label>
              <Select value={formData.recepcionista} onValueChange={(value) => handleChange("recepcionista", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a recepcionista">
                    {formData.recepcionista || "Selecione a recepcionista"}
                  </SelectValue>
                </SelectTrigger>
<SelectContent className="max-h-60">
                    {allReceptionists.filter((receptionist) => receptionist.name).map((receptionist) => (
                      <SelectItem key={receptionist.id} value={receptionist.name}>
                        {receptionist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="procedimento">Procedimento</Label>
              <Input
                id="procedimento"
                value={formData.procedimento}
                onChange={(e) => handleChange("procedimento", e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
