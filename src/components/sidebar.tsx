"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LayoutDashboard, Users, Settings, LogOut, Menu, X, Hospital, ChevronLeft, ChevronRight, Activity, ShieldCheck, ClipboardCheck, PhoneCall, Stethoscope, Search, UserRoundPlus, UserCircle2, PackageCheck } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/lib/sidebar-context"

const adminMenuItems = [
  { id: "portal", href: "/portal", label: "Módulos", icon: LayoutDashboard, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "internacoes", href: "/internacoes", label: "Internações", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  { id: "triagem", href: "/triagem", label: "Triagem", icon: ClipboardCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "recepcao", href: "/recepcao", label: "Recepção", icon: PhoneCall, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "resultados", href: "/resultados", label: "Entrega", icon: PackageCheck, color: "text-emerald-600", bg: "bg-emerald-600/10" },
  { id: "pacientes", href: "/pacientes", label: "Pacientes", icon: UserCircle2, color: "text-teal-500", bg: "bg-teal-500/10" },
  { id: "admin", href: "/admin", label: "Admin", icon: Settings, color: "text-amber-500", bg: "bg-amber-500/10" },
]

const userMenuItems = [{ href: "/internacoes", label: "Internações", icon: Users, color: "text-primary", bg: "bg-primary/10" }]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const { isCollapsed, toggleSidebar } = useSidebar()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const menuItems = useMemo(() => {
    if (user?.role === "admin") return adminMenuItems
    return adminMenuItems.filter(item =>
      item.id === "portal" ||
      item.id === "dashboard" ||
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
          "fixed top-6 left-6 z-50 lg:hidden transition-all duration-500 rounded-2xl shadow-premium",
          scrolled ? "bg-card/80 backdrop-blur-xl" : "bg-card"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6 text-primary" /> : <Menu className="h-6 w-6 text-primary" />}
      </Button>

      {/* Modern Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/40 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-500"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Premium Sidebar 2026 */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)",
          "lg:translate-x-0 lg:m-3 lg:h-[calc(100vh-1.5rem)] lg:rounded-[2rem] glass-card shadow-premium",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          "!bg-card/60 backdrop-blur-2xl border-white/10"
        )}
      >
        <div className="flex flex-col h-full relative">
          {/* Collapse toggle (Premium Style) */}
          <button
            className="absolute -right-4 top-12 h-8 w-8 rounded-xl bg-primary text-primary-foreground shadow-premium hidden lg:flex items-center justify-center z-50 hover:scale-110 transition-transform duration-300"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Header Area */}
          <div className={cn("p-4 mb-2", isCollapsed && "px-2")}>
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div className="absolute -inset-2 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative p-2 rounded-2xl bg-primary text-primary-foreground shadow-indicator transition-transform duration-500 group-hover:rotate-12">
                  <Hospital className="h-6 w-6" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="min-w-0 animate-in fade-in slide-in-from-left-4 duration-500">
                  <h1 className="font-black text-foreground text-lg tracking-tight leading-tight">AMBULATORIO<br />DIGITAL</h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Activity className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Protocolo Live</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-3 overflow-y-auto no-scrollbar">
            {!isCollapsed && (
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] px-4 mb-4">Navegação Principal</p>
            )}
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-4 px-3 py-2.5 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-premium"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    isCollapsed && "justify-center px-0 h-12 w-12 mx-auto",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-all duration-500 shrink-0",
                      !isActive && "group-hover:scale-110 group-hover:text-primary",
                      isActive && "rotate-0 scale-110"
                    )}
                  />
                  {!isCollapsed && <span className="font-black font-space text-sm tracking-tight">{item.label}</span>}

                  {isActive && !isCollapsed && (
                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary-foreground shadow-indicator" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Premium Footer Area */}
          <div className={cn("px-3 pb-8 mt-auto flex flex-col gap-4", isCollapsed && "pb-12")}>
            {/* Standalone Logout Button Above User Profile */}
            <button
              onClick={logout}
              className={cn(
                "flex items-center gap-4 px-3 py-2.5 rounded-2xl transition-all duration-500 group relative bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white shadow-premium",
                isCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
              )}
              title={isCollapsed ? "Encerrar Sessão" : undefined}
            >
              <LogOut className={cn("h-5 w-5 shrink-0 transition-transform duration-500 group-hover:scale-110")} />
              {!isCollapsed && <span className="font-black font-space text-sm tracking-tight">Sair do Sistema</span>}
            </button>

            <div className={cn(
              "flex items-center gap-4 p-2 rounded-3xl bg-white/5 border border-white/5 group transition-all duration-500 hover:bg-white/10",
              isCollapsed && "px-0 justify-center h-12 w-12 mx-auto",
            )}>
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-primary/10 transition-all group-hover:scale-105 duration-500">
                  <span className="text-primary font-black text-lg">{user?.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-emerald-500 shadow-indicator ring-2 ring-card">
                  <ShieldCheck className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <p className="font-black text-foreground text-sm truncate uppercase tracking-tight">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
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

