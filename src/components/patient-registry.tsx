"use client"

import { useState, useMemo } from "react"
import { useAuth, type Patient } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Trash2, User, Phone, Fingerprint, FileText, X, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function PatientRegistry() {
    const { patients, updatePatient, deletePatient } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)

    const filteredPatients = useMemo(() => {
        return patients.filter(p =>
            p.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.cpf && p.cpf.includes(searchTerm)) ||
            (p.sus && p.sus.includes(searchTerm))
        ).sort((a, b) => a.paciente.localeCompare(b.paciente))
    }, [patients, searchTerm])

    const handleEdit = (patient: Patient) => {
        setEditingPatient({ ...patient })
        setIsEditOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!editingPatient) return
        const result = await updatePatient(editingPatient)
        if (result.success) {
            setIsEditOpen(false)
            setEditingPatient(null)
        } else {
            alert(result.message)
        }
    }

    const handleDelete = async (patient: Patient) => {
        setPatientToDelete(patient)
        setIsDeleting(true)
    }

    const confirmDelete = async () => {
        if (!patientToDelete) return
        await deletePatient(patientToDelete.id)
        setIsDeleting(false)
        setPatientToDelete(null)
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-soft border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Pesquisar paciente por nome, CPF ou SUS..."
                            className="pl-10 rounded-xl h-12 bg-accent/20 border-border/40 focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-premium border-border/50 bg-card/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-accent/30 hover:bg-accent/30 border-b border-border/40">
                            <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">Paciente</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">Identificação</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest py-5">Contato</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 text-right px-6">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPatients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                                    Nenhum paciente encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPatients.map(patient => (
                                <TableRow key={patient.id} className="hover:bg-accent/10 transition-colors border-b border-border/20 group">
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-foreground uppercase leading-none">{patient.paciente}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold mt-1">
                                                    {patient.dataNascimento || "Data de nasc. não informada"}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Fingerprint className="h-3 w-3" />
                                                <span className="font-mono">CPF: {patient.cpf || "-"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <FileText className="h-3 w-3" />
                                                <span className="font-mono">SUS: {patient.sus || "-"}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                                            <Phone className="h-3 w-3 text-primary" />
                                            {patient.telefone || "Sem telefone"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                                                onClick={() => handleEdit(patient)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                                                onClick={() => handleDelete(patient)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] p-8 glass-card border-none shadow-premium">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black gradient-text uppercase tracking-tight">Editar Paciente</DialogTitle>
                        <DialogDescription>Atualize os dados cadastrais do paciente no sistema.</DialogDescription>
                    </DialogHeader>

                    {editingPatient && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Nome Completo</Label>
                                <Input
                                    value={editingPatient.paciente}
                                    onChange={(e) => setEditingPatient({ ...editingPatient, paciente: e.target.value.toUpperCase() })}
                                    className="rounded-xl h-11 bg-accent/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">CPF</Label>
                                <Input
                                    value={editingPatient.cpf}
                                    onChange={(e) => setEditingPatient({ ...editingPatient, cpf: e.target.value })}
                                    className="rounded-xl h-11 bg-accent/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Cartão SUS</Label>
                                <Input
                                    value={editingPatient.sus}
                                    onChange={(e) => setEditingPatient({ ...editingPatient, sus: e.target.value })}
                                    className="rounded-xl h-11 bg-accent/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Telefone</Label>
                                <Input
                                    value={editingPatient.telefone}
                                    onChange={(e) => setEditingPatient({ ...editingPatient, telefone: e.target.value })}
                                    className="rounded-xl h-11 bg-accent/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Data Nascimento</Label>
                                <Input
                                    value={editingPatient.dataNascimento}
                                    onChange={(e) => setEditingPatient({ ...editingPatient, dataNascimento: e.target.value })}
                                    className="rounded-xl h-11 bg-accent/20"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-8 gap-2">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl h-12 px-6 font-bold">
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveEdit} className="rounded-xl h-12 px-8 font-black shadow-premium">
                            <Save className="h-4 w-4 mr-2" />
                            SALVAR ALTERAÇÕES
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                <DialogContent className="max-w-md rounded-[2.5rem] p-10 glass-card border-none shadow-premium text-center">
                    <div className="flex flex-col items-center gap-6">
                        <div className="p-5 rounded-[2rem] bg-red-500/10 text-red-500 shadow-indicator">
                            <Trash2 className="h-10 w-10 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-red-500 uppercase tracking-tight">Confirma exclusão?</h3>
                            <p className="text-muted-foreground font-medium">
                                O paciente <span className="text-foreground font-black uppercase">{patientToDelete?.paciente}</span> será removido permanentemente do sistema.
                            </p>
                        </div>
                        <div className="flex w-full gap-3 mt-4">
                            <Button variant="outline" onClick={() => setIsDeleting(false)} className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest border-border/20">
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete} className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20 bg-red-500">
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
