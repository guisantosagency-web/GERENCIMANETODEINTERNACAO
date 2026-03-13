"use client"
import { CalendarDays } from "lucide-react"

export default function AgendamentoTab() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
       <div className="p-6 rounded-[2rem] bg-blue-500/10 text-blue-500 shadow-premium">
           <CalendarDays className="h-16 w-16" />
       </div>
       <h1 className="text-4xl font-black font-space tracking-tight text-foreground">Novo Agendamento</h1>
       <p className="text-muted-foreground font-medium text-lg text-center max-w-md">
           Módulo em desenvolvimento.
       </p>
    </div>
  )
}
