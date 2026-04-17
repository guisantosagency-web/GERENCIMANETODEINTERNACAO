"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard, LayoutGrid, Users, Settings, LogOut, Menu, X, Hospital,
  ChevronLeft, ChevronRight, Activity, ShieldCheck, ClipboardCheck,
  PhoneCall, UserCircle2, PackageCheck
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/lib/sidebar-context"

const adminMenuItems = [
  { id: "portal",      href: "/portal",      label: "Módulos",    icon: LayoutGrid,     activeColor: "bg-teal-500 text-white",    iconColor: "text-teal-500" },
  { id: "dashboard",   href: "/dashboard",   label: "Dashboard",  icon: Activity,       activeColor: "bg-blue-500 text-white",    iconColor: "text-blue-500" },
  { id: "internacoes", href: "/internacoes", label: "Internações", icon: Users,          activeColor: "bg-purple-500 text-white",  iconColor: "text-purple-500" },
  { id: "triagem",     href: "/triagem",     label: "Triagem",    icon: ClipboardCheck, activeColor: "bg-emerald-500 text-white", iconColor: "text-emerald-500" },
  { id: "recepcao",    href: "/recepcao",    label: "Recepção",   icon: PhoneCall,      activeColor: "bg-orange-500 text-white",  iconColor: "text-orange-500" },
  { id: "resultados",  href: "/resultados",  label: "Entrega",    icon: PackageCheck,   activeColor: "bg-cyan-500 text-white",    iconColor: "text-cyan-500" },
  { id: "pacientes",   href: "/pacientes",   label: "Pacientes",  icon: UserCircle2,    activeColor: "bg-rose-500 text-white",    iconColor: "text-rose-500" },
  { id: "admin",       href: "/admin",       label: "Admin",      icon: Settings,       activeColor: "bg-slate-600 text-white",   iconColor: "text-slate-500" },
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
          "fixed top-4 left-4 z-50 lg:hidden transition-all duration-500 rounded-xl h-10 w-10 bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "lg:translate-x-0 bg-white border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.04)]",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-[72px]" : "lg:w-64",
        )}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400" />

        <div className="flex flex-col h-full relative pt-1">
          {/* Collapse toggle */}
          <button
            className="absolute -right-3 top-8 h-6 w-6 rounded-full bg-white border border-slate-200 text-slate-500 shadow-md hidden lg:flex items-center justify-center z-50 hover:scale-110 hover:border-teal-400 hover:text-teal-600 transition-all duration-300"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>

          {/* Logo Area */}
          <div className={cn("p-6 mb-2", isCollapsed && "px-3 items-center flex flex-col")}>
            <div className="flex items-center gap-3.5">
              <div className="relative group shrink-0">
                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-md shadow-teal-200 transition-transform duration-500 group-hover:scale-110">
                  <Hospital className="h-5 w-5" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h1 className="font-bold text-slate-800 text-sm tracking-tight leading-tight">
                    AMBULATÓRIO<br />DIGITAL
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SISTEMA ATIVO</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className={cn("mx-6 h-px bg-slate-100 mb-4", isCollapsed && "mx-3")} />

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar scroll-smooth">
            {!isCollapsed && (
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-3 opacity-60">Menu Principal</p>
            )}
            {menuItems.map((item) => {
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
                      ? `${item.activeColor} shadow-sm font-bold`
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                    isCollapsed && "justify-center px-0 h-11 w-11 mx-auto",
                  )}
                >
                  <div className={cn(
                    "relative z-10 flex items-center justify-center transition-all duration-300 shrink-0",
                    isActive ? "text-white scale-105" : cn(item.iconColor, "group-hover:scale-110"),
                  )}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>

                  {!isCollapsed && (
                    <span className="relative z-10 text-[13px] font-bold tracking-wide uppercase">
                      {item.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Profile Area */}
          <div className={cn("p-4 border-t border-slate-100 space-y-3", isCollapsed && "items-center flex flex-col pt-6")}>
            <button
              onClick={logout}
              className={cn(
                "flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-300 w-full group",
                "bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white hover:shadow-sm hover:shadow-rose-200 hover:border-rose-500",
                isCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
              )}
              title="Sair do Sistema"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && <span className="text-[12px] font-bold uppercase tracking-wider">Sair</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
