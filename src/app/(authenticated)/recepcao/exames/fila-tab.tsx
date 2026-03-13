"use client"
import { Play } from "lucide-react"

export default function FilaTab() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
       <div className="p-6 rounded-[2rem] bg-purple-500/10 text-purple-500 shadow-premium">
           <Play className="h-16 w-16" />
       </div>
       <h1 className="text-4xl font-black font-space tracking-tight text-foreground">Fila de Atendimento</h1>
       <p className="text-muted-foreground font-medium text-lg text-center max-w-md">
           Módulo em desenvolvimento.
       </p>
    </div>
  )
}
