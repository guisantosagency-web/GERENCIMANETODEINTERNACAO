"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Save, UserCheck, Phone, FileText, Stethoscope } from "lucide-react"
import { format, startOfToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function ConsultationForm() {
    const { doctors, receptionists, addConsultation, doctorSlots, consultations } = useAuth()

    const [formData, setFormData] = useState({
        patient_name: "",
        cpf: "",
        sus_card: "",
        phone: "",
        doctor_id: "",
        receptionist_name: "",
        date: startOfToday(),
    })

    const [isSaving, setIsSaving] = useState(false)

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
                    patient_name: "",
                    cpf: "",
                    sus_card: "",
                    phone: "",
                    doctor_id: "",
                    receptionist_name: "",
                    date: startOfToday(),
                })
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
                <CardTitle className="text-2xl font-black gradient-text">Agendar 1ª Consulta</CardTitle>
                <CardDescription className="text-muted-foreground">Cadastre novos pacientes e agende o atendimento inicial</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm font-bold ml-1">Nome Completo do Paciente *</Label>
                            <Input
                                placeholder="Ex: Maria José da Silva"
                                className="rounded-2xl h-12 bg-accent/20 border-border/40 focus:ring-primary/20"
                                value={formData.patient_name}
                                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value.toUpperCase() })}
                                required
                            />
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
                                            "w-full h-12 rounded-2xl bg-accent/20 border-border/40 justify-start text-left font-normal",
                                            !formData.date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.date ? format(formData.date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.date}
                                        onSelect={(date) => date && setFormData({ ...formData, date })}
                                        initialFocus
                                        disabled={(date) => date.getDay() === 0 || date < startOfToday()}
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
                            "p-4 rounded-2xl border flex items-center justify-between",
                            availability.available > 0
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                                : "bg-destructive/10 border-destructive/20 text-destructive"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl",
                                    availability.available > 0 ? "bg-emerald-500/20" : "bg-destructive/20"
                                )}>
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Vagas para este dia</p>
                                    <p className="text-xs opacity-80">Total: {availability.max} | Já agendados: {availability.scheduled}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black">{availability.available}</p>
                                <p className="text-[10px] uppercase font-bold tracking-wider">Disponíveis</p>
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg shadow-premium"
                        disabled={isSaving || !!(availability && availability.available === 0)}
                    >
                        <Save className="h-5 w-5 mr-3" />
                        {isSaving ? "PROCESSANDO..." : "CONFIRMAR AGENDAMENTO"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
