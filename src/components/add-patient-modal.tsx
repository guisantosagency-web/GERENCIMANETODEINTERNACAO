"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Patient } from "@/lib/data"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Plus, Check, ChevronsUpDown, AlertCircle, Home, CheckCircle, Calendar, Clock, User, ClipboardList, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"
import { estados } from "@/lib/brazil-cities"
import { calculateAge } from "@/lib/utils"
import { fetchMunicipiosByEstado } from "@/lib/ibge"

interface AddPatientModalProps {
  onAdd: (patient: Omit<Patient, "id">) => Promise<{ success: boolean; message: string }>
  nextOrdem: number
}

const DESTINOS = ["UTI", "ENFERMARIA", "CENTRO CIRÚRGICO", "OBSERVAÇÃO", "ALTA"]

export function AddPatientModal({ onAdd, nextOrdem }: AddPatientModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openCity, setOpenCity] = useState(false)
  const [openDoctor, setOpenDoctor] = useState(false)
  const [openProcedencia, setOpenProcedencia] = useState(false)
  const [newProcedenciaName, setNewProcedenciaName] = useState("")
  const [showAddProcedencia, setShowAddProcedencia] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResidencia, setIsResidencia] = useState(false)

  const { doctors, receptionists, checkProntuarioExists, generateNextProntuario, procedencias, addProcedencia } = useAuth()
  const [municipiosIBGE, setMunicipiosIBGE] = useState<string[]>([])
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false)

  const [formData, setFormData] = useState({
    paciente: "",
    data: new Date().toLocaleDateString("pt-BR"),
    horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    estado: "MA",
    cidadeOrigem: "",
    leito: "",
    sus: "",
    cpf: "",
    dataNascimento: "",
    idade: "",
    prontuario: "",
    procedencia: "",
    destino: "CENTRO CIRÚRGICO",
    medico: "PLANTONISTA",
      procedimento: "",
      recepcionista: "",
      telefone: "",
    })


  useEffect(() => {
    if (isOpen) {
      const fetchNext = async () => {
        const nextProntuario = await generateNextProntuario()
        setFormData(prev => ({ ...prev, prontuario: nextProntuario }))
      }
      fetchNext()
    }
  }, [isOpen, generateNextProntuario])

  useEffect(() => {
    async function loadMunicipios() {
      if (formData.estado) {
        setIsLoadingMunicipios(true)
        const cities = await fetchMunicipiosByEstado(formData.estado)
        setMunicipiosIBGE(cities)
        setIsLoadingMunicipios(false)
      } else {
        setMunicipiosIBGE([])
      }
    }
    loadMunicipios()
  }, [formData.estado])

  const handleEstadoChange = (sigla: string) => {
    setFormData((prev) => ({ ...prev, estado: sigla, cidadeOrigem: "" }))
    setError(null)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)

    if (field === "dataNascimento") {
      const calculatedAge = calculateAge(value)
      setFormData((prev) => ({ ...prev, dataNascimento: value, idade: calculatedAge }))
    }
  }

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
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

  const resetForm = () => {
    setFormData({
      paciente: "",
      data: new Date().toLocaleDateString("pt-BR"),
      horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      estado: "MA",
      cidadeOrigem: "",
      leito: "",
      sus: "",
      cpf: "",
      dataNascimento: "",
      idade: "",
      prontuario: "",
      procedencia: "",
      destino: "CENTRO CIRÚRGICO",
      medico: "PLANTONISTA",
      procedimento: "",
      recepcionista: "",
      telefone: "",
    })
    setIsResidencia(false)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      if (!formData.paciente || !formData.prontuario || !formData.data) {
        setError("Por favor, preencha todos os campos obrigatórios (*).")
        setIsSubmitting(false)
        return
      }

      const result = await onAdd({
        ordem: nextOrdem,
        ...formData,
        procedencia: isResidencia ? "RESIDÊNCIA" : formData.procedencia,
        isResidencia,
      })

      setIsSubmitting(false)

      if (result.success) {
        setSuccess(result.message)
        setTimeout(() => {
          setIsOpen(false)
          resetForm()
        }, 1200)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setIsSubmitting(false)
      setError("Erro inesperado ao salvar. Verifique sua conexão.")
      console.error(err)
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-12 px-6 rounded-2xl shadow-premium gap-2 bg-primary hover:bg-primary/90 text-white font-bold transition-all duration-300 hover:scale-105 active:scale-95">
          <Plus className="h-5 w-5" />
          Nova Internação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-0 rounded-[2.5rem] border-border/30 shadow-premium">
        <div className="p-8 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-b border-border/20">
          <DialogHeader>
            <DialogTitle className="text-3xl font-space font-bold tracking-tight">Cadastrar Internação</DialogTitle>
            <p className="text-muted-foreground font-medium mt-1">Preencha os dados do paciente para iniciar o protocolo</p>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5 animate-in shake-1">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-bold">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 animate-in zoom-in-95">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700 font-bold">{success}</AlertDescription>
            </Alert>
          )}

          <form id="add-patient-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <User className="h-4 w-4" />
                  Identificação do Paciente
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paciente" className="font-bold text-xs">NOME COMPLETO *</Label>
                    <Input
                      id="paciente"
                      value={formData.paciente}
                      onChange={(e) => handleChange("paciente", e.target.value.toUpperCase())}
                      required
                      placeholder="Ex: JOÃO DA SILVA SAURO"
                      className="h-12 rounded-xl border-border/40 uppercase font-medium bg-background/50 focus:bg-background transition-all"
                    />
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prontuario" className="font-bold text-xs">PRONTUÁRIO (ID) *</Label>
                      <div className="relative">
                        <Input
                          id="prontuario"
                          value={formData.prontuario}
                          onChange={(e) => handleChange("prontuario", e.target.value.toUpperCase())}
                          required
                          className="h-12 rounded-xl border-border/40 font-mono font-bold bg-accent/10"
                        />
                        <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/20 text-primary border-none text-[10px] font-bold">AUTOMÁTICO</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf" className="font-bold text-xs">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => handleChange("cpf", formatCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="h-12 rounded-xl border-border/40 font-medium"
                      />
                    </div>
                  </div>


                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento" className="font-bold text-xs">DATA DE NASCIMENTO</Label>
                    <Input
                      id="dataNascimento"
                      value={formData.dataNascimento}
                      onChange={(e) => handleChange("dataNascimento", formatDate(e.target.value))}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      className="h-12 rounded-xl border-border/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idade" className="font-bold text-xs">IDADE</Label>
                    <Input
                      id="idade"
                      value={formData.idade}
                      readOnly
                      placeholder="Cálculo automático"
                      className="h-12 rounded-xl border-border/40 bg-muted/30 font-bold text-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/20 w-full" />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <Calendar className="h-4 w-4" />
                  Detalhes da Internação
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data" className="font-bold text-xs">DATA DE INTERNAÇÃO *</Label>
                    <Input
                      id="data"
                      value={formData.data}
                      onChange={(e) => handleChange("data", formatDate(e.target.value))}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      required
                      className="h-12 rounded-xl border-border/40 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horario" className="font-bold text-xs">HORÁRIO *</Label>
                    <div className="relative">
                      <Input
                        id="horario"
                        value={formData.horario}
                        onChange={(e) => handleChange("horario", e.target.value)}
                        required
                        className="h-12 rounded-xl border-border/40 font-bold"
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs">ESTADO *</Label>
                    <Select value={formData.estado} onValueChange={handleEstadoChange} required>
                      <SelectTrigger className="h-12 rounded-xl border-border/40">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] rounded-2xl border-border/30">
                        {estados.map((estado) => (
                          <SelectItem key={estado.sigla} value={estado.sigla} className="rounded-lg">
                            {estado.nome} ({estado.sigla})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-xs">MUNICÍPIO *</Label>
                    <Popover open={openCity} onOpenChange={setOpenCity}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCity}
                          className="h-12 w-full justify-between font-medium rounded-xl border-border/40 bg-background"
                          disabled={!formData.estado}
                        >
                          {formData.cidadeOrigem || "Buscar município..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl border-border/30 shadow-premium" align="start">
                          <Command className="rounded-2xl">
                            <CommandInput placeholder="Digite o nome..." className="h-12" />
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
                                        className="rounded-lg"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            formData.cidadeOrigem === city ? "opacity-100" : "opacity-0",
                                          )}
                                        />
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leito" className="font-bold text-xs">LEITO *</Label>
                      <Input
                        id="leito"
                        value={formData.leito}
                        onChange={(e) => handleChange("leito", e.target.value.toUpperCase())}
                        required
                        placeholder="Ex: ALA B ENF 01 LT 01"
                        className="h-12 rounded-xl border-border/40 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sus" className="font-bold text-xs">CARTÃO SUS</Label>
                      <Input
                        id="sus"
                        value={formData.sus}
                        onChange={(e) => handleChange("sus", e.target.value)}
                        placeholder="000 0000 0000 0000"
                        className="h-12 rounded-xl border-border/40 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="font-bold text-xs">TELEFONE</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleChange("telefone", formatPhone(e.target.value))}
                        placeholder="(99) 99999-9999"
                        maxLength={15}
                        className="h-12 rounded-xl border-border/40 font-medium"
                      />
                    </div>
                  </div>

              </div>

              <div className="h-px bg-border/20 w-full" />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <ClipboardList className="h-4 w-4" />
                  Procedência e Destino
                </div>

                <div className="p-6 rounded-[1.5rem] bg-accent/10 border border-border/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-background shadow-sm">
                        <Home className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Label htmlFor="isResidencia" className="font-bold">Vem de Residência?</Label>
                        <p className="text-[10px] text-muted-foreground font-medium">Marque se o paciente não vem de outra unidade</p>
                      </div>
                    </div>
                    <Switch
                      id="isResidencia"
                      checked={isResidencia}
                      onCheckedChange={(checked) => {
                        setIsResidencia(checked)
                        if (checked) {
                          handleChange("procedencia", "RESIDÊNCIA")
                        } else {
                          handleChange("procedencia", "")
                        }
                      }}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  {!isResidencia && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <Label className="font-bold text-xs">UNIDADE DE PROCEDÊNCIA *</Label>
                      <div className="flex gap-2">
                        <Popover open={openProcedencia} onOpenChange={setOpenProcedencia}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openProcedencia}
                              className="h-12 w-full justify-between font-medium rounded-xl border-border/40 bg-background"
                            >
                              {formData.procedencia || "Selecione a unidade..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0 rounded-2xl border-border/30 shadow-premium" align="start">
                            <Command className="rounded-2xl">
                              <CommandInput placeholder="Buscar unidade..." className="h-12" />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="p-6 text-center">
                                    <p className="text-sm text-muted-foreground mb-4">Unidade não encontrada.</p>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => setShowAddProcedencia(true)}
                                      className="gap-2 rounded-xl shadow-indicator"
                                    >
                                      <Plus className="h-4 w-4" />
                                      Cadastrar Nova Unidade
                                    </Button>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup className="p-2">
                                  {procedencias.map((proc) => (
                                    <CommandItem
                                      key={proc.id}
                                      value={proc.name}
                                      onSelect={() => {
                                        handleChange("procedencia", proc.name)
                                        setOpenProcedencia(false)
                                      }}
                                      className="rounded-lg"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.procedencia === proc.name ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      {proc.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                <div className="p-2 border-t bg-muted/20">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAddProcedencia(true)}
                                    className="w-full gap-2 text-primary font-bold hover:bg-primary/5 rounded-lg"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Cadastrar Nova Unidade
                                  </Button>
                                </div>
                              </CommandList>
                            </Command>

                            {showAddProcedencia && (
                              <div className="p-4 border-t space-y-3 bg-background">
                                <Label htmlFor="newProcedencia" className="text-xs font-bold">NOME DA UNIDADE</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id="newProcedencia"
                                    value={newProcedenciaName}
                                    onChange={(e) => setNewProcedenciaName(e.target.value.toUpperCase())}
                                    placeholder="Ex: HOSPITAL GERAL"
                                    className="h-10 rounded-xl"
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    onClick={handleAddProcedencia}
                                    disabled={!newProcedenciaName.trim()}
                                    className="rounded-xl shadow-indicator"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setShowAddProcedencia(false)
                                      setNewProcedenciaName("")
                                    }}
                                    className="rounded-xl"
                                  >
                                    X
                                  </Button>
                                </div>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="destino" className="font-bold text-xs">DESTINO *</Label>
                    <Select value={formData.destino} onValueChange={(v) => handleChange("destino", v)} required>
                      <SelectTrigger className="h-12 rounded-xl border-border/40 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/30">
                        {DESTINOS.map((destino) => (
                          <SelectItem key={destino} value={destino} className="rounded-lg">
                            {destino}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-xs">MÉDICO RESPONSÁVEL *</Label>
                    <Popover open={openDoctor} onOpenChange={setOpenDoctor}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openDoctor}
                          className="h-12 w-full justify-between font-bold rounded-xl border-border/40 bg-background text-primary"
                        >
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            {formData.medico || "Selecione..."}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 rounded-2xl border-border/30 shadow-premium" align="start">
                        <Command className="rounded-2xl">
                          <CommandInput placeholder="Buscar médico..." className="h-12" />
                            <CommandList>
                              <CommandEmpty>Nenhum médico cadastrado.</CommandEmpty>
                              <CommandGroup className="p-2">
                                {doctorsList.map((doc) => (
                                <CommandItem
                                  key={doc.id}
                                  value={doc.name}
                                  onSelect={() => {
                                    handleChange("medico", doc.name)
                                    setOpenDoctor(false)
                                  }}
                                  className="rounded-lg"
                                >
                                  <Check
                                    className={cn("mr-2 h-4 w-4", formData.medico === doc.name ? "opacity-100" : "opacity-0")}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-bold">{doc.name}</span>
                                    {doc.specialty && <span className="text-[10px] text-muted-foreground uppercase">{doc.specialty}</span>}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recepcionista" className="font-bold text-xs">RECEPCIONISTA *</Label>
                    <Select value={formData.recepcionista} onValueChange={(v) => handleChange("recepcionista", v)} required>
                      <SelectTrigger className="h-12 rounded-xl border-border/40 font-medium">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
<SelectContent className="rounded-2xl border-border/30">
                          {receptionistsList.filter((r) => r.name).map((r) => (
                            <SelectItem key={r.id} value={r.name} className="rounded-lg">
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="procedimento" className="font-bold text-xs">PROCEDIMENTO *</Label>
                    <Input
                      id="procedimento"
                      value={formData.procedimento}
                      onChange={(e) => handleChange("procedimento", e.target.value.toUpperCase())}
                      required
                      placeholder="Ex: CIRURGIA DE FÊMUR"
                      className="h-12 rounded-xl border-border/40 uppercase font-bold text-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-8 bg-accent/5 border-t border-border/20 flex flex-col sm:flex-row gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)} 
            disabled={isSubmitting}
            className="h-12 rounded-2xl flex-1 font-bold border-border/40 hover:bg-background"
          >
            Cancelar
          </Button>
          <Button 
            form="add-patient-form"
            type="submit" 
            className="h-12 rounded-2xl flex-[2] bg-primary text-white font-bold shadow-premium transition-all duration-300 hover:scale-102" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando Internação...
              </div>
            ) : (
              "Confirmar e Salvar Protocolo"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
