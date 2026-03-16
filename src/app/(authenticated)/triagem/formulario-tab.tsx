"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { format } from "date-fns"
import { 
  Save, 
  User, 
  Calendar, 
  Phone, 
  CreditCard, 
  Activity, 
  AlertCircle, 
  ClipboardList,
  Search,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Stethoscope
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

const CHECKLIST_ITEMS = [
  { id: "lab", label: "Exames de Laboratório de Análises Clínicas" },
  { id: "rx", label: "Exames de imagem Radiografia" },
  { id: "risco", label: "Risco Cirúrgico" },
  { id: "tomografia", label: "Tomografia" },
  { id: "hemo", label: "Solicitação de Hemocomponentes" },
  { id: "opme", label: "OPME (Ambulatório)" },
  { id: "vacina", label: "Carteira de Vacinação" },
  { id: "resp", label: "Problemas Respiratórios" },
  { id: "diabetes", label: "Diabetes" },
  { id: "hipertensao", label: "Hipertensos" },
  { id: "outros", label: "Outros" },
]

export default function FormularioTab() {
  const { user } = useAuth()
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  const [formData, setFormData] = useState({
    patient_name: "",
    cpf: "",
    sus: "",
    contato: "",
    data_nascimento: "",
    tipagem_sanguinea: "",
    obs: "",
    faz_uso_anticoagulantes: false,
    nir_data: {
      procedencia: "",
      nome_contato: "",
      data_cirurgia: "",
      procedimento: "",
      cirurgiao: "",
      opme_nir: "",
      empresa: "",
      observacao_nir: ""
    }
  })

  const [checklist, setChecklist] = useState<Record<string, { sim: boolean, data: string }>>(
    CHECKLIST_ITEMS.reduce((acc, item) => ({ 
      ...acc, 
      [item.id]: { sim: false, data: "" } 
    }), {})
  )

  const maskCPF = (v: string) => {
    v = v.replace(/\D/g, "")
    if (v.length > 11) v = v.substring(0, 11)
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const handleNameInput = async (val: string) => {
    setFormData(prev => ({ ...prev, patient_name: val }))
    if (val.length < 3) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    setShowDropdown(true)
    try {
      const { data } = await supabase.from("patients").select("*").ilike("paciente", `%${val}%`).limit(5)
      setSearchResults(data || [])
    } catch (e) { }
  }

  const handleSelectPatient = (patient: any) => {
    setFormData(prev => ({
      ...prev,
      patient_name: patient.paciente,
      cpf: maskCPF(patient.cpf || ""),
      sus: patient.sus || "",
      data_nascimento: patient.data_nascimento || "",
    }))
    setShowDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const cleanCPF = formData.cpf.replace(/\D/g, "")
      
      const { error } = await supabase.from("surgery_triage").insert([{
        patient_name: formData.patient_name.toUpperCase(),
        cpf: cleanCPF,
        sus: formData.sus,
        contato: formData.contato,
        data_nascimento: formData.data_nascimento || null,
        tipagem_sanguinea: formData.tipagem_sanguinea,
        checklist_data: checklist,
        nir_data: formData.nir_data,
        obs: formData.obs,
        recepcionista: user?.name || "SISTEMA",
        is_launched: false
      }])

      if (error) throw error

      toast.success("Triagem cadastrada com sucesso!")
      // Reset form
      setFormData({
        patient_name: "",
        cpf: "",
        sus: "",
        contato: "",
        data_nascimento: "",
        tipagem_sanguinea: "",
        obs: "",
        faz_uso_anticoagulantes: false,
        nir_data: {
          procedencia: "",
          nome_contato: "",
          data_cirurgia: "",
          procedimento: "",
          cirurgiao: "",
          opme_nir: "",
          empresa: "",
          observacao_nir: ""
        }
      })
      setChecklist(CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: { sim: false, data: "" } }), {}))
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar triagem.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Identificação Section */}
        <div className="glass-card bg-white border-none rounded-[3rem] p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          <h3 className="text-xl font-black font-space uppercase tracking-tight text-slate-800 flex items-center gap-4 mb-8">
            <User className="h-6 w-6 text-emerald-500" /> Identificação do Paciente
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-12 relative" ref={dropdownRef}>
              <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">Nome Completo</Label>
              <div className="relative">
                <Input 
                  required 
                  autoComplete="off" 
                  placeholder="BUSCAR OU DIGITAR NOME..." 
                  value={formData.patient_name} 
                  onChange={e => handleNameInput(e.target.value)}
                  className="pl-16 h-16 text-lg font-black bg-slate-50 border-none rounded-[1.5rem] shadow-inner uppercase"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
              </div>
              {showDropdown && (
                <div className="absolute z-50 mt-2 w-full bg-white border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden">
                  {searchResults.map(p => (
                    <button key={p.id} type="button" onClick={() => handleSelectPatient(p)} className="w-full text-left px-8 py-4 hover:bg-emerald-50 transition-colors flex items-center justify-between">
                      <div>
                        <p className="font-black text-slate-800 uppercase text-sm">{p.paciente}</p>
                        <p className="text-[10px] text-slate-400">CPF: {maskCPF(p.cpf || "")}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-4 space-y-2 relative">
              <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">CPF</Label>
              <Input 
                required 
                placeholder="000.000.000-00" 
                value={formData.cpf} 
                onChange={e => setFormData(p => ({ ...p, cpf: maskCPF(e.target.value) }))}
                className="pl-14 h-14 font-bold bg-slate-50 border-none rounded-2xl"
              />
              <CreditCard className="absolute left-6 bottom-[1rem] h-5 w-5 text-emerald-500" />
            </div>

            <div className="md:col-span-4 space-y-2 relative">
              <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">CNS (SUS)</Label>
              <Input 
                required 
                placeholder="000 0000 0000 0000" 
                value={formData.sus} 
                onChange={e => setFormData(p => ({ ...p, sus: e.target.value }))}
                className="pl-14 h-14 font-bold bg-slate-50 border-none rounded-2xl"
              />
              <ClipboardList className="absolute left-6 bottom-[1rem] h-5 w-5 text-emerald-500" />
            </div>

            <div className="md:col-span-4 space-y-2 relative">
              <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">Data de Nascimento</Label>
              <Input 
                type="date"
                value={formData.data_nascimento}
                onChange={e => setFormData(p => ({ ...p, data_nascimento: e.target.value }))}
                className="pl-14 h-14 font-bold bg-slate-50 border-none rounded-2xl"
              />
              <Calendar className="absolute left-6 bottom-[1rem] h-5 w-5 text-emerald-500" />
            </div>

            <div className="md:col-span-4 space-y-2 relative">
              <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">Contato</Label>
              <Input 
                placeholder="(00) 00000-0000" 
                value={formData.contato}
                onChange={e => setFormData(p => ({ ...p, contato: e.target.value }))}
                className="pl-14 h-14 font-bold bg-slate-50 border-none rounded-2xl"
              />
              <Phone className="absolute left-6 bottom-[1rem] h-5 w-5 text-emerald-500" />
            </div>

            <div className="md:col-span-4 space-y-2 relative">
              <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">Tipagem Sanguínea</Label>
              <select 
                value={formData.tipagem_sanguinea}
                onChange={e => setFormData(p => ({ ...p, tipagem_sanguinea: e.target.value }))}
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-14 font-bold appearance-none cursor-pointer"
              >
                <option value="">Selecione...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              <Activity className="absolute left-6 bottom-[1.2rem] h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Checklist Section */}
        <div className="glass-card bg-white border-none rounded-[3rem] p-10 shadow-xl">
          <h3 className="text-xl font-black font-space uppercase tracking-tight text-slate-800 flex items-center gap-4 mb-8">
            <ClipboardList className="h-6 w-6 text-emerald-500" /> Checklist Pré-Operatório
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item.id} className="group p-6 bg-slate-50/50 rounded-[2rem] border border-transparent hover:border-emerald-100 hover:bg-white transition-all flex items-center justify-between gap-6">
                <div className="flex-1">
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{item.label}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-200 p-1 rounded-2xl">
                    <button 
                      type="button"
                      onClick={() => setChecklist(p => ({ ...p, [item.id]: { ...p[item.id], sim: true } }))}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${checklist[item.id].sim ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
                    >
                      SIM
                    </button>
                    <button 
                      type="button"
                      onClick={() => setChecklist(p => ({ ...p, [item.id]: { ...p[item.id], sim: false } }))}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${!checklist[item.id].sim ? 'bg-red-500 text-white' : 'text-slate-500'}`}
                    >
                      NÃO
                    </button>
                  </div>
                  {checklist[item.id].sim && (
                    <Input 
                      type="date"
                      value={checklist[item.id].data}
                      onChange={e => setChecklist(p => ({ ...p, [item.id]: { ...p[item.id], data: e.target.value } }))}
                      className="w-32 h-10 bg-white border-slate-200 rounded-xl text-[10px] font-bold"
                    />
                  )}
                </div>
              </div>
            ))}

            <div className="lg:col-span-2 p-6 bg-red-50/50 rounded-[2rem] border border-red-100 flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <p className="text-xs font-black text-slate-700 uppercase">Faz uso de Anticoagulantes?</p>
              </div>
              <div className="flex bg-slate-200 p-1 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, faz_uso_anticoagulantes: true }))}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${formData.faz_uso_anticoagulantes ? 'bg-red-500 text-white' : 'text-slate-500'}`}
                >
                  SIM
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, faz_uso_anticoagulantes: false }))}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${!formData.faz_uso_anticoagulantes ? 'bg-slate-400 text-white' : 'text-slate-500'}`}
                >
                  NÃO
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2 mt-4">
              <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-5">Observações Gerais</Label>
              <textarea 
                value={formData.obs}
                onChange={e => setFormData(p => ({ ...p, obs: e.target.value }))}
                className="w-full h-32 bg-slate-50 border-none rounded-[2rem] p-6 text-sm font-medium focus:ring-0 shadow-inner resize-none"
                placeholder="NOTAS ADICIONAIS..."
              />
            </div>
          </div>
        </div>


        {/* Submit Section */}
        <div className="flex justify-end gap-6 pb-20">
          <Button 
            disabled={isSubmitting}
            type="submit" 
            className="h-20 px-16 bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-emerald-500/40 gap-4 transition-all"
          >
            {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin" /> : <><Save className="h-8 w-8" /> Salvar Atendimento</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
