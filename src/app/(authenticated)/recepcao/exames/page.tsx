"use client"

import { Search } from "lucide-react"

export default function ExamesPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="p-6 rounded-[2rem] bg-blue-500/10 text-blue-500 shadow-premium">
                <Search className="h-16 w-16" />
            </div>
            <h1 className="text-4xl font-black font-space tracking-tight gradient-text">Submódulo: Exames</h1>
            <p className="text-muted-foreground font-medium text-lg text-center max-w-md">
                Em desenvolvimento para a Recepção.
            </p>
        </div>
    )
}
