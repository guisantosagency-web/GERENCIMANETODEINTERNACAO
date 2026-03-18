"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Search, User, Check, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { searchMasterPatients, type MasterPatient } from "@/lib/patient-search"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface PatientSearchInputProps {
  onSelect: (patient: MasterPatient) => void
  placeholder?: string
  className?: string
  /** Texto de rótulo acima do input */
  label?: string
  /** Cor tema do bloco: 'amber' | 'blue' | 'emerald' | 'purple' */
  color?: "amber" | "blue" | "emerald" | "purple"
}

const colorMap = {
  amber: {
    icon: "bg-amber-500/10 text-amber-600",
    border: "border-amber-100/50",
    hover: "hover:bg-amber-50",
    avatar: "bg-amber-50 text-amber-600 group-hover/item:bg-amber-100",
    badge: "bg-amber-500",
    wrap: "bg-amber-500/5 border-amber-500/10",
    title: "text-amber-700",
    sub: "text-amber-600",
    spinner: "border-amber-500/30 border-t-amber-500",
    ring: "focus:ring-amber-500/20",
    placeholder: "placeholder:text-amber-200",
  },
  blue: {
    icon: "bg-blue-500/10 text-blue-600",
    border: "border-blue-100/50",
    hover: "hover:bg-blue-50",
    avatar: "bg-blue-50 text-blue-600 group-hover/item:bg-blue-100",
    badge: "bg-blue-500",
    wrap: "bg-blue-500/5 border-blue-500/10",
    title: "text-blue-700",
    sub: "text-blue-600",
    spinner: "border-blue-500/30 border-t-blue-500",
    ring: "focus:ring-blue-500/20",
    placeholder: "placeholder:text-blue-200",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600",
    border: "border-emerald-100/50",
    hover: "hover:bg-emerald-50",
    avatar: "bg-emerald-50 text-emerald-600 group-hover/item:bg-emerald-100",
    badge: "bg-emerald-500",
    wrap: "bg-emerald-500/5 border-emerald-500/10",
    title: "text-emerald-700",
    sub: "text-emerald-600",
    spinner: "border-emerald-500/30 border-t-emerald-500",
    ring: "focus:ring-emerald-500/20",
    placeholder: "placeholder:text-emerald-200",
  },
  purple: {
    icon: "bg-purple-500/10 text-purple-600",
    border: "border-purple-100/50",
    hover: "hover:bg-purple-50",
    avatar: "bg-purple-50 text-purple-600 group-hover/item:bg-purple-100",
    badge: "bg-purple-500",
    wrap: "bg-purple-500/5 border-purple-500/10",
    title: "text-purple-700",
    sub: "text-purple-600",
    spinner: "border-purple-500/30 border-t-purple-500",
    ring: "focus:ring-purple-500/20",
    placeholder: "placeholder:text-purple-200",
  },
}

export function PatientSearchInput({
  onSelect,
  placeholder = "Buscar por nome, CPF ou Cartão SUS...",
  className,
  label = "Importar da Base de Pacientes",
  color = "blue",
}: PatientSearchInputProps) {
  const [term, setTerm] = useState("")
  const [results, setResults] = useState<MasterPatient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const c = colorMap[color]

  const handleSearch = useCallback((value: string) => {
    setTerm(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      const res = await searchMasterPatients(value)
      setResults(res)
      setIsSearching(false)
    }, 350)
  }, [])

  const handleSelect = (patient: MasterPatient) => {
    onSelect(patient)
    setTerm("")
    setResults([])
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div className={cn("p-5 rounded-[2rem] border space-y-4", c.wrap, className)}>
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-lg", c.icon)}>
          <Search className="h-4 w-4" />
        </div>
        <div>
          <h3 className={cn("text-xs font-black uppercase tracking-widest", c.title)}>
            {label}
          </h3>
          <p className={cn("text-[10px] font-medium", c.sub)}>
            {results.length > 0
              ? `${results.length} paciente(s) encontrado(s) — clique para importar`
              : "Digite ao menos 2 caracteres para buscar"}
          </p>
        </div>
      </div>

      <div className="relative group">
        <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors", c.sub)} />
        <Input
          placeholder={placeholder}
          value={term}
          onChange={(e) => handleSearch(e.target.value)}
          className={cn(
            "pl-11 h-12 rounded-xl bg-white/50 focus:bg-white text-sm font-bold",
            c.ring, c.placeholder
          )}
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className={cn("h-4 w-4 border-2 rounded-full animate-spin", c.spinner)} />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="animate-in slide-in-from-top-2 space-y-2 pt-1">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className={cn(
                "w-full flex items-center justify-between p-4 bg-white rounded-2xl border transition-all text-left group/item",
                c.border, c.hover
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg transition-colors",
                  c.avatar
                )}>
                  {p.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 leading-tight uppercase">{p.full_name}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    {p.cpf && <span>CPF: {p.cpf}</span>}
                    {p.cpf && p.sus && <span className="w-1 h-1 rounded-full bg-slate-300" />}
                    {p.sus && <span>SUS: {p.sus}</span>}
                    {p.data_nascimento && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>DN: {p.data_nascimento}</span>
                      </>
                    )}
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-slate-300 uppercase">{p.origem_cadastro}</span>
                  </p>
                </div>
              </div>
              <div className={cn(
                "h-8 px-3 rounded-lg text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transform transition-transform group-hover/item:translate-x-1",
                c.badge
              )}>
                Importar <Check className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
