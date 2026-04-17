"use client"

import { cn } from "@/lib/utils"

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("fixed bottom-0 left-0 right-0 py-3 bg-white/60 backdrop-blur-md border-t border-slate-100 flex flex-col items-center justify-center gap-1 z-50 pointer-events-none", className)}>
      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest cursor-default select-none">
        Healthcare Management System v2.0 — Desenvolvido por <span className="text-slate-400">Guilherme Santos</span> — <span className="text-teal-500/50 uppercase">Avero Agency</span>
      </p>
    </footer>
  )
}
