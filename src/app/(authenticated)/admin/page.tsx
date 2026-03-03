"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { users as initialUsers, type User } from "@/lib/data"
import { AddReceptionistModal } from "@/components/add-receptionist-modal"
import { AddDoctorModal } from "@/components/add-doctor-modal"
import { EditReceptionistModal } from "@/components/edit-receptionist-modal"
import { EditDoctorModal } from "@/components/edit-doctor-modal"
import { EditProcedenciaModal } from "@/components/edit-procedencia-modal"
import { ExportPDFModal } from "@/components/export-pdf-modal"
import { ExportCSVModal } from "@/components/export-csv-modal"
import { ImportCSVModal } from "@/components/import-csv-modal"
import { LogoUploadSection } from "@/components/logo-upload-section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users,
  Shield,
  Database,
  FileSpreadsheet,
  UserCog,
  Activity,
  AlertTriangle,
  Stethoscope,
  Trash2,
  Baby,
  Home,
  Building2,
  Clock,
  Plus,
  CalendarDays,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { DoctorSlotsManager } from "@/components/doctor-slots-manager"

export default function AdminPage() {
  const {
    user,
    patients,
    doctors,
    removeDoctor,
    receptionists,
    removeReceptionist,
    procedencias,
    removeProcedencia,
    visitingHours,
    updateVisitingHours,
    addProcedencia,
    consultations,
  } = useAuth()
  const router = useRouter()

  const [usersList, setUsersList] = useState<User[]>(initialUsers)
  const [hoursForm, setHoursForm] = useState({
    enfermaria: "",
    uti: "",
    trocas_acompanhantes: "",
  })
  const [newProcedenciaName, setNewProcedenciaName] = useState("")
  const [addingProcedencia, setAddingProcedencia] = useState(false)

  useEffect(() => {
    const storedUsers = localStorage.getItem("hto_users")
    if (storedUsers) {
      setUsersList(JSON.parse(storedUsers))
    }
  }, [])

  useEffect(() => {
    if (visitingHours) {
      setHoursForm({
        enfermaria: visitingHours.enfermaria || "",
        uti: visitingHours.uti || "",
        trocas_acompanhantes: visitingHours.trocas_acompanhantes || "",
      })
    }
  }, [visitingHours])

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  const stats = useMemo(() => {
    const receptionistStats: Record<string, number> = {}
    const cityStats: Record<string, number> = {}

    let childrenCount = 0
    let residenciaCount = 0

    patients.forEach((p) => {
      const rec = p.recepcionista?.toUpperCase() || "NÃO INFORMADO"
      receptionistStats[rec] = (receptionistStats[rec] || 0) + 1

      const city = p.cidadeOrigem?.toUpperCase() || "NÃO INFORMADO"
      cityStats[city] = (cityStats[city] || 0) + 1

      const age = Number.parseInt(p.idade) || 0
      if (age >= 0 && age <= 13) childrenCount++

      if (
        p.isResidencia ||
        p.procedencia?.toUpperCase() === "RESIDÊNCIA" ||
        p.procedencia?.toUpperCase() === "RESIDENCIA"
      ) {
        residenciaCount++
      }
    })

    return {
      totalPatients: patients.length,
      receptionistStats,
      cityStats,
      childrenCount,
      residenciaCount,
    }
  }, [patients])

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md shadow-card-hover border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleRemoveDoctor = async (doctorId: string) => {
    if (doctorId === "1") return
    await removeDoctor(doctorId)
  }

  const handleRemoveReceptionist = async (receptionistId: string) => {
    await removeReceptionist(receptionistId)
    const receptionist = receptionists.find((r) => r.id === receptionistId)
    if (receptionist) {
      const updatedUsers = usersList.filter((u) => u.username !== receptionist.username)
      setUsersList(updatedUsers)
      localStorage.setItem("hto_users", JSON.stringify(updatedUsers))
    }
  }

  const handleRemoveProcedencia = async (procedenciaId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta unidade?")) {
      await removeProcedencia(procedenciaId)
    }
  }

  const handleUpdateVisitingHours = async () => {
    await updateVisitingHours(hoursForm)
    alert("Horários de visita atualizados com sucesso!")
  }

  const handleAddProcedencia = async () => {
    if (!newProcedenciaName.trim()) return

    setAddingProcedencia(true)
    try {
      await addProcedencia(newProcedenciaName)
      setNewProcedenciaName("")
      alert("Unidade cadastrada com sucesso!")
    } catch (error) {
      alert("Erro ao cadastrar unidade")
    } finally {
      setAddingProcedencia(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 ease-out pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold font-space tracking-tight gradient-text">Administração</h1>
          <p className="text-muted-foreground font-medium">Configurações globais e gerenciamento do sistema</p>
        </div>
        <div className="flex items-center gap-2 bg-card/40 backdrop-blur-sm border border-border/40 p-1.5 rounded-2xl shadow-soft">
          <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            MODO ADMIN
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-primary/15 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Usuários</p>
              <p className="text-3xl font-bold text-foreground mt-1">{receptionists.length + 1}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-secondary/15 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Internações</p>
              <p className="text-3xl font-bold text-foreground mt-1">{stats.totalPatients}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10">
              <Database className="h-5 w-5 text-secondary" />
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-chart-3/15 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Recepcionistas</p>
              <p className="text-3xl font-bold text-foreground mt-1">{receptionists.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-chart-3/20 to-chart-3/10">
              <UserCog className="h-5 w-5 text-chart-3" />
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-emerald-500/15 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Médicos</p>
              <p className="text-3xl font-bold text-foreground mt-1">{doctors.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10">
              <Stethoscope className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-pink-500/15 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Crianças (0-13)</p>
              <p className="text-3xl font-bold text-foreground mt-1">{stats.childrenCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/10">
              <Baby className="h-5 w-5 text-pink-500" />
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-violet-500/15 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Residência</p>
              <p className="text-3xl font-bold text-foreground mt-1">{stats.residenciaCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/10">
              <Home className="h-5 w-5 text-violet-500" />
            </div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-orange-500/15 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Consultas</p>
              <p className="text-3xl font-bold text-foreground mt-1">{consultations.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10">
              <CalendarDays className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Receptionists Table */}
      <Card className="shadow-card border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              Recepcionistas do Sistema
            </CardTitle>
            <CardDescription className="mt-1.5 ml-12">Gerenciar recepcionistas e acesso ao sistema</CardDescription>
          </div>
          <AddReceptionistModal />
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/30 hover:bg-accent/30">
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">Usuário</TableHead>
                  <TableHead className="font-semibold">Senha</TableHead>
                  <TableHead className="font-semibold">Atendimentos</TableHead>
                  <TableHead className="w-[100px] font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-accent/20">
                  <TableCell className="font-medium">Administrador</TableCell>
                  <TableCell className="text-muted-foreground">admin</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">••••••••</TableCell>
                  <TableCell className="text-muted-foreground">-</TableCell>
                  <TableCell>
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0">
                      Admin
                    </Badge>
                  </TableCell>
                </TableRow>
                {receptionists.map((r) => (
                  <TableRow key={r.id} className="hover:bg-accent/20">
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.username}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">@htocaxias</TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">
                        {stats.receptionistStats[r.name.toUpperCase()] || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditReceptionistModal receptionist={r} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleRemoveReceptionist(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card className="shadow-card border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Stethoscope className="h-5 w-5 text-emerald-500" />
              </div>
              Cadastro de Médicos
            </CardTitle>
            <CardDescription className="mt-1.5 ml-12">Lista de médicos para internações</CardDescription>
          </div>
          <AddDoctorModal />
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/30 hover:bg-accent/30">
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">Especialidade</TableHead>
                  <TableHead className="w-[100px] font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-accent/20">
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg bg-accent/50 border-border/50">
                        {doc.specialty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditDoctorModal doctor={doc} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleRemoveDoctor(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Procedencias Management Section */}
      <Card className="shadow-card border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              Unidades de Procedência
            </CardTitle>
            <CardDescription className="mt-1.5 ml-12">Gerenciar unidades de saúde cadastradas</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Digite o nome da nova unidade..."
                value={newProcedenciaName}
                onChange={(e) => setNewProcedenciaName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddProcedencia()
                  }
                }}
              />
            </div>
            <Button onClick={handleAddProcedencia} disabled={addingProcedencia || !newProcedenciaName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/30 hover:bg-accent/30">
                  <TableHead className="font-semibold">Nome da Unidade</TableHead>
                  <TableHead className="w-[120px] font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedencias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      Nenhuma unidade cadastrada
                    </TableCell>
                  </TableRow>
                ) : (
                  procedencias
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((proc) => (
                      <TableRow key={proc.id} className="hover:bg-accent/20">
                        <TableCell className="font-medium">{proc.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <EditProcedenciaModal procedencia={proc} />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                              onClick={() => handleRemoveProcedencia(proc.id)}
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
          </div>
        </CardContent>
      </Card>

      {/* Visiting Hours Management Section */}
      <Card className="shadow-card border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-xl bg-indigo-500/10">
              <Clock className="h-5 w-5 text-indigo-500" />
            </div>
            Horários de Visitas
          </CardTitle>
          <CardDescription className="ml-12">
            Configure os horários de visita que serão exibidos na ficha de internação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enfermaria">Enfermaria</Label>
              <Input
                id="enfermaria"
                placeholder="Ex: 14h às 16h e 18h às 20h"
                value={hoursForm.enfermaria}
                onChange={(e) => setHoursForm({ ...hoursForm, enfermaria: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uti">UTI</Label>
              <Input
                id="uti"
                placeholder="Ex: 10h às 11h e 16h às 17h"
                value={hoursForm.uti}
                onChange={(e) => setHoursForm({ ...hoursForm, uti: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trocas">Horários de Trocas de Acompanhantes</Label>
              <Input
                id="trocas"
                placeholder="Ex: 8h, 14h e 20h"
                value={hoursForm.trocas_acompanhantes}
                onChange={(e) => setHoursForm({ ...hoursForm, trocas_acompanhantes: e.target.value })}
              />
            </div>
            <Button onClick={handleUpdateVisitingHours} className="w-full">
              Salvar Horários de Visita
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consultation Vacancy Management Section */}
      <DoctorSlotsManager />

      {/* Logo Upload Section */}
      <LogoUploadSection />

      {/* Export Section */}
      <Card className="shadow-card border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-xl bg-chart-4/10">
              <FileSpreadsheet className="h-5 w-5 text-chart-4" />
            </div>
            Importar / Exportar Dados
          </CardTitle>
          <CardDescription className="ml-12">Gerenciar dados das internações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <ImportCSVModal />
            <ExportPDFModal patients={patients} />
            <ExportCSVModal
              patients={patients}
              selectedCity={null}
              selectedDestination={null}
              selectedMonth={null}
              selectedYear={null}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card className="shadow-card border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-xl bg-secondary/10">
              <Activity className="h-5 w-5 text-secondary" />
            </div>
            Resumo por Recepcionista
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(stats.receptionistStats)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => (
                <div
                  key={name}
                  className="p-5 rounded-2xl bg-accent/30 hover:bg-accent/50 transition-all duration-300 hover:-translate-y-0.5 text-center border border-border/30"
                >
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {count}
                  </p>
                  <p className="text-sm text-muted-foreground truncate mt-1 font-medium">{name}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
