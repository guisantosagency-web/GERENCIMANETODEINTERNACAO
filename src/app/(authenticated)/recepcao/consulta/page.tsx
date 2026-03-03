"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
    Stethoscope,
    PlusCircle,
    LayoutDashboard,
    Users,
    Search,
    ChevronDown,
    ChevronUp,
    Save,
    Phone,
    FileText,
    CalendarDays,
    Edit,
    Trash2,
    RefreshCw
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
import { PatientRegistry } from "@/components/patient-registry"

export default function ConsultaPage() {
    const { doctors, doctorSlots, consultations, isLoading } = useAuth()

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-[2rem] bg-primary/10 text-primary shadow-premium border border-primary/20">
                        <Stethoscope className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black gradient-text tracking-tight uppercase">Consultas</h1>
                        <p className="text-muted-foreground font-bold text-sm tracking-wider uppercase opacity-70">Recepção • Cadastro e Controle de Agendamentos</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="agendamento" className="w-full space-y-8">
                <div className="flex justify-start">
                    <TabsList className="bg-card/40 backdrop-blur-md p-1.5 rounded-[2rem] border border-border/40 shadow-premium h-auto flex flex-wrap gap-1">
                        <TabsTrigger
                            value="agendamento"
                            className="rounded-[1.5rem] px-8 py-3.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-indicator font-black uppercase text-[10px] tracking-widest gap-2 transition-all duration-500"
                        >
                            <PlusCircle className="h-4 w-4" />
                            Novo Agendamento
                        </TabsTrigger>
                        <TabsTrigger
                            value="controle"
                            className="rounded-[1.5rem] px-8 py-3.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-indicator font-black uppercase text-[10px] tracking-widest gap-2 transition-all duration-500"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Quadro de Controle
                        </TabsTrigger>
                        <TabsTrigger
                            value="pacientes"
                            className="rounded-[1.5rem] px-8 py-3.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-indicator font-black uppercase text-[10px] tracking-widest gap-2 transition-all duration-500"
                        >
                            <Users className="h-4 w-4" />
                            Cadastro de Pacientes
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="agendamento" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <ConsultationForm />
                </TabsContent>

                <TabsContent value="controle" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <ConsultationControlBoard />
                </TabsContent>

                <TabsContent value="pacientes" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <PatientRegistry />
                </TabsContent>
            </Tabs>
        </div>
    )
}
