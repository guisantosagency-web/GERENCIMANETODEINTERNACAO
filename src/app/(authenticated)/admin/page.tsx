"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
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
  LayoutDashboard,
  Settings,
  Cog,
  FlaskConical,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  // Exam Config State
  const [procedures, setProcedures] = useState<string[]>([])
  const [examTypes, setExamTypes] = useState<{ procedure: string, name: string }[]>([])
  const [newProcName, setNewProcName] = useState("")
  const [newExamTypeProc, setNewExamTypeProc] = useState("")
  const [newExamTypeName, setNewExamTypeName] = useState("")

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
    } else {
      loadExamConfigs()
    }
  }, [user, router])

  const supabase = useMemo(() => createClient(), [])

  const loadExamConfigs = async () => {
    try {
      const { data: procs } = await supabase.from("exam_procedures_list").select("*")
      const { data: types } = await supabase.from("exam_types_list").select("*")
      
      if (procs) setProcedures(procs.map((p: any) => p.name))
      if (types) setExamTypes(types.map((t: any) => ({ procedure: t.procedure_name, name: t.name })))
    } catch (e) {
       console.error(e)
    }
  }

  const handleAddProc = async () => {
    if (!newProcName.trim()) return
    await supabase.from("exam_procedures_list").insert([{ name: newProcName.trim() }])
    setNewProcName("")
    loadExamConfigs()
  }

  const handleDeleteProc = async (name: string) => {
    if (!confirm(`Remover procedimento "${name}"?`)) return
    await supabase.from("exam_procedures_list").delete().eq("name", name)
    loadExamConfigs()
  }

  const handleAddExamType = async () => {
    if (!newExamTypeProc || !newExamTypeName.trim()) return
    await supabase.from("exam_types_list").insert([{ procedure_name: newExamTypeProc, name: newExamTypeName.trim() }])
    setNewExamTypeName("")
    loadExamConfigs()
  }

  const handleDeleteExamType = async (proc: string, name: string) => {
    if (!confirm(`Remover tipo "${name}" de "${proc}"?`)) return
    await supabase.from("exam_types_list").delete().eq("procedure_name", proc).eq("name", name)
    loadExamConfigs()
  }

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

      <Tabs defaultValue="dashboard" className="space-y-8">
        <TabsList className="bg-card/40 backdrop-blur-sm border border-border/40 p-1.5 rounded-2xl h-auto flex flex-wrap gap-2">
          <TabsTrigger value="dashboard" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
            <Users className="h-4 w-4" /> Equipe
          </TabsTrigger>
          <TabsTrigger value="flow" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
            <Activity className="h-4 w-4" /> Fluxo
          </TabsTrigger>
          <TabsTrigger value="exams" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
            <FlaskConical className="h-4 w-4" /> Exames
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
            <Settings className="h-4 w-4" /> Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          </div>

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
        </TabsContent>

        <TabsContent value="team" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="grid grid-cols-1 gap-8">
        {/* Receptionists Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-4 px-2">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Gerenciamento de Equipe</h2>
          </div>
          
          <Card className="shadow-premium border-border/50 bg-card/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/10 bg-slate-50/50">
              <div>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  Recepcionistas
                </CardTitle>
                <CardDescription className="mt-1 ml-12">Usuários com acesso ao sistema</CardDescription>
              </div>
              <AddReceptionistModal />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-border/10">
                      <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8">Nome</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Usuário</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Atendimentos</TableHead>
                      <TableHead className="w-[120px] font-black text-[10px] uppercase tracking-widest text-right pr-8">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-primary/5 transition-colors group">
                      <TableCell className="pl-8 font-bold flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black">AD</div>
                         Administrador
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">admin</TableCell>
                      <TableCell className="text-center">-</TableCell>
                      <TableCell className="pr-8 text-right">
                        <Badge className="bg-primary/10 text-primary border-0 text-[9px] font-black uppercase tracking-tighter">
                          Sistema
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {receptionists.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-50 group transition-colors">
                        <TableCell className="pl-8 font-bold flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-black group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {r.name.slice(0, 2).toUpperCase()}
                          </div>
                          {r.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{r.username}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                            {stats.receptionistStats[r.name.toUpperCase()] || 0}
                          </span>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </section>

        {/* Doctors Section */}
        <section className="space-y-4">
          <Card className="shadow-premium border-border/50 bg-card/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/10 bg-slate-50/50">
              <div>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-emerald-500/10">
                    <Stethoscope className="h-5 w-5 text-emerald-500" />
                  </div>
                  Corpo Clínico
                </CardTitle>
                <CardDescription className="mt-1 ml-12">Médicos cadastrados no sistema</CardDescription>
              </div>
              <AddDoctorModal />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-border/10">
                      <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8">Nome do Médico</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Especialidade</TableHead>
                      <TableHead className="w-[120px] font-black text-[10px] uppercase tracking-widest text-right pr-8">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-slate-50 group transition-colors">
                        <TableCell className="pl-8 font-bold flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                              DR
                           </div>
                           {doc.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg bg-emerald-50/50 border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 uppercase tracking-tighter">
                            {doc.specialty}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </section>
      </div>

        </TabsContent>

        <TabsContent value="flow" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-8">
            <DoctorSlotsManager />
          </div>

          <div className="space-y-8">
            {/* Procedencias Management Section */}
            <Card className="shadow-premium border-border/50 bg-card/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/10 bg-slate-50/50">
                <div>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-xl bg-blue-500/10">
                      <Building2 className="h-5 w-5 text-blue-500" />
                    </div>
                    Unidades de Procedência
                  </CardTitle>
                  <CardDescription className="mt-1 ml-12">Origens de pacientes</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6 flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Nome da nova unidade..."
                      value={newProcedenciaName}
                      onChange={(e) => setNewProcedenciaName(e.target.value)}
                      className="rounded-xl border-slate-200 bg-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddProcedencia()
                        }
                      }}
                    />
                  </div>
                  <Button onClick={handleAddProcedencia} disabled={addingProcedencia || !newProcedenciaName.trim()} className="rounded-xl font-bold">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                <div className="rounded-2xl border border-border/50 bg-white/50 overflow-auto max-h-[400px] custom-scrollbar">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-border/10">
                      <TableRow className="hover:bg-slate-50/50">
                        <TableHead className="font-black text-[10px] uppercase tracking-widest pl-6">Nome</TableHead>
                        <TableHead className="w-[100px] font-black text-[10px] uppercase tracking-widest text-right pr-6">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {procedencias.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-8 italic text-sm">
                            Nenhuma unidade cadastrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        procedencias
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((proc) => (
                            <TableRow key={proc.id} className="hover:bg-blue-50/30 transition-colors group">
                              <TableCell className="font-bold pl-6 text-slate-700 uppercase text-xs tracking-tight">{proc.name}</TableCell>
                              <TableCell className="pr-6 text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <Card className="shadow-premium border-border/50 bg-card/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/10 bg-slate-50/50">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-indigo-500/10">
                    <Clock className="h-5 w-5 text-indigo-500" />
                  </div>
                  Horários de Visitas
                </CardTitle>
                <CardDescription className="ml-12">Exibidos na ficha de internação</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="enfermaria" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Enfermaria</Label>
                    <Input
                      id="enfermaria"
                      placeholder="Ex: 14h às 16h e 18h às 20h"
                      value={hoursForm.enfermaria}
                      onChange={(e) => setHoursForm({ ...hoursForm, enfermaria: e.target.value })}
                      className="rounded-xl border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uti" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">UTI</Label>
                    <Input
                      id="uti"
                      placeholder="Ex: 10h às 11h e 16h às 17h"
                      value={hoursForm.uti}
                      onChange={(e) => setHoursForm({ ...hoursForm, uti: e.target.value })}
                      className="rounded-xl border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trocas" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Trocas de Acompanhantes</Label>
                    <Input
                      id="trocas"
                      placeholder="Ex: 8h, 14h e 20h"
                      value={hoursForm.trocas_acompanhantes}
                      onChange={(e) => setHoursForm({ ...hoursForm, trocas_acompanhantes: e.target.value })}
                      className="rounded-xl border-slate-200 bg-white"
                    />
                  </div>
                </div>
                <Button onClick={handleUpdateVisitingHours} className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                  Atualizar Horários
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </TabsContent>

        <TabsContent value="exams" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <Card className="shadow-premium border-border/50 bg-card/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/10 bg-slate-50/50">
               <div>
                 <CardTitle className="flex items-center gap-3 text-lg">
                   <div className="p-2 rounded-xl bg-amber-500/10">
                     <FlaskConical className="h-5 w-5 text-amber-500" />
                   </div>
                   Catálogo de Agendamento
                 </CardTitle>
                 <CardDescription className="mt-1 ml-12">Procedimentos e Tipos de Exame</CardDescription>
               </div>
             </CardHeader>
             <CardContent className="pt-8">
                <div className="grid md:grid-cols-2 gap-12">
                   {/* Procedimentos */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="h-6 w-1 bg-amber-500 rounded-full" />
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Procedimentos</h4>
                      </div>
                      <div className="flex gap-2">
                         <Input 
                            placeholder="Novo Procedimento..." 
                            value={newProcName} 
                            onChange={e => setNewProcName(e.target.value)} 
                            className="rounded-xl border-slate-200 bg-white"
                         />
                         <Button onClick={handleAddProc} size="icon" className="h-10 w-10 shrink-0 bg-amber-500 hover:bg-amber-600 rounded-xl"><Plus className="h-4 w-4" /></Button>
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {procedures.map(p => (
                            <div key={p} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 group shadow-sm hover:shadow-md transition-all">
                               <span className="font-bold text-xs uppercase tracking-tight text-slate-700">{p}</span>
                               <Button variant="ghost" size="icon" onClick={() => handleDeleteProc(p)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Tipos de Exame */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="h-6 w-1 bg-amber-500 rounded-full" />
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipos por Procedimento</h4>
                      </div>
                      <div className="space-y-3">
                         <select 
                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-amber-500/10 transition-all"
                            value={newExamTypeProc}
                            onChange={e => setNewExamTypeProc(e.target.value)}
                         >
                            <option value="">Selecionar Procedimento...</option>
                            {procedures.map(p => <option key={p} value={p}>{p}</option>)}
                         </select>
                         <div className="flex gap-2">
                            <Input 
                               placeholder="Novo Tipo de Exame..." 
                               value={newExamTypeName} 
                               onChange={e => setNewExamTypeName(e.target.value)} 
                               className="rounded-xl border-slate-200 bg-white"
                            />
                            <Button onClick={handleAddExamType} size="icon" className="h-10 w-10 shrink-0 bg-amber-500 hover:bg-amber-600 rounded-xl"><Plus className="h-4 w-4" /></Button>
                         </div>
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {examTypes.map((t, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 group shadow-sm hover:shadow-md transition-all">
                               <div>
                                  <span className="text-[8px] block font-black text-amber-600 uppercase tracking-widest mb-1">{t.procedure}</span>
                                  <span className="font-black text-xs uppercase text-slate-800">{t.name}</span>
                                </div>
                               <Button variant="ghost" size="icon" onClick={() => handleDeleteExamType(t.procedure, t.name)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <LogoUploadSection />
           
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
