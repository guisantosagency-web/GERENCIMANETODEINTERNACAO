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
  { id: "portal",     href: "/portal",     label: "Módulos",    icon: LayoutDashboard, color: "text-amber-500",   glow: "shadow-amber-500/30",   activeBg: "from-amber-500 to-orange-500" },
  { id: "dashboard",  href: "/dashboard",  label: "Dashboard",  icon: Activity,        color: "text-blue-500",    glow: "shadow-blue-500/30",    activeBg: "from-blue-500 to-indigo-600"  },
  { id: "internacoes",href: "/internacoes",label: "Internações",icon: Users,           color: "text-primary",     glow: "shadow-primary/30",     activeBg: "from-violet-600 to-purple-700"},
  { id: "triagem",    href: "/triagem",    label: "Triagem",    icon: ClipboardCheck,  color: "text-emerald-500", glow: "shadow-emerald-500/30", activeBg: "from-emerald-500 to-teal-600" },
  { id: "recepcao",   href: "/recepcao",   label: "Recepção",   icon: PhoneCall,       color: "text-purple-500",  glow: "shadow-purple-500/30",  activeBg: "from-purple-500 to-indigo-600"},
  { id: "resultados", href: "/resultados", label: "Entrega",    icon: PackageCheck,    color: "text-teal-500",    glow: "shadow-teal-500/30",    activeBg: "from-teal-500 to-emerald-600" },
  { id: "pacientes",  href: "/pacientes",  label: "Pacientes",  icon: UserCircle2,     color: "text-cyan-500",    glow: "shadow-cyan-500/30",    activeBg: "from-cyan-500 to-blue-600"   },
  { id: "admin",      href: "/admin",      label: "Admin",      icon: Settings,        color: "text-slate-500",   glow: "shadow-slate-400/30",   activeBg: "from-slate-600 to-slate-800"  },
]

export function Sidebar() {
  const pathname  = usePathname()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen]       = useState(false)
  const { isCollapsed, toggleSidebar } = useSidebar()
  const [scrolled, setScrolled]   = useState(false)
  const [ready, setReady]         = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    setTimeout(() => setReady(true), 50)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const menuItems = useMemo(() => {
    if (user?.role === "admin") return adminMenuItems
    return adminMenuItems.filter(item =>
      item.id === "portal" ||
      item.id === "resultados" || // Entrega sempre visível para todos
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
          "fixed top-5 left-5 z-50 lg:hidden transition-all duration-500 rounded-2xl h-12 w-12",
          scrolled ? "glass-premium shadow-premium" : "bg-white/80 shadow-soft"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen
          ? <X   className="h-5 w-5 text-primary" />
          : <Menu className="h-5 w-5 text-primary" />
        }
      </Button>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/30 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "lg:translate-x-0 lg:m-3 lg:h-[calc(100vh-1.5rem)] lg:rounded-[2rem]",
          "glass-premium shadow-premium border border-white/80",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-[72px]" : "lg:w-64",
        )}
      >
        {/* Decorative top gradient streak */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[2rem] bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 opacity-70" />

        <div className="flex flex-col h-full relative">
          {/* Collapse toggle */}
          <button
            className="absolute -right-4 top-12 h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-premium hidden lg:flex items-center justify-center z-50 hover:scale-110 transition-all duration-300"
            onClick={toggleSidebar}
          >
            {isCollapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronLeft  className="h-4 w-4" />
            }
          </button>

          {/* Logo Area */}
          <div className={cn("p-5 mb-1", isCollapsed && "px-3")}>
            <div className="flex items-center gap-3.5">
              <div className="relative group shrink-0">
                <div className="absolute -inset-2 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500 glow-pulse" />
                <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-premium transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
                  <Hospital className="h-5 w-5" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="min-w-0 animate-in fade-in slide-in-from-left-3 duration-500">
                  <h1 className="font-black text-foreground text-base tracking-tight leading-tight">AMBULATORIO<br />DIGITAL</h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="relative">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-emerald-500 ping-subtle" />
                    </div>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Protocolo Live</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nav divider */}
          <div className={cn("mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3", isCollapsed && "mx-2")} />

          {/* Navigation — com cascade animation */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
            {!isCollapsed && (
              <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] px-3 mb-3">Menu Principal</p>
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
                  style={ready ? { animationDelay: `${idx * 55}ms` } : {}}
                  className={cn(
                    "cascade-1 flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-400 group relative overflow-hidden",
                    isActive
                      ? `bg-gradient-to-r ${item.activeBg} text-white shadow-lg`
                      : "text-muted-foreground hover:bg-slate-50 hover:text-foreground",
                    isCollapsed && "justify-center px-0 h-11 w-11 mx-auto",
                  )}
                >
                  {/* Active aura glow */}
                  {isActive && (
                    <div className={cn("absolute inset-0 opacity-30 blur-sm bg-gradient-to-r", item.activeBg)} />
                  )}

                  <div className={cn(
                    "relative z-10 flex items-center justify-center rounded-xl transition-all duration-300 shrink-0",
                    isActive
                      ? "text-white"
                      : cn(item.color, "group-hover:scale-110"),
                    !isCollapsed && !isActive && "w-7 h-7"
                  )}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>

                  {!isCollapsed && (
                    <span className="relative z-10 font-black text-[13px] tracking-tight font-space">{item.label}</span>
                  )}

                  {/* Active indicator dot */}
                  {isActive && !isCollapsed && (
                    <div className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom divider */}
          <div className={cn("mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent mt-2 mb-3", isCollapsed && "mx-2")} />

          {/* Footer */}
          <div className={cn("px-3 pb-6 flex flex-col gap-2.5", isCollapsed && "pb-8 items-center")}>
            {/* Logout */}
            <button
              onClick={logout}
              title={isCollapsed ? "Sair do Sistema" : undefined}
              className={cn(
                "flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-300 group",
                "bg-rose-50 text-rose-500 hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-600 hover:text-white hover:shadow-lg hover:shadow-rose-500/20",
                isCollapsed && "justify-center px-0 h-11 w-11"
              )}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110" />
              {!isCollapsed && <span className="font-black text-[13px] tracking-tight font-space">Sair do Sistema</span>}
            </button>

            {/* User Badge */}
            <div className={cn(
              "flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-50/50 border border-slate-100 transition-all duration-300 hover:border-primary/20 hover:shadow-soft group",
              isCollapsed && "p-0 justify-center w-11 h-11 bg-transparent border-0"
            )}>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-primary/10 transition-all group-hover:scale-105 duration-500 group-hover:ring-primary/30">
                  <span className="text-primary font-black text-base">{user?.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-emerald-500 shadow-glow-emerald ring-2 ring-white">
                  <ShieldCheck className="h-2 w-2 text-white" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-in fade-in duration-500">
                  <p className="font-black text-foreground text-[12px] truncate uppercase tracking-tight">{user?.name}</p>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.15em] opacity-60">
                    {user?.role === "admin" ? "Administrador" : "Operacional"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
