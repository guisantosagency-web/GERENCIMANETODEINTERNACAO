"use client"

import { cn } from "@/lib/utils"

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("py-10 mt-10 border-t border-slate-100 flex flex-col items-center justify-center gap-2", className)}>
      <div className="flex items-center gap-2 opacity-40">
        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          Healthcare Management System v2.0
        </p>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      </div>
      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest hover:text-teal-500 transition-colors cursor-default">
        Desenvolvido por <span className="text-slate-400">Guilherme Santos</span> — <span className="text-teal-500/50">Avero Agency</span>
      </p>
    </footer>
  )
}
