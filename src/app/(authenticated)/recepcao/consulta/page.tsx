"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
    Stethoscope,
    Calendar as CalendarIcon,
    UserPlus,
    ClipboardList,
    Search,
    ChevronDown,
    ChevronUp,
    Save,
    Phone,
    FileText,
    MapPin,
    CalendarDays,
    UserCheck,
    MoreVertical,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
    RefreshCw,
    AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, startOfToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConsultationForm } from "@/components/consultation-form"
import { ConsultationControlBoard } from "@/components/consultation-control-board"

export default function ConsultaPage() {
    const { doctors, doctorSlots, consultations, isLoading } = useAuth()
    const [activeTab, setActiveTab] = useState("agendamento")

    return (
        <div className="space-y-8 animate-in fade-in duration-700 ease-out pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shadow-premium">
                            <Stethoscope className="h-6 w-6" />
                        </div>
                        <h1 className="text-4xl font-bold font-space tracking-tight gradient-text">Consultas</h1>
                    </div>
                    <p className="text-muted-foreground font-medium">Recepção • Cadastro e Controle de Agendamentos</p>
                </div>

                <div className="flex items-center gap-2 bg-card/40 backdrop-blur-sm border border-border/40 p-1.5 rounded-2xl shadow-soft">
                    <div className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-600 text-xs font-bold flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-card/50 backdrop-blur-sm border border-border/40 p-1 rounded-2xl h-auto self-start">
                    <TabsTrigger
                        value="agendamento"
                        className="rounded-xl px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Novo Agendamento
                    </TabsTrigger>
                    <TabsTrigger
                        value="quadro"
                        className="rounded-xl px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                    >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Quadro de Controle
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="agendamento" className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-500">
                    <ConsultationForm />
                </TabsContent>

                <TabsContent value="quadro" className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
                    <ConsultationControlBoard />
                </TabsContent>
            </Tabs>
        </div>
    )
}
