"use client"

import { useState, useMemo, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Save, UserCheck, Phone, FileText, Stethoscope, Search, User, X } from "lucide-react"
import { format, startOfToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge" // Added Badge import

export function ConsultationForm() {
    const { doctors, receptionists, addConsultation, doctorSlots, consultations, patients } = useAuth()

    const [formData, setFormData] = useState({
        patient_id: undefined as number | undefined,
        patient_name: "",
        cpf: "",
        sus_card: "",
        phone: "",
        doctor_id: "",
        receptionist_name: "",
        date: startOfToday(),
    })

    const [isSaving, setIsSaving] = useState(false)
    const [nameSearch, setNameSearch] = useState("")
    const [showPatientResults, setShowPatientResults] = useState(false)

    // Filter patients for search results
    const searchedPatients = useMemo(() => {
        if (nameSearch.length < 2) return []
        return patients.filter(p =>
            p.paciente.toLowerCase().includes(nameSearch.toLowerCase()) ||
            (p.cpf && p.cpf.includes(nameSearch))
        ).slice(0, 5)
    }, [patients, nameSearch])

    const handleSelectPatient = (p: any) => {
        setFormData({
            ...formData,
            patient_id: p.id,
            patient_name: p.paciente,
            cpf: p.cpf || "",
            sus_card: p.sus || "",
            phone: p.telefone || "",
        })
        setNameSearch(p.paciente)
        setShowPatientResults(false)
    }

    const clearSelectedPatient = () => {
        setFormData({
            ...formData,
            patient_id: undefined,
            patient_name: "",
            cpf: "",
            sus_card: "",
            phone: "",
        })
        setNameSearch("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.patient_name || !formData.doctor_id || !formData.receptionist_name) {
            alert("Preencha os campos obrigatórios!")
            return
        }

        setIsSaving(true)
        try {
            const formattedDate = format(formData.date, "yyyy-MM-dd")
            const result = await addConsultation({
                patient_id: formData.patient_id,
                patient_name: formData.patient_name,
                cpf: formData.cpf,
                sus_card: formData.sus_card,
                phone: formData.phone,
                doctor_id: formData.doctor_id,
                receptionist_name: formData.receptionist_name,
                date: formattedDate,
            })

            if (result.success) {
                alert(result.message)
                setFormData({
                    patient_id: undefined,
                    patient_name: "",
                    cpf: "",
                    sus_card: "",
                    phone: "",
                    doctor_id: "",
                    receptionist_name: "",
                    date: startOfToday(),
                })
                setNameSearch("")
            } else {
                alert(result.message)
            }
        } catch (error) {
            alert("Erro ao realizar agendamento.")
        } finally {
            setIsSaving(false)
        }
    }

    // Calculate available slots for selected doctor and date
    const getAvailability = () => {
        if (!formData.doctor_id || !formData.date) return null
        const dateStr = format(formData.date, "yyyy-MM-dd")
        const slot = doctorSlots.find(s => s.doctor_id === formData.doctor_id && s.date === dateStr)
        if (!slot) return { max: 0, scheduled: 0, available: 0 }

        const scheduled = consultations.filter(c => c.doctor_id === formData.doctor_id && c.date === dateStr).length
        return {
            max: slot.max_slots,
            scheduled,
            available: Math.max(0, slot.max_slots - scheduled)
        }
    }

    const availability = getAvailability()

    return (
        <Card className="shadow-premium border-border/50 bg-card/80 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-black gradient-text uppercase tracking-tight">Agendar 1ª Consulta</CardTitle>
                <CardDescription className="text-muted-foreground font-bold">Cadastre novos pacientes ou selecione um existente do sistema</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2 md:col-span-2 relative">
                            <Label className="text-sm font-bold ml-1">Nome Completo do Paciente *</Label>
                            <div className="relative group">
                                <Input
                                    placeholder="Comece a digitar para buscar ou cadastrar novo..."
                                    className="rounded-2xl h-12 bg-accent/20 border-border/40 focus:ring-primary/20 pr-10"
                                    value={nameSearch || formData.patient_name}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase()
                                        setNameSearch(val)
                                        setFormData({ ...formData, patient_name: val, patient_id: undefined })
                                        setShowPatientResults(true)
                                    }}
                                    onFocus={() => setShowPatientResults(true)}
                                    required
                                />
                                {nameSearch && (
                                    <button
                                        type="button"
                                        onClick={clearSelectedPatient}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent/40 text-muted-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {showPatientResults && searchedPatients.length > 0 && (
                                <div className="absolute z-50 w-full mt-2 bg-card border border-border/50 rounded-2xl shadow-premium overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="p-2 border-b border-border/10 bg-accent/10 px-4">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pacientes Encontrados</span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {searchedPatients.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleSelectPatient(p)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-primary/5 text-left border-b border-border/5 last:border-0 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-foreground uppercase leading-none">{p.paciente}</p>
                                                        <p className="text-[10px] text-muted-foreground font-bold mt-1">CPF: {p.cpf || "N/A"} | SUS: {p.sus || "N/A"}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase tracking-tighter">Selecionar</Badge>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formData.patient_id && (
                                <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Paciente Vinculado ao Sistema</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold ml-1">CPF</Label>
                            <Input
                                placeholder="000.000.000-00"
                                className="rounded-2xl h-12 bg-accent/20 border-border/40 focus:ring-primary/20"
                                value={formData.cpf}
                                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold ml-1">Nº Cartão SUS</Label>
                            <Input
                                placeholder="000 0000 0000 0000"
                                className="rounded-2xl h-12 bg-accent/20 border-border/40 focus:ring-primary/20"
                                value={formData.sus_card}
                                onChange={(e) => setFormData({ ...formData, sus_card: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold ml-1 flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                Telefone
                            </Label>
                            <Input
                                placeholder="(99) 99999-9999"
                                className="rounded-2xl h-12 bg-accent/20 border-border/40 focus:ring-primary/20"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold ml-1 flex items-center gap-1.5">
                                <UserCheck className="h-3.5 w-3.5" />
                                Recepcionista Responsável *
                            </Label>
                            <Select value={formData.receptionist_name} onValueChange={(val) => setFormData({ ...formData, receptionist_name: val })}>
                                <SelectTrigger className="rounded-2xl h-12 bg-accent/20 border-border/40">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {receptionists.map(rec => (
                                        <SelectItem key={rec.id} value={rec.name}>{rec.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold ml-1 flex items-center gap-1.5">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                Data da Consulta *
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full rounded-2xl h-12 bg-accent/20 border-border/40 justify-start text-left font-normal",
                                            !formData.date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.date ? format(formData.date, "dd/MM/yyyy") : <span>Selecione a data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-3xl border-border/40 shadow-premium" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.date}
                                        onSelect={(date) => date && setFormData({ ...formData, date })}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold ml-1 flex items-center gap-1.5">
                                <Stethoscope className="h-3.5 w-3.5" />
                                Médico Solicitado *
                            </Label>
                            <Select value={formData.doctor_id} onValueChange={(val) => setFormData({ ...formData, doctor_id: val })}>
                                <SelectTrigger className="rounded-2xl h-12 bg-accent/20 border-border/40">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors.map(doc => (
                                        <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {availability && (
                        <div className={cn(
                            "p-6 rounded-[2rem] border transition-all duration-500 flex items-center justify-between group",
                            availability.available > 0
                                ? "bg-emerald-500/10 border-emerald-500/20"
                                : "bg-red-500/10 border-red-500/20"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-3 rounded-2xl shadow-premium",
                                    availability.available > 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                )}>
                                    <CalendarIcon className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black text-foreground uppercase tracking-tight text-lg">Vagas para este dia</p>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Total: <span className="text-foreground">{availability.max}</span> | Já agendados: <span className="text-foreground">{availability.scheduled}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn(
                                    "text-4xl font-black font-space block leading-none",
                                    availability.available > 0 ? "text-emerald-500" : "text-red-500"
                                )}>
                                    {availability.available}
                                </span>
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Disponíveis</span>
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isSaving || availability?.available === 0}
                        className="w-full h-16 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-sm shadow-premium transition-all duration-300 disabled:opacity-50"
                    >
                        <Save className="h-5 w-5 mr-3" />
                        {isSaving ? "PROCESSANDO..." : "CONFIRMAR AGENDAMENTO"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
