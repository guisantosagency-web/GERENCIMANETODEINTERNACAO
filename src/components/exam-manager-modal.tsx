"use client"
import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import {
  Settings2, Plus, Trash2, Edit3, X, Save,
  ChevronRight, Activity, ClipboardList, Loader2, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"

interface ExamManagerModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function ExamManagerModal({ isOpen, onOpenChange, onUpdate }: ExamManagerModalProps) {
  const [procedures, setProcedures] = useState<any[]>([])
  const [examTypes, setExamTypes] = useState<any[]>([])
  const [selectedProc, setSelectedProc] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [newProcName, setNewProcName] = useState("")
  const [newTypeName, setNewTypeName] = useState("")

  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data: pData } = await supabase.from("exam_procedures_list").select("*").order("name")
      const { data: tData } = await supabase.from("exam_types_list").select("*").order("name")
      setProcedures(pData || [])
      setExamTypes(tData || [])
      if (pData && pData.length > 0 && !selectedProc) {
        setSelectedProc(pData[0])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) loadData()
  }, [isOpen])

  const handleAddProc = async () => {
    if (!newProcName.trim()) return
    setIsSaving(true)
    try {
      const { error } = await supabase.from("exam_procedures_list").insert([{ name: newProcName.toUpperCase() }])
      if (error) throw error
      setNewProcName("")
      await loadData()
      onUpdate()
    } catch (e: any) {
      alert("Erro ao adicionar procedimento: " + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProc = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o procedimento ${name}? Isso pode afetar agendamentos e configurações de vagas.`)) return
    setIsSaving(true)
    try {
      const { error } = await supabase.from("exam_procedures_list").delete().eq("id", id)
      if (error) throw error
      if (selectedProc?.id === id) setSelectedProc(null)
      await loadData()
      onUpdate()
    } catch (e: any) {
      alert("Erro ao excluir: " + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddType = async () => {
    if (!newTypeName.trim() || !selectedProc) return
    setIsSaving(true)
    try {
      const { error } = await supabase.from("exam_types_list").insert([{
        name: newTypeName.toUpperCase(),
        procedure_name: selectedProc.name
      }])
      if (error) throw error
      setNewTypeName("")
      await loadData()
      onUpdate()
    } catch (e: any) {
      alert("Erro ao adicionar tipo: " + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteType = async (id: string) => {
    setIsSaving(true)
    try {
      const { error } = await supabase.from("exam_types_list").delete().eq("id", id)
      if (error) throw error
      await loadData()
      onUpdate()
    } catch (e: any) {
      alert("Erro ao excluir: " + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredTypes = useMemo(() => {
    if (!selectedProc) return []
    return examTypes.filter(t => t.procedure_name === selectedProc.name)
  }, [examTypes, selectedProc])

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[95vw] sm:max-w-[1000px] h-full p-0 border-none bg-slate-50/95 backdrop-blur-2xl shadow-3xl overflow-hidden rounded-l-[3rem]">
        <div className="flex h-full">

          {/* SIDEBAR: PROCEDURES */}
          <div className="w-[350px] bg-white border-r border-slate-100 flex flex-col">
            <div className="p-8 border-b border-slate-50">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black font-space uppercase tracking-tight text-slate-800 leading-none">Procedimentos</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Categorias de Exames</p>
                </div>
              </div>

              <div className="relative group">
                <Input
                  placeholder="NOVO PROCEDIMENTO..."
                  value={newProcName}
                  onChange={e => setNewProcName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddProc()}
                  className="h-12 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase pl-4 pr-10 shadow-inner"
                />
                <Button
                  onClick={handleAddProc}
                  disabled={isSaving || !newProcName.trim()}
                  className="absolute right-1 top-1 h-10 w-10 p-0 bg-blue-600 hover:bg-black text-white rounded-lg shadow-md transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              {isLoading ? (
                <div className="flex flex-col gap-2 p-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-slate-50 rounded-2xl animate-pulse" />)}
                </div>
              ) : procedures.length === 0 ? (
                <div className="text-center py-20 opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest">Vazio</p>
                </div>
              ) : procedures.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProc(p)}
                  className={`group flex items-center justify-between p-4 px-6 rounded-2xl cursor-pointer transition-all ${selectedProc?.id === p.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="text-[11px] font-black uppercase tracking-tight">{p.name}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteProc(p.id, p.name); }}
                      className={`p-2 rounded-lg transition-colors ${selectedProc?.id === p.id ? 'hover:bg-blue-500 text-white/60 hover:text-white' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight className={`h-4 w-4 ${selectedProc?.id === p.id ? 'text-white/60' : 'text-slate-200'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN CONTENT: EXAM TYPES */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">Subcategoria</span>
                    <h2 className="text-3xl font-black font-space uppercase tracking-tighter text-slate-800">
                      {selectedProc ? selectedProc.name : "Selecione um Procedimento"}
                    </h2>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Gerenciamento de tipos de exames específicos</p>
                </div>
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-12 w-12 rounded-2xl text-slate-300 hover:bg-red-50 hover:text-red-500">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
              <div className="max-w-3xl mx-auto space-y-10">

                {/* ADD NEW TYPE FORM */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100/50 relative group">
                  <div className="absolute -top-4 -left-4 p-4 bg-emerald-500 text-white rounded-2xl shadow-lg animate-bounce-subtle">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                    <div className="space-y-3">
                      <Label className="uppercase text-[9px] font-black tracking-widest text-slate-400 ml-4">Nova Especificação de Exame</Label>
                      <Input
                        disabled={!selectedProc}
                        placeholder="EX: CRÂNIO, ABDOME TOTAL, ETC..."
                        value={newTypeName}
                        onChange={e => setNewTypeName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddType()}
                        className="h-16 bg-slate-50 border-none rounded-2xl text-sm font-black px-8 uppercase shadow-inner block"
                      />
                    </div>
                    <Button
                      onClick={handleAddType}
                      disabled={isSaving || !newTypeName.trim() || !selectedProc}
                      className="h-16 px-10 rounded-2xl bg-emerald-600 hover:bg-black text-white font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                      Cadastrar
                    </Button>
                  </div>
                </div>

                {/* TYPES LIST */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 flex items-center gap-3 ml-2">
                    Exames Cadastrados <div className="h-px flex-1 bg-slate-100" />
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    {filteredTypes.length === 0 ? (
                      <div className="p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200 opacity-30">
                        <ClipboardList className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-loose">Nenhum exame específico<br />cadastrado para este procedimento.</p>
                      </div>
                    ) : filteredTypes.map(t => (
                      <div key={t.id} className="group bg-white p-5 px-8 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <Activity className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{t.name}</span>
                        </div>
                        <Button
                          onClick={() => handleDeleteType(t.id)}
                          variant="ghost"
                          className="h-10 w-10 p-0 text-slate-200 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* INFO PANEL */}
            {!selectedProc && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-20 flex items-center justify-center p-12 text-center">
                <div className="max-w-sm space-y-6">
                  <div className="h-24 w-24 bg-blue-100 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 rotate-12">
                    <Activity className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black font-space uppercase tracking-tight text-slate-800">Selecione uma Categoria</h3>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed mt-2 uppercase tracking-wide">Para gerenciar os tipos de exames, selecione um procedimento na lista à esquerda.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

