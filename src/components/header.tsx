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
  Settings,
  LogOut,
  UserExchange
} from "lucide-react"

// Ícone personalizado para "Alterar Usuário" se não houver um bom no lucide
const UserExchange = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="m16 14 3-3 3 3"/><path d="M19 11v9"/>
  </svg>
)

interface HeaderProps {
  moduleName?: string
  tabs?: { id: string, label: string, icon: any }[]
  activeTab?: string
  onTabChange?: (id: string) => void
}

import { useTabContext } from "@/lib/tab-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

export function Header() {
  const { user, logout } = useAuth()
  const { isCollapsed } = useSidebar()
  const { activeTab, setActiveTab, tabs, moduleName } = useTabContext()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleChangeUser = () => {
    logout()
    router.push("/")
  }

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
            <nav className="flex items-center p-1 bg-slate-100 rounded-2xl space-x-0.5 overflow-x-auto min-w-0 flex-1">
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
        <div className="flex items-center gap-3 shrink-0 ml-auto">
             {/* Profile Dropdown */}
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <button className="flex items-center gap-3 py-2 pl-3 pr-2 rounded-2xl bg-slate-100 border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all group outline-none">
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
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-56 mt-2 p-2 rounded-2xl border-slate-100 shadow-xl">
                 <div className="px-2 py-3 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Usuário Logado</p>
                    <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                 </div>
                 <DropdownMenuSeparator className="bg-slate-50 mb-1" />
                 <DropdownMenuItem 
                   onClick={handleChangeUser}
                   className="flex items-center gap-3 py-3 px-3 rounded-xl text-slate-600 hover:text-teal-600 hover:bg-teal-50 transition-all cursor-pointer group"
                 >
                   <UserExchange className="h-4 w-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                   <span className="text-[11px] font-bold uppercase tracking-wide">Alterar Usuário</span>
                 </DropdownMenuItem>
                 <DropdownMenuItem 
                   onClick={handleLogout}
                   className="flex items-center gap-3 py-3 px-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-all cursor-pointer group mt-1"
                 >
                   <LogOut className="h-4 w-4 text-rose-400 group-hover:text-rose-500 transition-colors" />
                   <span className="text-[11px] font-bold uppercase tracking-wide">Sair do Sistema</span>
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
