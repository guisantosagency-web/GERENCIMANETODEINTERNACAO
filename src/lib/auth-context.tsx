"use client"
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { format } from "date-fns"
import { users as initialUsers, doctors as initialDoctors, receptionists as initialReceptionists, type User, type Doctor, type Receptionist, type Patient } from "./data"

export interface Logos { logo_hto: string | null; logo_maranhao: string | null; logo_instituto: string | null; logo_sus: string | null }
export interface Procedencia { id: string; name: string }
export interface VisitingHours { id: string; enfermaria: string; uti: string; trocas_acompanhantes: string }
export interface DoctorSlot { id: string; doctor_id: string; date: string; max_slots: number }
export interface Consultation {
  id: string
  patient_id?: number
  patient_name: string
  cpf?: string
  sus_card?: string
  phone?: string
  birth_date?: string
  municipio?: string
  doctor_id: string
  receptionist_name?: string
  date: string
  time?: string
  sisreg?: string
  procedencia?: string
  destination?: string
  status: string
  created_at?: string
}

export interface AuthContextType {
  user: User | null
  login: (u: string, p: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  doctors: Doctor[]
  setDoctors: (d: Doctor[]) => void
  addDoctor: (d: Omit<Doctor, "id">) => Promise<void>
  updateDoctor: (d: Doctor) => Promise<void>
  removeDoctor: (id: string) => Promise<void>
  receptionists: Receptionist[]
  setReceptionists: (r: Receptionist[]) => void
  addReceptionist: (r: Omit<Receptionist, "id">) => Promise<void>
  updateReceptionist: (r: Receptionist) => Promise<void>
  removeReceptionist: (id: string) => Promise<void>
  patients: Patient[]
  setPatients: (p: Patient[]) => void
  addPatient: (p: Omit<Patient, "id">) => Promise<{ success: boolean; message: string }>
  updatePatient: (p: Patient) => Promise<{ success: boolean; message: string }>
  deletePatient: (id: number) => Promise<void>
  checkProntuarioExists: (p: string, e?: number) => boolean
  generateNextProntuario: () => Promise<string>
  importPatientsFromCSV: (p: Patient[]) => Promise<void>
  refreshData: () => Promise<void>
  syncProcedencias: () => Promise<void>
  logos: Logos
  updateLogo: (k: keyof Logos, b: string | null) => Promise<void>
  procedencias: Procedencia[]
  addProcedencia: (n: string) => Promise<void>
  removeProcedencia: (id: string) => Promise<void>
  editProcedencia: (id: string, n: string) => Promise<void>
  visitingHours: VisitingHours | null
  updateVisitingHours: (h: Partial<Omit<VisitingHours, "id">>) => Promise<void>
  doctorSlots: DoctorSlot[]
  updateDoctorSlot: (s: Omit<DoctorSlot, "id">) => Promise<void>
  consultations: Consultation[]
  addConsultation: (c: Omit<Consultation, "id" | "status">) => Promise<{ success: boolean; message: string }>
  updateConsultation: (c: Consultation) => Promise<void>
  deleteConsultation: (id: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const retry = async (fn: () => Promise<any>, r = 3, d = 500): Promise<any> => {
  let e
  for (let i = 0; i < r; i++) {
    try {
      return await fn()
    } catch (err) {
      e = err
      if (i < r - 1) await new Promise((res) => setTimeout(res, d * Math.pow(2, i)))
    }
  }
  throw e
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [doctors, setDoctorsState] = useState<Doctor[]>([])
  const [receptionists, setReceptionistsState] = useState<Receptionist[]>([])
  const [patients, setPatientsState] = useState<Patient[]>([])
  const [logos, setLogos] = useState<Logos>({
    logo_hto: null,
    logo_maranhao: null,
    logo_instituto: null,
    logo_sus: null,
  })
  const [procedencias, setProcedenciasState] = useState<Procedencia[]>([])
  const [visitingHours, setVisitingHours] = useState<VisitingHours | null>(null)
  const [doctorSlots, setDoctorSlots] = useState<DoctorSlot[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])

  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    [],
  )

  const checkProntuarioExists = useCallback(
    (p: string, ex?: number) => patients.some((pat) => pat.prontuario && pat.prontuario.toUpperCase() === p.toUpperCase() && pat.id !== ex),
    [patients],
  )

  const generateNextProntuario = useCallback(async () => {
    const currentYear = new Date().getFullYear().toString().slice(-2)
    const yearSuffix = `/${currentYear}`

    try {
      // Busca os prontuários recentes para encontrar o maior número sequencial
      const { data, error } = await supabase
        .from("patients")
        .select("prontuario")
        .order("id", { ascending: false })
        .limit(2000)

      if (error) throw error

      const allNumbers = (data || []).map(p => {
        const match = p.prontuario?.match(/P(\d+)/)
        return match ? parseInt(match[1]) : 0
      })

      const maxNumber = Math.max(0, ...allNumbers)
      return `P${maxNumber + 1}${yearSuffix}`
    } catch (e) {
      console.error("Erro ao gerar prontuário no banco, usando local:", e)
      const allNumbers = patients.map(p => {
        const match = p.prontuario ? p.prontuario.match(/P(\d+)/) : null
        return match ? parseInt(match[1]) : 0
      })
      const maxNumber = Math.max(0, ...allNumbers)
      return `P${maxNumber + 1}${yearSuffix}`
    }
  }, [patients, supabase])

  const loadData = useCallback(async () => {
    try {
      // Carregamento imediato do cache
      const cp = localStorage.getItem("hto_patients")
      const cd = localStorage.getItem("hto_doctors")
      const cr = localStorage.getItem("hto_receptionists")
      const cl = localStorage.getItem("hto_logos")
      const cpro = localStorage.getItem("hto_procedencias")
      const ch = localStorage.getItem("hto_visiting_hours")

      if (cp) setPatientsState(JSON.parse(cp))
      if (cd) setDoctorsState(JSON.parse(cd))
      else setDoctorsState(initialDoctors)
      if (cr) setReceptionistsState(JSON.parse(cr))
      else setReceptionistsState(initialReceptionists)
      if (cl) setLogos(JSON.parse(cl))
      if (cpro) setProcedenciasState(JSON.parse(cpro))
      if (ch) setVisitingHours(JSON.parse(ch))

      // Busca paralela otimizada
      const [pD, dD, rD, sD, proD, hD, dsD, cD] = await Promise.all([
        retry(() => supabase.from("patients").select("*").order("ordem", { ascending: false }).limit(2000)),
        retry(() => supabase.from("doctors").select("*").order("name", { ascending: true })),
        retry(() => supabase.from("receptionists").select("*").order("name", { ascending: true })),
        retry(() => supabase.from("settings").select("*")),
        retry(() => supabase.from("procedencias").select("*").order("name", { ascending: true })),
        retry(() => supabase.from("visiting_hours").select("*").limit(1).maybeSingle()),
        retry(() => supabase.from("doctor_slots").select("*")),
        retry(() => supabase.from("consultations").select("*").order("created_at", { ascending: false })),
      ])

      if (pD.data) {
        const mp: Patient[] = pD.data.map((p: any) => ({
          id: p.id,
          ordem: p.ordem,
          data: p.data,
          paciente: p.paciente,
          cidadeOrigem: p.cidade_origem || "",
          estado: p.estado || "MA",
          horario: p.horario || "",
          leito: p.leito || "",
          sus: p.sus || "",
          cpf: p.cpf || "",
          dataNascimento: p.data_nascimento || "",
          idade: p.idade || "",
          procedencia: p.procedencia || "",
          isResidencia: p.is_residencia || false,
          destino: p.destino || "",
          prontuario: p.prontuario,
          medico: p.medico || "",
          procedimento: p.procedimento || "",
          recepcionista: p.recepcionista || "",
          telefone: p.telefone || "",
          mae: p.mae || "",
          pai: p.pai || "",
          estadoCivil: p.estado_civil || "",
          rg: p.rg || "",
          sexo: p.sexo || "",
          municipioNascimento: p.municipio_nascimento || "",
          endereco: p.endereco || "",
          bairro: p.bairro || "",
          cep: p.cep || "",
        }))
        setPatientsState(mp)
        localStorage.setItem("hto_patients", JSON.stringify(mp))
      }

      if (dD.data) {
        const md: Doctor[] = dD.data.map((d: any) => ({ id: d.id, name: d.name, specialty: d.specialty || "" }))
        setDoctorsState(md)
        localStorage.setItem("hto_doctors", JSON.stringify(md))
      }

      if (rD.data) {
        const mr: Receptionist[] = rD.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          username: r.username,
          allowedModules: r.allowed_modules || [],
          allowedSubmodules: r.allowed_submodules || []
        }))
        setReceptionistsState(mr)
        localStorage.setItem("hto_receptionists", JSON.stringify(mr))
      }

      if (sD.data) {
        const nl: Logos = { logo_hto: null, logo_maranhao: null, logo_instituto: null, logo_sus: null }
        sD.data.forEach((s: any) => {
          if (s.key in nl) nl[s.key as keyof Logos] = s.value
        })
        setLogos(nl)
        localStorage.setItem("hto_logos", JSON.stringify(nl))
      }

      if (proD.data) {
        const mpro: Procedencia[] = proD.data.map((p: any) => ({ id: p.id, name: p.name }))
        setProcedenciasState(mpro)
        localStorage.setItem("hto_procedencias", JSON.stringify(mpro))
      }

      if (hD.data) {
        const h: VisitingHours = {
          id: hD.data.id,
          enfermaria: hD.data.enfermaria || "",
          uti: hD.data.uti || "",
          trocas_acompanhantes: hD.data.trocas_acompanhantes || "",
        }
        setVisitingHours(h)
        localStorage.setItem("hto_visiting_hours", JSON.stringify(h))
      }

      if (dsD.data) {
        setDoctorSlots(dsD.data)
        localStorage.setItem("hto_doctor_slots", JSON.stringify(dsD.data))
      }

      if (cD.data) {
        const mc: Consultation[] = cD.data.map((c: any) => ({
          id: c.id,
          patient_id: c.patient_id,
          patient_name: c.patient_name,
          cpf: c.cpf,
          sus_card: c.sus_card,
          phone: c.phone,
          birth_date: c.birth_date,
          municipio: c.municipio,
          doctor_id: c.doctor_id,
          receptionist_name: c.receptionist_name,
          date: c.date,
          time: c.time,
          sisreg: c.sisreg,
          procedencia: c.procedencia,
          destination: c.destination,
          status: c.status,
          created_at: c.created_at
        }))
        setConsultations(mc)
        localStorage.setItem("hto_consultations", JSON.stringify(mc))
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e)
    }
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const u = localStorage.getItem("hto_user")
      if (u) setUser(JSON.parse(u))
      await loadData()
      setIsLoading(false)
    }
    init()
  }, [loadData])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    await loadData()
    setIsLoading(false)
  }, [loadData])

  const syncProcedencias = useCallback(async () => {
    try {
      const { data: pData, error: pError } = await supabase
        .from("patients")
        .select("procedencia")
        .not("procedencia", "is", null)
        .neq("procedencia", "")

      if (pError) throw pError

      const uniqueNames = Array.from(new Set(
        pData
          .map(p => p.procedencia.toUpperCase().trim())
          .filter(n => n && n !== "RESIDÊNCIA" && n !== "RESIDENCIA")
      ))

      if (uniqueNames.length === 0) return

      const { data: existingData } = await supabase.from("procedencias").select("name")
      const existingNames = new Set(existingData?.map(p => p.name.toUpperCase()) || [])

      const newNames = uniqueNames.filter(n => !existingNames.has(n))

      if (newNames.length > 0) {
        await supabase.from("procedencias").insert(newNames.map(name => ({ name })))
      }

      const { data: updatedPro } = await supabase.from("procedencias").select("*").order("name", { ascending: true })
      if (updatedPro) {
        const mpro: Procedencia[] = updatedPro.map((p: any) => ({ id: p.id, name: p.name }))
        setProcedenciasState(mpro)
        localStorage.setItem("hto_procedencias", JSON.stringify(mpro))
      }
    } catch (e) {
      console.error("Erro ao sincronizar procedências:", e)
    }
  }, [supabase])

  const setDoctors = useCallback((d: Doctor[]) => {
    setDoctorsState(d)
    localStorage.setItem("hto_doctors", JSON.stringify(d))
  }, [])

  const addDoctor = useCallback(
    async (d: Omit<Doctor, "id">) => {
      try {
        const { data, error } = await supabase.from("doctors").insert([{ name: d.name, specialty: d.specialty }]).select().single()
        if (error) throw error
        const nd: Doctor = { id: data.id, name: data.name, specialty: data.specialty || "" }
        setDoctorsState((prev) => {
          const ud = [...prev, nd]
          localStorage.setItem("hto_doctors", JSON.stringify(ud))
          return ud
        })
      } catch (e) {
        const nd: Doctor = { id: Date.now().toString(), ...d }
        setDoctorsState((prev) => {
          const ud = [...prev, nd]
          localStorage.setItem("hto_doctors", JSON.stringify(ud))
          return ud
        })
      }
    },
    [supabase],
  )

  const updateDoctor = useCallback(
    async (d: Doctor) => {
      try {
        await supabase.from("doctors").update({ name: d.name, specialty: d.specialty }).eq("id", d.id)
      } catch (e) { }
      setDoctorsState((prev) => {
        const ud = prev.map((doc) => (doc.id === d.id ? d : doc))
        localStorage.setItem("hto_doctors", JSON.stringify(ud))
        return ud
      })
    },
    [supabase],
  )

  const removeDoctor = useCallback(
    async (id: string) => {
      try {
        await supabase.from("doctors").delete().eq("id", id)
      } catch (e) { }
      setDoctorsState((prev) => {
        const ud = prev.filter((d) => d.id !== id)
        localStorage.setItem("hto_doctors", JSON.stringify(ud))
        return ud
      })
    },
    [supabase],
  )

  const setReceptionists = useCallback((r: Receptionist[]) => {
    setReceptionistsState(r)
    localStorage.setItem("hto_receptionists", JSON.stringify(r))
  }, [])

  const addReceptionist = useCallback(
    async (r: Omit<Receptionist, "id">) => {
      try {
        const { data, error } = await supabase
          .from("receptionists")
          .insert([{
            name: r.name,
            username: r.username,
            allowed_modules: r.allowedModules || [],
            allowed_submodules: r.allowedSubmodules || []
          }])
          .select()
          .single()
        if (error) throw error
        const nr: Receptionist = {
          id: data.id,
          name: data.name,
          username: data.username,
          allowedModules: data.allowed_modules || [],
          allowedSubmodules: data.allowed_submodules || []
        }
        setReceptionistsState((prev) => {
          const ur = [...prev, nr]
          localStorage.setItem("hto_receptionists", JSON.stringify(ur))
          return ur
        })
        await supabase.from("system_users").insert([{
          username: r.username,
          password: "@htocaxias",
          name: r.name,
          role: "user",
          allowed_modules: r.allowedModules || [],
          allowed_submodules: r.allowedSubmodules || []
        }])
      } catch (e) {
        const nr: Receptionist = { id: Date.now().toString(), ...r }
        setReceptionistsState((prev) => {
          const ur = [...prev, nr]
          localStorage.setItem("hto_receptionists", JSON.stringify(ur))
          return ur
        })
      }
    },
    [supabase],
  )

  const updateReceptionist = useCallback(
    async (r: Receptionist) => {
      try {
        await supabase.from("receptionists")
          .update({
            name: r.name,
            username: r.username,
            allowed_modules: r.allowedModules || [],
            allowed_submodules: r.allowedSubmodules || []
          })
          .eq("id", r.id)

        await supabase.from("system_users")
          .update({
            name: r.name,
            allowed_modules: r.allowedModules || [],
            allowed_submodules: r.allowedSubmodules || []
          })
          .eq("username", r.username)
      } catch (e) { }
      setReceptionistsState((prev) => {
        const ur = prev.map((rec) => (rec.id === r.id ? r : rec))
        localStorage.setItem("hto_receptionists", JSON.stringify(ur))
        return ur
      })
    },
    [supabase],
  )

  const removeReceptionist = useCallback(
    async (id: string) => {
      const rec = receptionists.find((r) => r.id === id)
      try {
        await supabase.from("receptionists").delete().eq("id", id)
        if (rec) await supabase.from("system_users").delete().eq("username", rec.username)
      } catch (e) { }
      setReceptionistsState((prev) => {
        const ur = prev.filter((r) => r.id !== id)
        localStorage.setItem("hto_receptionists", JSON.stringify(ur))
        return ur
      })
    },
    [receptionists, supabase],
  )

  const setPatients = useCallback((p: Patient[]) => {
    setPatientsState(p)
    localStorage.setItem("hto_patients", JSON.stringify(p))
  }, [])

  const addProcedencia = useCallback(
    async (n: string) => {
      const un = n.toUpperCase().trim()
      if (!un || un === "RESIDÊNCIA") return
      if (procedencias.some((p) => p.name.toUpperCase() === un)) return
      try {
        const { data, error } = await supabase.from("procedencias").insert([{ name: un }]).select().single()
        if (error) throw error
        const np: Procedencia = { id: data.id, name: data.name }
        setProcedenciasState((prev) => {
          const up = [...prev, np].sort((a, b) => a.name.localeCompare(b.name))
          localStorage.setItem("hto_procedencias", JSON.stringify(up))
          return up
        })
      } catch (e) { }
    },
    [procedencias, supabase],
  )

  const addPatient = useCallback(
    async (p: Omit<Patient, "id">): Promise<{ success: boolean; message: string }> => {
      try {
        // 1. Verificar no banco se o prontuário já existe
        const { data: existing } = await supabase
          .from("patients")
          .select("id")
          .eq("prontuario", p.prontuario)
          .maybeSingle()

        let patientToInsert = { ...p }

        if (existing) {
          // Se existir, gera um novo automaticamente
          const nextP = await generateNextProntuario()
          patientToInsert.prontuario = nextP
        }

        // Sincronizar procedência automaticamente
        if (patientToInsert.procedencia && !patientToInsert.isResidencia) {
          await addProcedencia(patientToInsert.procedencia)
        }

        // Função interna de inserção com retry em caso de race condition
        const attemptInsert = async (pat: typeof patientToInsert, attempts = 0): Promise<any> => {
          const { data, error } = await supabase
            .from("patients")
            .insert([
              {
                ordem: pat.ordem,
                data: pat.data,
                paciente: pat.paciente,
                cidade_origem: pat.cidadeOrigem,
                estado: pat.estado,
                horario: pat.horario,
                leito: pat.leito,
                sus: pat.sus,
                cpf: pat.cpf,
                data_nascimento: pat.dataNascimento,
                idade: pat.idade,
                procedencia: pat.procedencia,
                is_residencia: pat.isResidencia,
                destino: pat.destino,
                prontuario: pat.prontuario,
                medico: pat.medico,
                procedimento: pat.procedimento,
                recepcionista: pat.recepcionista,
                telefone: pat.telefone,
                mae: pat.mae,
                pai: pat.pai,
                estado_civil: pat.estadoCivil,
                rg: pat.rg,
                sexo: pat.sexo,
                municipio_nascimento: pat.municipioNascimento,
                endereco: pat.endereco,
                bairro: pat.bairro,
                cep: pat.cep,
              },
            ])
            .select()

          if (error) {
            // Código 23505 é violação de unicidade no Postgres
            if (error.code === "23505" && attempts < 3) {
              const nextP = await generateNextProntuario()
              return attemptInsert({ ...pat, prontuario: nextP }, attempts + 1)
            }
            throw error
          }
          return data
        }

        const data = await attemptInsert(patientToInsert)
        const iD = Array.isArray(data) ? data[0] : data
        if (!iD) throw new Error("Erro ao obter dados inseridos")

        const pId: Patient = {
          id: iD.id,
          ordem: iD.ordem,
          data: iD.data,
          paciente: iD.paciente,
          cidadeOrigem: iD.cidade_origem || "",
          estado: iD.estado || "MA",
          horario: iD.horario || "",
          leito: iD.leito || "",
          sus: iD.sus || "",
          cpf: iD.cpf || "",
          dataNascimento: iD.data_nascimento || "",
          idade: iD.idade || "",
          procedencia: iD.procedencia || "",
          isResidencia: iD.is_residencia || false,
          destino: iD.destino || "",
          prontuario: iD.prontuario,
          medico: iD.medico || "",
          procedimento: iD.procedimento || "",
          recepcionista: iD.recepcionista || "",
          telefone: iD.telefone || "",
          mae: iD.mae || "",
          pai: iD.pai || "",
          estadoCivil: iD.estado_civil || "",
          rg: iD.rg || "",
          sexo: iD.sexo || "",
          municipioNascimento: iD.municipio_nascimento || "",
          endereco: iD.endereco || "",
          bairro: iD.bairro || "",
          cep: iD.cep || "",
        }

        setPatientsState((prev) => {
          const up = [pId, ...prev]
          localStorage.setItem("hto_patients", JSON.stringify(up))
          return up
        })
        return { success: true, message: "Sucesso!" }
      } catch (e: any) {
        console.error("Erro ao salvar no banco:", e)
        const mId = Math.max(...patients.map((pat) => pat.id || 0), 0)
        const pId: Patient = { ...p, id: mId + 1 } as Patient
        setPatientsState((prev) => {
          const up = [pId, ...prev]
          localStorage.setItem("hto_patients", JSON.stringify(up))
          return up
        })
        return { success: true, message: "Sucesso offline!" }
      }
    },
    [patients, supabase, generateNextProntuario, addProcedencia],
  )

  const updatePatient = useCallback(
    async (p: Patient): Promise<{ success: boolean; message: string }> => {
      if (p.prontuario && checkProntuarioExists(p.prontuario, p.id)) return { success: false, message: "Prontuário já existe!" }

      // Sincronizar procedência automaticamente
      if (p.procedencia && !p.isResidencia) {
        await addProcedencia(p.procedencia)
      }

      try {
        const { error } = await supabase
          .from("patients")
          .update({
            ordem: p.ordem,
            data: p.data,
            paciente: p.paciente,
            cidade_origem: p.cidadeOrigem,
            estado: p.estado,
            horario: p.horario,
            leito: p.leito,
            sus: p.sus,
            cpf: p.cpf,
            data_nascimento: p.dataNascimento,
            idade: p.idade,
            procedencia: p.procedencia,
            is_residencia: p.isResidencia,
            destino: p.destino,
            prontuario: p.prontuario,
            medico: p.medico,
            procedimento: p.procedimento,
            recepcionista: p.recepcionista,
            telefone: p.telefone,
            mae: p.mae,
            pai: p.pai,
            estado_civil: p.estadoCivil,
            rg: p.rg,
            sexo: p.sexo,
            municipio_nascimento: p.municipioNascimento,
            endereco: p.endereco,
            bairro: p.bairro,
            cep: p.cep,
            updated_at: new Date().toISOString(),
          })
          .eq("id", p.id)
        if (error) throw error
      } catch (e) { }
      setPatientsState((prev) => {
        const up = prev.map((pat) => (pat.id === p.id ? p : pat))
        localStorage.setItem("hto_patients", JSON.stringify(up))
        return up
      })
      return { success: true, message: "Sucesso!" }
    },
    [supabase, checkProntuarioExists, addProcedencia],
  )

  const deletePatient = useCallback(
    async (id: number) => {
      try {
        await supabase.from("patients").delete().eq("id", id)
      } catch (e) { }
      setPatientsState((prev) => {
        const up = prev.filter((pat) => pat.id !== id)
        localStorage.setItem("hto_patients", JSON.stringify(up))
        return up
      })
    },
    [supabase],
  )

  const importPatientsFromCSV = useCallback(
    async (np: Patient[]) => {
      try {
        await supabase.from("patients").delete().neq("id", 0)
        const ti = np.map((p) => ({
          ordem: p.ordem,
          data: p.data,
          paciente: p.paciente,
          cidade_origem: p.cidadeOrigem,
          estado: p.estado,
          horario: p.horario,
          leito: p.leito,
          sus: p.sus,
          cpf: p.cpf,
          data_nascimento: p.dataNascimento,
          idade: p.idade,
          procedencia: p.procedencia,
          is_residencia: p.isResidencia,
          destino: p.destino,
          prontuario: p.prontuario,
          medico: p.medico,
          procedimento: p.procedimento,
          recepcionista: p.recepcionista,
          telefone: p.telefone,
          mae: p.mae,
          pai: p.pai,
          estado_civil: p.estadoCivil,
          rg: p.rg,
          sexo: p.sexo,
          municipio_nascimento: p.municipioNascimento,
          endereco: p.endereco,
          bairro: p.bairro,
          cep: p.cep,
        }))

        const { data, error } = await supabase.from("patients").insert(ti).select()
        if (error) throw error

        // Sincronizar procedências após a importação
        await syncProcedencias()

        if (data) {
          const mp: Patient[] = data.map((p: any) => ({
            id: p.id,
            ordem: p.ordem,
            data: p.data,
            paciente: p.paciente,
            cidadeOrigem: p.cidade_origem || "",
            estado: p.estado || "MA",
            horario: p.horario || "",
            leito: p.leito || "",
            sus: p.sus || "",
            cpf: p.cpf || "",
            dataNascimento: p.data_nascimento || "",
            idade: p.idade || "",
            procedencia: p.procedencia || "",
            isResidencia: p.is_residencia || false,
            destino: p.destino || "",
            prontuario: p.prontuario,
            medico: p.medico || "",
            procedimento: p.procedimento || "",
            recepcionista: p.recepcionista || "",
            telefone: p.telefone || "",
            mae: p.mae || "",
            pai: p.pai || "",
            estadoCivil: p.estado_civil || "",
            rg: p.rg || "",
            sexo: p.sexo || "",
            municipioNascimento: p.municipio_nascimento || "",
            endereco: p.endereco || "",
            bairro: p.bairro || "",
            cep: p.cep || "",
          }))
          setPatientsState(mp)
          localStorage.setItem("hto_patients", JSON.stringify(mp))
        }
      } catch (e) {
        setPatientsState(np)
        localStorage.setItem("hto_patients", JSON.stringify(np))
      }
    },
    [supabase, syncProcedencias],
  )

  const login = useCallback(
    async (u: string, p: string): Promise<boolean> => {
      try {
        const { data, error } = await supabase
          .from("system_users")
          .select("*")
          .eq("username", u.toLowerCase())
          .eq("password", p)
          .single()
        if (error || !data) {
          const su = localStorage.getItem("hto_users")
          const ul: User[] = su ? JSON.parse(su) : initialUsers
          const f = ul.find((usr) => usr.username.toLowerCase() === u.toLowerCase() && usr.password === p)
          if (f) {
            setUser(f)
            localStorage.setItem("hto_user", JSON.stringify(f))
            document.cookie = "hto_session=true; path=/; max-age=604800; SameSite=Lax"
            return true
          }
          return false
        }
        const f: User = {
          id: data.id,
          username: data.username,
          password: data.password,
          name: data.name,
          role: data.role as "admin" | "user",
          allowedModules: data.allowed_modules || [],
          allowedSubmodules: data.allowed_submodules || []
        }
        setUser(f)
        localStorage.setItem("hto_user", JSON.stringify(f))
        document.cookie = "hto_session=true; path=/; max-age=604800; SameSite=Lax"
        return true
      } catch (e) {
        return false
      }
    },
    [supabase],
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("hto_user")
    document.cookie = "hto_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }, [])

  const updateLogo = useCallback(
    async (k: keyof Logos, b: string | null) => {
      try {
        await supabase.from("settings").upsert({ key: k, value: b, updated_at: new Date().toISOString() }, { onConflict: "key" })
        setLogos((prev) => {
          const nl = { ...prev, [k]: b }
          localStorage.setItem("hto_logos", JSON.stringify(nl))
          return nl
        })
      } catch (e) { }
    },
    [supabase],
  )

  const removeProcedencia = useCallback(
    async (id: string) => {
      try {
        await supabase.from("procedencias").delete().eq("id", id)
      } catch (e) { }
      setProcedenciasState((prev) => {
        const up = prev.filter((p) => p.id !== id)
        localStorage.setItem("hto_procedencias", JSON.stringify(up))
        return up
      })
    },
    [supabase],
  )

  const editProcedencia = useCallback(
    async (id: string, n: string) => {
      const un = n.toUpperCase().trim()
      const op = procedencias.find((p) => p.id === id)
      if (!op) return
      const on = op.name
      if (procedencias.some((p) => p.id !== id && p.name.toUpperCase() === un)) throw new Error("Existe")
      try {
        await supabase.from("procedencias").update({ name: un }).eq("id", id)
        await supabase.from("patients").update({ procedencia: un }).eq("procedencia", on)

        setProcedenciasState((prev) => {
          const up = prev.map((p) => (p.id === id ? { ...p, name: un } : p)).sort((a, b) => a.name.localeCompare(b.name))
          localStorage.setItem("hto_procedencias", JSON.stringify(up))
          return up
        })

        setPatientsState((prev) => {
          const upat = prev.map((p) => (p.procedencia === on ? { ...p, procedencia: un } : p))
          localStorage.setItem("hto_patients", JSON.stringify(upat))
          return upat
        })
      } catch (e) {
        throw e
      }
    },
    [procedencias, supabase],
  )

  const updateVisitingHours = useCallback(
    async (h: Partial<Omit<VisitingHours, "id">>) => {
      try {
        if (visitingHours?.id) {
          await supabase.from("visiting_hours").update({ ...h, updated_at: new Date().toISOString() }).eq("id", visitingHours.id)
          setVisitingHours((prev) => {
            if (!prev) return null
            const u = { ...prev, ...h }
            localStorage.setItem("hto_visiting_hours", JSON.stringify(u))
            return u
          })
        } else {
          const { data, error } = await supabase.from("visiting_hours").insert([h]).select().single()
          if (error) throw error
          const nh: VisitingHours = {
            id: data.id,
            enfermaria: data.enfermaria || "",
            uti: data.uti || "",
            trocas_acompanhantes: data.trocas_acompanhantes || "",
          }
          setVisitingHours(nh)
          localStorage.setItem("hto_visiting_hours", JSON.stringify(nh))
        }
      } catch (e) { }
    },
    [visitingHours, supabase]
  )

  const updateDoctorSlot = useCallback(
    async (s: Omit<DoctorSlot, "id">) => {
      try {
        const { data, error } = await supabase
          .from("doctor_slots")
          .upsert({
            doctor_id: s.doctor_id,
            date: s.date,
            max_slots: s.max_slots,
            updated_at: new Date().toISOString()
          }, { onConflict: "doctor_id,date" })
          .select()
          .single()

        if (error) throw error

        setDoctorSlots((prev) => {
          const exists = prev.findIndex(item => item.doctor_id === s.doctor_id && item.date === s.date)
          let next
          if (exists >= 0) {
            next = [...prev]
            next[exists] = data
          } else {
            next = [...prev, data]
          }
          localStorage.setItem("hto_doctor_slots", JSON.stringify(next))
          return next
        })
      } catch (e) {
        console.error("Erro ao atualizar vagas:", e)
      }
    },
    [supabase]
  )

  const addConsultation = useCallback(
    async (c: Omit<Consultation, "id" | "status">): Promise<{ success: boolean; message: string }> => {
      try {
        console.log("Iniciando agendamento:", c)

        // Encontrar o slot do médico para o dia
        const slot = doctorSlots.find(s => s.doctor_id === c.doctor_id && s.date === c.date)
        const scheduledCount = consultations.filter(con => con.doctor_id === c.doctor_id && con.date === c.date).length

        if (slot && scheduledCount >= slot.max_slots) {
          return { success: false, message: `As vagas para este médico/dia já estão lotadas! (${scheduledCount}/${slot.max_slots})` }
        }

        // Tentar vincular ou criar paciente na tabela mestre
        let patient_id = c.patient_id
        if (!patient_id && c.cpf) {
          const existing = patients.find(p => p.cpf === c.cpf)
          if (existing) {
            patient_id = existing.id
            console.log("Paciente vinculado via CPF existente:", patient_id)
          } else {
            console.log("Criando novo paciente na tabela mestre...")
            try {
              // Tentativa de criação silenciosa do paciente
              const { data: newPat, error: patError } = await supabase.from("patients").insert([{
                paciente: c.patient_name,
                cpf: c.cpf,
                sus: c.sus_card,
                telefone: c.phone || "",
                data: format(new Date(), "dd.MM"),
                // Campos obrigatórios se o ALTER TABLE não tiver sido aplicado
                ordem: 0,
                prontuario: `CONS-${c.cpf.slice(-4)}-${format(new Date(), "yy")}`
              }]).select().single()

              if (patError) {
                console.warn("Erro ao vincular paciente (tabela mestre):", patError)
                // Não interrompemos o agendamento se falhar a criação do paciente mestre
              } else if (newPat) {
                patient_id = newPat.id
                console.log("Paciente criado com sucesso:", patient_id)
              }
            } catch (patCatch) {
              console.warn("Exceção ao criar paciente mestre:", patCatch)
            }
          }
        }

        console.log("Inserindo na tabela consultations com patient_id:", patient_id)
        const { data, error } = await supabase
          .from("consultations")
          .insert([{
            ...c,
            patient_id: patient_id || null,
            status: "Agendado"
          }])
          .select()
          .single()

        if (error) {
          console.error("Erro Supabase (Consultations):", error)
          throw error
        }

        if (!data) throw new Error("Nenhum dado retornado após inserção")

        setConsultations((prev) => {
          const next = [data, ...prev]
          localStorage.setItem("hto_consultations", JSON.stringify(next))
          return next
        })

        return { success: true, message: "Consulta agendada com sucesso!" }
      } catch (e: any) {
        console.error("Erro completo ao agendar consulta:", e)
        return {
          success: false,
          message: `Erro ao agendar consulta: ${e.message || "Erro desconhecido"}`
        }
      }
    },
    [supabase, doctorSlots, consultations, patients]
  )

  const updateConsultation = useCallback(
    async (c: Consultation) => {
      try {
        // Atualizar consulta
        const { error: conError } = await supabase
          .from("consultations")
          .update({
            patient_name: c.patient_name,
            cpf: c.cpf,
            sus_card: c.sus_card,
            phone: c.phone,
            birth_date: c.birth_date,
            municipio: c.municipio,
            sisreg: c.sisreg,
            procedencia: c.procedencia,
            destination: c.destination,
            status: c.status,
            updated_at: new Date().toISOString()
          })
          .eq("id", c.id)

        if (conError) throw conError

        // Se houver um patient_id vinculado, atualizar dados mestres do paciente
        if (c.patient_id) {
          try {
            await supabase.from("patients").update({
              paciente: c.patient_name,
              cpf: c.cpf,
              sus: c.sus_card,
              telefone: c.phone,
              data_nascimento: c.birth_date,
              // municipio_nascimento ou cidade_origem? No script 1 é cidade_origem.
              cidade_origem: c.municipio
            }).eq("id", c.patient_id)

            // Atualizar no local state de pacientes também
            setPatientsState(prev => prev.map(p => p.id === c.patient_id ? {
              ...p,
              paciente: c.patient_name,
              cpf: c.cpf || "",
              sus: c.sus_card || "",
              telefone: c.phone || "",
              dataNascimento: c.birth_date || "",
              cidadeOrigem: c.municipio || ""
            } : p))
          } catch (patErr) {
            console.warn("Erro ao sincronizar dados no cadastro de paciente:", patErr)
          }
        }

        setConsultations((prev) => {
          const next = prev.map(con => con.id === c.id ? c : con)
          localStorage.setItem("hto_consultations", JSON.stringify(next))
          return next
        })
      } catch (e) {
        console.error("Erro ao atualizar consulta:", e)
      }
    },
    [supabase]
  )

  const deleteConsultation = useCallback(
    async (id: string) => {
      try {
        await supabase.from("consultations").delete().eq("id", id)
        setConsultations((prev) => {
          const next = prev.filter(con => con.id !== id)
          localStorage.setItem("hto_consultations", JSON.stringify(next))
          return next
        })
      } catch (e) {
        console.error("Erro ao excluir consulta:", e)
      }
    },
    [supabase]
  )

  const contextValue = useMemo(
    () => ({
      user,
      patients,
      doctors,
      receptionists,
      logos,
      procedencias,
      visitingHours,
      isLoading,
      setDoctors,
      setReceptionists,
      setPatients,
      addPatient,
      updatePatient,
      deletePatient,
      checkProntuarioExists,
      generateNextProntuario,
      importPatientsFromCSV,
      refreshData,
      syncProcedencias,
      login,
      logout,
      addDoctor,
      updateDoctor,
      removeDoctor,
      addReceptionist,
      updateReceptionist,
      removeReceptionist,
      updateLogo,
      addProcedencia,
      removeProcedencia,
      editProcedencia,
      updateVisitingHours,
      doctorSlots,
      updateDoctorSlot,
      consultations,
      addConsultation,
      updateConsultation,
      deleteConsultation,
    }),
    [
      user,
      patients,
      doctors,
      receptionists,
      logos,
      procedencias,
      visitingHours,
      isLoading,
      setDoctors,
      setReceptionists,
      setPatients,
      addPatient,
      updatePatient,
      deletePatient,
      checkProntuarioExists,
      generateNextProntuario,
      importPatientsFromCSV,
      refreshData,
      syncProcedencias,
      login,
      logout,
      addDoctor,
      updateDoctor,
      removeDoctor,
      addReceptionist,
      updateReceptionist,
      removeReceptionist,
      updateLogo,
      addProcedencia,
      removeProcedencia,
      editProcedencia,
      updateVisitingHours,
      doctorSlots,
      updateDoctorSlot,
      consultations,
      addConsultation,
      updateConsultation,
      deleteConsultation,
    ],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const c = useContext(AuthContext)
  if (c === undefined) throw new Error("useAuth error")
  return c
}
