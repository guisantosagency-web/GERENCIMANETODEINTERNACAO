"use client"

import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"
import { 
  Bell, 
  Search, 
  User, 
  ChevronDown,
  LayoutGrid,
  Settings
} from "lucide-react"

interface HeaderProps {
  moduleName?: string
  tabs?: { id: string, label: string, icon: any }[]
  activeTab?: string
  onTabChange?: (id: string) => void
}

import { useTabContext } from "@/lib/tab-context"

export function Header() {
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  const { activeTab, setActiveTab, tabs, moduleName } = useTabContext()
  const pathname = usePathname()

  const getModuleTitle = () => {
    if (moduleName) return moduleName
    if (pathname.includes("/recepcao")) return "Gestão de Exames"
    if (pathname.includes("/internacoes")) return "Gerenciamento de Internação"
    if (pathname.includes("/pacientes")) return "Central de Pacientes"
    if (pathname.includes("/admin")) return "Painel Administrativo"
    return "Módulo Operacional"
  }

  return (
    <header 
      className={cn(
        "fixed top-0 right-0 z-50 h-16 transition-all duration-500 ease-in-out",
        "bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-[0_1px_12px_rgba(0,0,0,0.04)]",
        isCollapsed ? "left-[80px]" : "left-0 lg:left-72"
      )}
    >
      <div className="h-full px-4 lg:px-6 flex items-center gap-4 relative overflow-hidden">

        {/* Left: Module Info + Navigation Tabs — scrollable */}
        <div className="flex items-center gap-6 flex-1 min-w-0 overflow-hidden">
          <div className="hidden xl:flex flex-col shrink-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Módulo Ativo</p>
            </div>
            <h1 className="text-base font-bold text-slate-800 leading-none tracking-tight whitespace-nowrap">
              {getModuleTitle()}
            </h1>
          </div>

          {/* Navigation Tabs — horizontal scroll on small screens */}
          {tabs && tabs.length > 0 && (
            <nav className="flex items-center p-1 bg-slate-100 rounded-2xl space-x-0.5 overflow-x-auto no-scrollbar min-w-0 flex-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "group relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 whitespace-nowrap shrink-0",
                      isActive 
                        ? "bg-white text-slate-800 shadow-sm font-bold"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 transition-colors duration-300 shrink-0", isActive ? "text-teal-500" : "group-hover:text-teal-500")} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-teal-500 rounded-full" />
                    )}
                  </button>
                )
              })}
            </nav>
          )}
        </div>

        {/* Right: User Controls */}
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <div className="hidden md:flex relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-44 lg:w-56 h-10 pl-10 pr-4 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
             <button className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 transition-all text-slate-500 hover:text-rose-500 border border-slate-200 hover:border-rose-200">
               <Bell className="h-4 w-4" />
               <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-sm" />
             </button>

             <div className="h-8 w-px bg-slate-200 mx-1" />

             {/* Profile Badge */}
             <button className="flex items-center gap-3 py-2 pl-3 pr-2 rounded-2xl bg-slate-100 border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all group">
               <div className="text-right shrink-0">
                 <p className="text-[11px] font-bold text-slate-700 leading-none mb-0.5 group-hover:text-teal-700 transition-colors">
                   {user?.name.split(' ')[0]}
                 </p>
                 <div className="flex items-center justify-end gap-1">
                   <div className="h-1 w-1 rounded-full bg-emerald-500" />
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                     {user?.role === "admin" ? "Admin" : "Operador"}
                   </p>
                 </div>
               </div>

               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                 {user?.name.charAt(0).toUpperCase()}
               </div>
               
               <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-all mr-0.5" />
             </button>
          </div>
        </div>
      </div>
    </header>
  )
}
