"use client"

import { PhoneCall, Stethoscope, Search, UserRoundPlus } from "lucide-react"
import Link from "next/link"

const submodules = [
    { name: "Exames", href: "/recepcao/exames", icon: Search, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Retorno", href: "/recepcao/retorno", icon: UserRoundPlus, color: "text-amber-500", bg: "bg-amber-500/10" },
    { name: "Consulta", href: "/recepcao/consulta", icon: Stethoscope, color: "text-emerald-500", bg: "bg-emerald-500/10" },
]

export default function RecepcaoPage() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-5xl font-black font-space tracking-tight gradient-text">Módulo de Recepção</h1>
                <p className="text-muted-foreground font-medium text-lg max-w-xl">Selecione um submódulo para continuar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {submodules.map((m) => {
                    const Icon = m.icon
                    return (
                        <Link key={m.href} href={m.href} className="group">
                            <div className="p-8 rounded-[2.5rem] glass-card border border-white/10 shadow-premium transition-all duration-500 group-hover:scale-[1.02] group-hover:bg-white/5 active:scale-[0.98]">
                                <div className={`p-4 rounded-2xl ${m.bg} ${m.color} w-fit mb-6 transition-transform duration-500 group-hover:rotate-12`}>
                                    <Icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-black font-space mb-2">{m.name}</h3>
                                <p className="text-muted-foreground font-medium">Acessar área de {m.name.toLowerCase()}.</p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
