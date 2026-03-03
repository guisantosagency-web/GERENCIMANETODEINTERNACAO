"use client"

import { useState, useMemo, useEffect } from "react"
import type { Patient } from "@/lib/data"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Eye, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText } from "lucide-react"
import { FichaInternacaoModal } from "./ficha-internacao-modal"
import { cn } from "@/lib/utils"

interface PatientTableProps {
  patients: Patient[]
  onEdit?: (patient: Patient) => void
  showActions?: boolean
  search: string
}

export function PatientTable({ patients, onEdit, showActions = true, search }: PatientTableProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const { deletePatient } = useAuth()

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)

  // Resetar para página 1 ao buscar
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const filteredPatients = useMemo(() => {
    let filtered = patients
    if (search) {
      const s = search.toLowerCase()
      filtered = patients.filter(
        (p) =>
          (p.paciente || "").toLowerCase().includes(s) ||
          (p.prontuario || "").toLowerCase().includes(s) ||
          (p.procedimento || "").toLowerCase().includes(s) ||
          (p.cidadeOrigem || "").toLowerCase().includes(s) ||
          (p.telefone && p.telefone.includes(s)) ||
          (p.cpf && p.cpf.includes(s)),
      )
    }

    // Função para extrair o número do prontuário (ex: P10109/26 -> 10109)
    const getProntuarioNum = (pront: string) => {
      const match = pront.match(/P(\d+)/)
      return match ? parseInt(match[1]) : 0
    }

    // Ordenar por número de prontuário e ordem
    return [...filtered].sort((a, b) => {
      const numA = getProntuarioNum(a.prontuario || "")
      const numB = getProntuarioNum(b.prontuario || "")
      if (numA !== numB) return numA - numB
      return (Number(a.ordem) || 0) - (Number(b.ordem) || 0)
    })
  }, [patients, search])

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)

  // Ir para a última página quando um novo paciente for adicionado
  const [prevCount, setPrevCount] = useState(patients.length)
  useEffect(() => {
    if (patients.length > prevCount) {
      const newTotalPages = Math.ceil(filteredPatients.length / itemsPerPage)
      setCurrentPage(newTotalPages)
    }
    setPrevCount(patients.length)
  }, [patients.length, filteredPatients.length, itemsPerPage, prevCount])
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredPatients.slice(start, start + itemsPerPage)
  }, [filteredPatients, currentPage, itemsPerPage])

  const getLeiteType = (leito: string) => {
    const l = leito.toUpperCase()
    if (l.includes("UTI")) return "destructive"
    if (l.includes("ALA")) return "default"
    return "secondary"
  }

  const handleDeleteConfirm = async () => {
    if (patientToDelete) {
      await deletePatient(patientToDelete.id)
      setDeleteDialogOpen(false)
      setPatientToDelete(null)
    }
  }

  const handleOpenDetails = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsDetailsOpen(true)
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] glass-card border-none shadow-premium overflow-hidden bg-card/40">
        <div className="overflow-x-auto no-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/10">
                <TableHead className="w-16 px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">#</TableHead>
                <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Prontuário</TableHead>
                <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Data</TableHead>
                <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Paciente</TableHead>
                <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">CPF</TableHead>
                <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Cidade</TableHead>
                <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Leito</TableHead>
                <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map((patient, index) => (
                  <TableRow key={patient.id} className="group hover:bg-primary/[0.04] transition-all duration-500 border-b border-border/5 last:border-0 relative">
                    <TableCell className="px-8 py-6">
                      <span className="font-black font-space text-primary/30 group-hover:text-primary group-hover:scale-110 inline-block transition-all">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                      <div className="relative inline-block">
                        <Badge variant="outline" className="font-mono text-[10px] font-black py-1.5 px-3 bg-background/50 border-border/20 rounded-xl group-hover:border-primary/40 group-hover:bg-background transition-all shadow-sm">
                          {patient.prontuario}
                        </Badge>
                        <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-sm text-foreground/80 group-hover:text-foreground transition-colors">{patient.data}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Registrado</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-base text-foreground group-hover:text-primary transition-all uppercase tracking-tight leading-none">
                          {patient.paciente}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted/20 px-2 py-0.5 rounded-md">
                            {patient.idade} ANOS
                          </span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted/20 px-2 py-0.5 rounded-md">
                            {patient.sexo}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                      <span className="text-xs font-bold text-muted-foreground/60 font-mono tracking-tighter group-hover:text-muted-foreground transition-colors">{patient.cpf || "-"}</span>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary/40 group-hover:bg-secondary group-hover:scale-125 transition-all" />
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">{patient.cidadeOrigem || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                      <Badge
                        variant={getLeiteType(patient.leito)}
                        className={cn(
                          "text-[10px] px-4 py-1.5 font-black rounded-xl shadow-lg transition-all duration-500 uppercase tracking-widest border-none",
                          getLeiteType(patient.leito) === "destructive" && "bg-red-500 text-white shadow-red-500/20 group-hover:shadow-red-500/40 group-hover:scale-105",
                          getLeiteType(patient.leito) === "default" && "bg-primary text-primary-foreground shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-105",
                          getLeiteType(patient.leito) === "secondary" && "bg-blue-500 text-white shadow-blue-500/20 group-hover:shadow-blue-500/40 group-hover:scale-105"
                        )}
                      >
                        {patient.leito}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-40 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <FichaInternacaoModal patient={patient} />

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all duration-300"
                          onClick={() => handleOpenDetails(patient)}
                        >
                          <Eye className="h-5 w-5" />
                        </Button>

                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-2xl hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-300"
                            onClick={() => onEdit(patient)}
                          >
                            <Edit className="h-5 w-5" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
                          onClick={() => {
                            setPatientToDelete(patient)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                      <div className="p-4 rounded-3xl bg-muted/10">
                        <Search className="h-10 w-10 opacity-20" />
                      </div>
                      <p className="font-bold text-lg">Nenhum resultado encontrado</p>
                      <p className="text-sm max-w-xs mx-auto opacity-60">Tente ajustar seus filtros ou busca para encontrar o que procura.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Container */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 py-4">
          <div className="flex items-center gap-3 bg-card/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-border/10 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Mostrando <span className="text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-foreground">{Math.min(currentPage * itemsPerPage, filteredPatients.length)}</span> de <span className="text-foreground font-black">{filteredPatients.length}</span> registros
            </p>
          </div>

          <div className="flex items-center gap-2 bg-card/40 backdrop-blur-md p-1.5 rounded-2xl border border-border/10 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-30"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-30"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 mx-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum = currentPage
                if (currentPage <= 3) pageNum = i + 1
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = currentPage - 2 + i

                if (pageNum < 1 || pageNum > totalPages) return null

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-xl font-black font-space transition-all duration-500",
                      currentPage === pageNum
                        ? "bg-primary text-primary-foreground shadow-indicator"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-30"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-30"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modern Patient Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl rounded-[3rem] border-none shadow-premium p-0 overflow-hidden glass-card !bg-card/95">
          <div className="relative p-10 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 overflow-hidden">
            <div className="absolute top-0 right-0 p-20 opacity-5 -rotate-12">
              <FileText className="h-64 w-64" />
            </div>

            <DialogHeader className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20 mb-4">
                <FileText className="h-3 w-3" />
                Dossiê Médico Completo
              </div>
              <DialogTitle className="text-5xl font-black font-space tracking-tight text-foreground uppercase">
                Detalhes do Paciente
              </DialogTitle>
              <DialogDescription className="text-lg font-medium text-muted-foreground mt-2">
                Monitoramento clínico e administrativo da internação.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedPatient && (
            <div className="p-10 pt-0 overflow-y-auto max-h-[60vh] no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { label: "Paciente", value: selectedPatient.paciente, full: true, highlight: true },
                  { label: "Prontuário", value: selectedPatient.prontuario, badge: true },
                  { label: "CPF", value: selectedPatient.cpf || "-" },
                  { label: "Data Nasc.", value: selectedPatient.dataNascimento },
                  { label: "Idade", value: `${selectedPatient.idade} anos` },
                  { label: "Sexo", value: selectedPatient.sexo },
                  { label: "Cartão SUS", value: selectedPatient.sus || "-" },
                  { label: "Telefone", value: selectedPatient.telefone || "-", bold: true },
                  { label: "Cidade Origem", value: selectedPatient.cidadeOrigem, bold: true },

                  { label: "Estado", value: selectedPatient.estado },
                  { label: "Internação", value: `${selectedPatient.data} às ${selectedPatient.horario}`, bold: true },
                  { label: "Leito Atual", value: selectedPatient.leito, badge: true, variant: getLeiteType(selectedPatient.leito) },
                  { label: "Procedência", value: selectedPatient.procedencia },
                  { label: "Destino", value: selectedPatient.destino, bold: true },
                  { label: "Médico Resp.", value: selectedPatient.medico },
                  { label: "Recepcionista", value: selectedPatient.recepcionista },
                  { label: "Procedimento", value: selectedPatient.procedimento, full: true, box: true },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "flex flex-col gap-1.5 p-4 rounded-2xl bg-muted/5 border border-border/5 hover:bg-muted/10 transition-colors",
                    item.full && "md:col-span-2 lg:col-span-3",
                    item.box && "bg-primary/[0.03] border-primary/10 p-6"
                  )}>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</span>
                    {item.badge ? (
                      <Badge variant={(item.variant as any) || "outline"} className="w-fit text-xs font-black px-3 py-1 rounded-xl shadow-sm uppercase tracking-wider">
                        {item.value}
                      </Badge>
                    ) : (
                      <span className={cn(
                        "text-sm font-bold text-foreground/90",
                        item.highlight && "text-2xl font-black text-primary uppercase tracking-tight",
                        item.bold && "text-foreground font-black",
                        item.box && "text-base text-primary/80 leading-relaxed font-bold"
                      )}>
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-8 bg-card/50 backdrop-blur-xl border-t border-border/10 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="rounded-2xl px-8 h-12 border-border/20 font-black uppercase text-xs tracking-widest hover:bg-muted/10">
              Fechar
            </Button>
            <Button className="rounded-2xl px-10 h-12 shadow-premium font-black uppercase text-xs tracking-widest">
              Imprimir Dossiê
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Minimal Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-premium p-10 glass-card">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="p-5 rounded-[2rem] bg-red-500/10 text-red-500 shadow-indicator animate-bounce-slow">
              <Trash2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black font-space tracking-tight text-red-500 uppercase">Atenção!</DialogTitle>
                <DialogDescription asChild className="text-base font-medium text-muted-foreground">
                  <div>
                    Você está prestes a excluir permanentemente o registro de:
                    <div className="mt-4 p-4 rounded-2xl bg-muted/10 border border-border/10">
                      <span className="block font-black text-foreground text-lg uppercase">{patientToDelete?.paciente}</span>
                      <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Prontuário: {patientToDelete?.prontuario}</span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex w-full gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest border-border/20">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20 bg-red-500 hover:bg-red-600">
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
