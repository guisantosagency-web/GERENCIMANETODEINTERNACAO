"use client"
import { List } from "lucide-react"

export default function ChegadaTab() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
       <div className="p-6 rounded-[2rem] bg-emerald-500/10 text-emerald-500 shadow-premium">
           <List className="h-16 w-16" />
       </div>
       <h1 className="text-4xl font-black font-space tracking-tight text-foreground">Recepção (Chegada)</h1>
       <p className="text-muted-foreground font-medium text-lg text-center max-w-md">
           Módulo em desenvolvimento.
       </p>
    </div>
  )
}
