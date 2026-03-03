"use client"

import { useState, useMemo } from "react"
import { useAuth, type Consultation } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ChevronDown,
    ChevronUp,
    Search,
    Trash2,
    Edit,
    Save,
    CheckCircle2,
    Clock,
    Users,
    FileText,
    Phone,
    MapPin,
    CalendarIcon,
    Fingerprint,
    MoreVertical,
    XCircle,
    RefreshCw
} from "lucide-react"
import { format, startOfToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ConsultationControlBoard() {
    const { doctors, consultations, updateConsultation, deleteConsultation } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDate, setSelectedDate] = useState<string>(format(startOfToday(), "yyyy-MM-dd"))
    const [expandedDoctorId, setExpandedDoctorId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Consultation | null>(null)

    // Filter consultations for today and by search term
    const filteredConsultations = useMemo(() => {
        return consultations.filter(c => {
            const matchDate = c.date === selectedDate
            const matchSearch = c.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.cpf && c.cpf.includes(searchTerm)) ||
                (c.sisreg && c.sisreg.includes(searchTerm))
            return matchDate && matchSearch
        })
    }, [consultations, selectedDate, searchTerm])

    // Group consultations by doctor
    const groupedByDoctor = useMemo(() => {
        const groups: Record<string, Consultation[]> = {}
        doctors.forEach(doc => {
            groups[doc.id] = filteredConsultations.filter(c => c.doctor_id === doc.id)
        })
        return groups
    }, [doctors, filteredConsultations])

    const handleEdit = (consultation: Consultation) => {
        setEditingId(consultation.id)
        setEditForm({ ...consultation })
    }

    const handleSave = async () => {
        if (!editForm) return
        await updateConsultation(editForm)
        setEditingId(null)
        setEditForm(null)
        alert("Dados atualizados com sucesso!")
    }

    const handleDelete = async (id: string) => {
        if (window.confirm("Deseja realmente excluir este agendamento?")) {
            await deleteConsultation(id)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-soft border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Pesquisar por nome, CPF ou SISREG..."
                                className="pl-10 rounded-xl h-12 bg-accent/20 border-border/40 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Input
                                type="date"
                                className="rounded-xl h-12 bg-accent/20 border-border/40 w-full md:w-48"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                            <Button variant="outline" className="h-12 w-12 rounded-xl p-0 shrink-0 border-border/40 bg-accent/20">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {doctors.filter(doc => groupedByDoctor[doc.id].length > 0 || expandedDoctorId === doc.id).length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-card/30 rounded-3xl border border-dashed border-border/50 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                        <p className="text-muted-foreground font-medium">Nenhum agendamento para esta data.</p>
                    </div>
                ) : (
                    doctors.map(doc => {
                        const docConsultations = groupedByDoctor[doc.id] || []
                        const isExpanded = expandedDoctorId === doc.id

                        if (docConsultations.length === 0 && !isExpanded) return null

                        return (
                            <Card
                                key={doc.id}
                                className={cn(
                                    "shadow-premium border-border/50 bg-card/80 backdrop-blur-sm rounded-3xl overflow-hidden transition-all duration-300",
                                    isExpanded ? "ring-2 ring-primary/20" : ""
                                )}
                            >
                                <button
                                    onClick={() => setExpandedDoctorId(isExpanded ? null : doc.id)}
                                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-accent/10 transition-colors"
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-premium">
                                            <Users className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{doc.name}</h3>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{doc.specialty || "Cínica Geral"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge className="rounded-xl bg-orange-500/10 text-orange-600 border-orange-500/20 px-3 py-1 font-black text-sm">
                                            {docConsultations.length} PACIENTES
                                        </Badge>
                                        {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <CardContent className="p-0 border-t border-border/40 animate-in slide-in-from-top-2 duration-300">
                                        <div className="divide-y divide-border/30">
                                            {docConsultations.length === 0 ? (
                                                <div className="p-8 text-center text-muted-foreground text-sm">
                                                    Nenhum paciente agendado para este médico nesta data.
                                                </div>
                                            ) : (
                                                docConsultations.map(consultation => (
                                                    <div key={consultation.id} className="p-6 hover:bg-accent/5 transition-all">
                                                        <div className="flex flex-col lg:flex-row gap-6">
                                                            {/* Basic Info */}
                                                            <div className="flex-1 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="text-xl font-black text-primary truncate max-w-[300px]">
                                                                            {consultation.patient_name}
                                                                        </h4>
                                                                        <Badge className={cn(
                                                                            "rounded-lg border-0",
                                                                            consultation.status === 'Agendado' ? "bg-blue-500/10 text-blue-600" :
                                                                                consultation.status === 'Alta' ? "bg-emerald-500/10 text-emerald-600" :
                                                                                    consultation.status === 'Falta' ? "bg-destructive/10 text-destructive" :
                                                                                        "bg-orange-500/10 text-orange-600"
                                                                        )}>
                                                                            {consultation.status}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        {editingId === consultation.id ? (
                                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 bg-emerald-500/10 rounded-lg" onClick={handleSave}>
                                                                                <Save className="h-4 w-4" />
                                                                            </Button>
                                                                        ) : (
                                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary bg-primary/10 rounded-lg" onClick={() => handleEdit(consultation)}>
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive bg-destructive/10 rounded-lg" onClick={() => handleDelete(consultation.id)}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm font-medium">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">CPF</Label>
                                                                        {editingId === consultation.id ? (
                                                                            <Input
                                                                                className="h-9 rounded-xl bg-white/50 py-1"
                                                                                value={editForm?.cpf || ""}
                                                                                onChange={(e) => setEditForm({ ...editForm!, cpf: e.target.value })}
                                                                            />
                                                                        ) : (
                                                                            <div className="flex items-center gap-2 text-muted-foreground px-1">
                                                                                <Fingerprint className="h-4 w-4 shrink-0" />
                                                                                <span>{consultation.cpf || "N/A"}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">SUS</Label>
                                                                        {editingId === consultation.id ? (
                                                                            <Input
                                                                                className="h-9 rounded-xl bg-white/50 py-1"
                                                                                value={editForm?.sus_card || ""}
                                                                                onChange={(e) => setEditForm({ ...editForm!, sus_card: e.target.value })}
                                                                            />
                                                                        ) : (
                                                                            <div className="flex items-center gap-2 text-muted-foreground px-1">
                                                                                <FileText className="h-4 w-4 shrink-0" />
                                                                                <span>{consultation.sus_card || "N/A"}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Telefone</Label>
                                                                        {editingId === consultation.id ? (
                                                                            <Input
                                                                                className="h-9 rounded-xl bg-white/50 py-1"
                                                                                value={editForm?.phone || ""}
                                                                                onChange={(e) => setEditForm({ ...editForm!, phone: e.target.value })}
                                                                            />
                                                                        ) : (
                                                                            <div className="flex items-center gap-2 text-muted-foreground px-1">
                                                                                <Phone className="h-4 w-4 shrink-0" />
                                                                                <span>{consultation.phone || "Sem Telefone"}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Responsável</Label>
                                                                        <div className="flex items-center gap-2 text-muted-foreground px-1 py-1.5">
                                                                            <Clock className="h-4 w-4 shrink-0" />
                                                                            <span>{consultation.receptionist_name || "Desconhecido"}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Recolhimento de Dados Section */}
                                                                <div className="bg-accent/20 p-5 rounded-2xl border border-border/40 space-y-4">
                                                                    <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
                                                                        <RefreshCw className="h-4 w-4" />
                                                                        Recolhimento de Dados
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">SISREG</Label>
                                                                            {editingId === consultation.id ? (
                                                                                <Input
                                                                                    className="h-10 rounded-xl bg-white/50"
                                                                                    value={editForm?.sisreg || ""}
                                                                                    onChange={(e) => setEditForm({ ...editForm!, sisreg: e.target.value })}
                                                                                />
                                                                            ) : (
                                                                                <div className="px-3 py-2 bg-white/50 rounded-xl text-sm font-bold border border-border/30 truncate">
                                                                                    {consultation.sisreg || "-"}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Data Nasc.</Label>
                                                                            {editingId === consultation.id ? (
                                                                                <Input
                                                                                    type="date"
                                                                                    className="h-10 rounded-xl bg-white/50"
                                                                                    value={editForm?.birth_date || ""}
                                                                                    onChange={(e) => setEditForm({ ...editForm!, birth_date: e.target.value })}
                                                                                />
                                                                            ) : (
                                                                                <div className="px-3 py-2 bg-white/50 rounded-xl text-sm font-bold border border-border/30">
                                                                                    {consultation.birth_date ? format(new Date(consultation.birth_date), "dd/MM/yyyy") : "-"}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Procedência</Label>
                                                                            {editingId === consultation.id ? (
                                                                                <Input
                                                                                    className="h-10 rounded-xl bg-white/50"
                                                                                    value={editForm?.procedencia || ""}
                                                                                    onChange={(e) => setEditForm({ ...editForm!, procedencia: e.target.value.toUpperCase() })}
                                                                                />
                                                                            ) : (
                                                                                <div className="px-3 py-2 bg-white/50 rounded-xl text-sm font-bold border border-border/30 truncate">
                                                                                    {consultation.procedencia || "-"}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Município</Label>
                                                                            {editingId === consultation.id ? (
                                                                                <Input
                                                                                    className="h-10 rounded-xl bg-white/50"
                                                                                    value={editForm?.municipio || ""}
                                                                                    onChange={(e) => setEditForm({ ...editForm!, municipio: e.target.value.toUpperCase() })}
                                                                                />
                                                                            ) : (
                                                                                <div className="px-3 py-2 bg-white/50 rounded-xl text-sm font-bold border border-border/30 truncate">
                                                                                    {consultation.municipio || "-"}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Destino</Label>
                                                                            {editingId === consultation.id ? (
                                                                                <Select
                                                                                    value={editForm?.destination || ""}
                                                                                    onValueChange={(val) => setEditForm({ ...editForm!, destination: val, status: val === 'Falta' ? 'Falta' : 'Atendido' })}
                                                                                >
                                                                                    <SelectTrigger className="h-10 rounded-xl bg-white/50">
                                                                                        <SelectValue placeholder="Selecione..." />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="Alta">Alta</SelectItem>
                                                                                        <SelectItem value="Falta">Falta</SelectItem>
                                                                                        <SelectItem value="Retorno">Retorno</SelectItem>
                                                                                        <SelectItem value="Aviso Cirurgico">Aviso Cirúrgico</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            ) : (
                                                                                <div className="px-3 py-2 bg-white/50 rounded-xl text-sm font-bold border border-border/30 truncate">
                                                                                    {consultation.destination || "-"}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
