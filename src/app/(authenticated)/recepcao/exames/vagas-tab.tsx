"use client"
import { Search } from "lucide-react"

export default function VagasTab() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
       <div className="p-6 rounded-[2rem] bg-amber-500/10 text-amber-500 shadow-premium">
           <Search className="h-16 w-16" />
       </div>
       <h1 className="text-4xl font-black font-space tracking-tight text-foreground">Controle de Vagas</h1>
       <p className="text-muted-foreground font-medium text-lg text-center max-w-md">
           Módulo em desenvolvimento.
       </p>
    </div>
  )
}
