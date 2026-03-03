"use client"

import { UserRoundPlus } from "lucide-react"

export default function RetornoPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="p-6 rounded-[2rem] bg-amber-500/10 text-amber-500 shadow-premium">
                <UserRoundPlus className="h-16 w-16" />
            </div>
            <h1 className="text-4xl font-black font-space tracking-tight gradient-text">Submódulo: Retorno</h1>
            <p className="text-muted-foreground font-medium text-lg text-center max-w-md">
                Em desenvolvimento para a Recepção.
            </p>
        </div>
    )
}
