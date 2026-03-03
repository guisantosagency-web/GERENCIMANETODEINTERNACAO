"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Users, ClipboardCheck, PhoneCall, LayoutDashboard, Settings } from "lucide-react"

const modules = [
    {
        id: "internacoes",
        name: "Internações",
        description: "Gestão operacional e monitoramento hospitalar centralizado.",
        href: "/dashboard",
        icon: Users,
        color: "text-primary",
        bg: "bg-primary/10"
    },
    {
        id: "triagem",
        name: "Triagem",
        description: "Avaliação inicial e classificação de risco dos pacientes.",
        href: "/triagem",
        icon: ClipboardCheck,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    },
    {
        id: "recepcao",
        name: "Recepção",
        description: "Atendimento ao público, exames, retornos e consultas.",
        href: "/recepcao",
        icon: PhoneCall,
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
]

export default function ModulePortalPage() {
    const { user } = useAuth()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const allowedModules = useMemo(() => {
        if (user?.role === "admin") return modules
        return modules.filter(m => user?.allowedModules?.includes(m.id.toUpperCase()) || user?.allowedModules?.includes(m.name.toUpperCase()))
    }, [user])

    if (!mounted) return null

    return (
        <div className="space-y-12 pb-24">
            {/* Hero Section */}
            <div className="flex flex-col space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 w-fit">
                    <LayoutDashboard className="h-3 w-3" />
                    Portal de Módulos
                </div>
                <h1 className="text-5xl lg:text-6xl font-black font-space tracking-tight gradient-text">Ambulatorio Digital</h1>
                <p className="text-muted-foreground font-medium text-lg max-w-2xl">
                    Olá, <span className="text-foreground font-bold font-space uppercase">{user?.name}</span>.
                    Selecione o módulo que deseja acessar.
                </p>
            </div>

            {/* Module Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(allowedModules.length > 0 ? allowedModules : (user?.role === 'admin' ? modules : [])).map((m) => {
                    const Icon = m.icon
                    return (
                        <Link key={m.id} href={m.href} className="group">
                            <div className="h-full p-8 rounded-[3rem] glass-card border border-white/10 shadow-premium transition-all duration-500 group-hover:scale-[1.03] group-hover:bg-card/80 group-hover:shadow-indicator active:scale-[0.98] flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-[5rem] translate-x-12 -translate-y-12 transition-transform duration-700 group-hover:translate-x-8 group-hover:-translate-y-8" />

                                <div className={`p-5 rounded-[1.5rem] ${m.bg} ${m.color} w-fit mb-8 shadow-sm transition-all duration-500 group-hover:rotate-12 group-hover:scale-110`}>
                                    <Icon className="h-10 w-10" />
                                </div>

                                <h3 className="text-3xl font-black font-space mb-3 tracking-tight">{m.name}</h3>
                                <p className="text-muted-foreground font-medium leading-relaxed mb-8 flex-1">
                                    {m.description}
                                </p>

                                <div className="flex items-center gap-3 font-black text-sm uppercase tracking-widest text-primary group-hover:gap-5 transition-all duration-300">
                                    <span>Acessar Módulo</span>
                                    <div className="h-0.5 w-6 bg-primary" />
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
