"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard, Users, Settings, LogOut, Menu, X, Hospital,
  ChevronLeft, ChevronRight, Activity, ShieldCheck, ClipboardCheck,
  PhoneCall, UserCircle2, PackageCheck
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/lib/sidebar-context"

const adminMenuItems = [
  { id: "portal",     href: "/portal",     label: "Módulos",    icon: LayoutGrid,      color: "text-[#FF6B35]",   activeBg: "from-[#FF6B35] to-[#FF8C00]", glow: "shadow-[#FF6B35]/20" },
  { id: "dashboard",  href: "/dashboard",  label: "Dashboard",  icon: Activity,        color: "text-[#00D9FF]",   activeBg: "from-[#00D9FF] to-[#00A3FF]", glow: "shadow-[#00D9FF]/20" },
  { id: "internacoes",href: "/internacoes",label: "Internações",icon: Users,           color: "text-[#FF1493]",   activeBg: "from-[#FF1493] to-[#C71585]", glow: "shadow-[#FF1493]/20" },
  { id: "triagem",    href: "/triagem",    label: "Triagem",    icon: ClipboardCheck,  color: "text-[#00FF88]",   activeBg: "from-[#00FF88] to-[#00CC6A]", glow: "shadow-[#00FF88]/20" },
  { id: "recepcao",   href: "/recepcao",   label: "Recepção",   icon: PhoneCall,       color: "text-[#FF6B35]",   activeBg: "from-[#FF6B35] to-[#FF8C00]", glow: "shadow-[#FF6B35]/20" },
  { id: "resultados", href: "/resultados", label: "Entrega",    icon: PackageCheck,    color: "text-[#00D9FF]",   activeBg: "from-[#00D9FF] to-[#00A3FF]", glow: "shadow-[#00D9FF]/20" },
  { id: "pacientes",  href: "/pacientes",  label: "Pacientes",  icon: UserCircle2,     color: "text-[#FF1493]",   activeBg: "from-[#FF1493] to-[#C71585]", glow: "shadow-[#FF1493]/20" },
  { id: "admin",      href: "/admin",      label: "Admin",      icon: Settings,        color: "text-slate-400",   activeBg: "from-slate-600 to-slate-800", glow: "shadow-slate-400/10" },
]

export function Sidebar() {
  const pathname  = usePathname()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen]       = useState(false)
  const { isCollapsed, toggleSidebar } = useSidebar()
  const [ready, setReady]         = useState(false)

  useEffect(() => {
    setTimeout(() => setReady(true), 50)
  }, [])

  const menuItems = useMemo(() => {
    if (user?.role === "admin") return adminMenuItems
    return adminMenuItems.filter(item =>
      item.id === "portal" ||
      item.id === "resultados" || 
      user?.allowedModules?.includes(item.id.toUpperCase()) ||
      user?.allowedModules?.includes(item.label.toUpperCase())
    )
  }, [user])

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-4 left-4 z-50 lg:hidden transition-all duration-500 rounded-2xl h-10 w-10 bg-[#0F1419] border border-white/5 text-white"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "lg:translate-x-0 bg-[#0F1419] border-r border-white/5",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-[72px]" : "lg:w-64",
        )}
      >
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/5 blur-3xl rounded-full" />

        <div className="flex flex-col h-full relative">
          {/* Collapse toggle */}
          <button
            className="absolute -right-3 top-8 h-6 w-6 rounded-full bg-[#161B22] border border-white/10 text-white shadow-xl hidden lg:flex items-center justify-center z-50 hover:scale-110 hover:border-[#FF6B35]/40 transition-all duration-300"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>

          {/* Logo Area */}
          <div className={cn("p-6 mb-2", isCollapsed && "px-3 items-center flex flex-col")}>
            <div className="flex items-center gap-3.5">
              <div className="relative group shrink-0">
                <div className="absolute -inset-2 bg-gradient-to-br from-[#FF6B35] to-[#FF8C00] rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C00] text-white shadow-lg transition-transform duration-500">
                  <Hospital className="h-5 w-5" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h1 className="font-black text-white text-base tracking-tight leading-tight font-space">
                    AMBULATÓRIO<br />DIGITAL
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#00FF88] shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
                    <span className="text-[9px] font-black text-[#7E8C9A] uppercase tracking-[0.2em]">SISTEMA ATIVO</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className={cn("mx-6 h-px bg-white/5 mb-4", isCollapsed && "mx-3")} />

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar scroll-smooth">
            {!isCollapsed && (
              <p className="text-[9px] font-black text-[#7E8C9A] uppercase tracking-[0.25em] px-3 mb-3 opacity-50 font-space">Menu Principal</p>
            )}
            {menuItems.map((item, idx) => {
              const Icon     = item.icon
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
                    isActive
                      ? `bg-gradient-to-r ${item.activeBg} text-white shadow-lg shadow-black/20 font-bold`
                      : "text-[#7E8C9A] hover:bg-white/5 hover:text-white",
                    isCollapsed && "justify-center px-0 h-11 w-11 mx-auto",
                  )}
                >
                  <div className={cn(
                    "relative z-10 flex items-center justify-center transition-all duration-300 shrink-0",
                    isActive ? "text-white scale-110" : cn(item.color, "group-hover:scale-110"),
                  )}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>

                  {!isCollapsed && (
                    <span className="relative z-10 text-[13px] font-bold tracking-wide font-space uppercase">
                      {item.label}
                    </span>
                  )}
                  
                  {isActive && (
                    <div className={cn("absolute inset-0 bg-white/10 rounded-xl blur-sm opacity-50 z-0")} />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Profile Area (Mini) */}
          <div className={cn("p-4 border-t border-white/5 space-y-3", isCollapsed && "items-center flex flex-col pt-6")}>
            <button
              onClick={logout}
              className={cn(
                "flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-300 w-full group",
                "bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/20",
                isCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
              )}
              title="Sair do Sistema"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && <span className="text-[12px] font-black uppercase tracking-widest font-space">Sair</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
