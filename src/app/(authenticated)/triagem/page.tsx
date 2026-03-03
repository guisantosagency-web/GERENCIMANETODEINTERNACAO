"use client"

import { ClipboardCheck } from "lucide-react"

export default function TriagemPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="p-6 rounded-[2rem] bg-emerald-500/10 text-emerald-500 shadow-premium">
                <ClipboardCheck className="h-16 w-16" />
            </div>
            <h1 className="text-4xl font-black font-space tracking-tight gradient-text">Módulo de Triagem</h1>
            <p className="text-muted-foreground font-medium text-lg text-center max-w-md">
                Este módulo está em desenvolvimento. Em breve você poderá gerenciar as triagens aqui.
            </p>
        </div>
    )
}
