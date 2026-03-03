"use client"

import { useState } from "react"
import { useAuth, type DoctorSlot } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Plus, Save, Trash2, Users } from "lucide-react"
import { format, addDays, startOfToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function DoctorSlotsManager() {
    const { doctors, doctorSlots, updateDoctorSlot } = useAuth()
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
    const [maxSlots, setMaxSlots] = useState<string>("10")
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        if (!selectedDoctorId || !selectedDate) return

        setIsSaving(true)
        try {
            await updateDoctorSlot({
                doctor_id: selectedDoctorId,
                date: format(selectedDate, "yyyy-MM-dd"),
                max_slots: parseInt(maxSlots)
            })
            alert("Vagas atualizadas com sucesso!")
        } catch (error) {
            alert("Erro ao atualizar vagas.")
        } finally {
            setIsSaving(false)
        }
    }

    // Get slots for the next 7 days or filtered by doctor
    const upcomingSlots = doctorSlots
        .filter(slot => {
            const slotDate = new Date(slot.date)
            return slotDate >= startOfToday()
        })
        .sort((a, b) => a.date.localeCompare(b.date))

    return (
        <Card className="shadow-card border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                        <Users className="h-5 w-5 text-emerald-500" />
                    </div>
                    Gerenciamento de Vagas de Consulta
                </CardTitle>
                <CardDescription className="ml-12">
                    Defina a quantidade de vagas por médico por dia (Segunda a Sábado)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-accent/20 p-4 rounded-xl border border-border/30">
                    <div className="space-y-2">
                        <Label>Médico</Label>
                        <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Selecione o médico" />
                            </SelectTrigger>
                            <SelectContent>
                                {doctors.map(doc => (
                                    <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Data</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-background",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    initialFocus
                                    disabled={(date) => date.getDay() === 0 || date < startOfToday()}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>Quantidade de Vagas</Label>
                        <Input
                            type="number"
                            value={maxSlots}
                            onChange={(e) => setMaxSlots(e.target.value)}
                            min="0"
                            className="bg-background"
                        />
                    </div>

                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleSave}
                        disabled={isSaving || !selectedDoctorId}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Salvando..." : "Definir Vagas"}
                    </Button>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vagas Definidas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {upcomingSlots.length === 0 ? (
                            <p className="text-sm text-muted-foreground col-span-full py-8 text-center bg-accent/10 rounded-xl border border-dashed border-border/50">
                                Nenhuma vaga configurada para os próximos dias
                            </p>
                        ) : (
                            upcomingSlots.map(slot => {
                                const doctor = doctors.find(d => d.id === slot.doctor_id)
                                return (
                                    <div key={slot.id} className="p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/10 transition-colors flex justify-between items-center group">
                                        <div>
                                            <p className="font-bold text-sm truncate max-w-[150px]">{doctor?.name || "Médico Excluído"}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(slot.date), "EEEE, dd/MM", { locale: ptBR })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-center">
                                                <p className="text-xl font-black text-primary">{slot.max_slots}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Vagas</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
