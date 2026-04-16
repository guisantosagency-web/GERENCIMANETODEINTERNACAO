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
        "fixed top-0 right-0 z-50 h-20 transition-all duration-500 ease-in-out border-b border-white/5",
        "bg-[#0F1419]/95 backdrop-blur-3xl",
        isCollapsed ? "left-[80px]" : "left-0 lg:left-72"
      )}
    >
      <div className="h-full px-8 flex items-center justify-between relative overflow-hidden">
        {/* Superior Scanning Line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF6B35]/40 to-transparent animate-pulse" />

        {/* Left: Tactical Module Info */}
        <div className="flex items-center gap-10">
          <div className="hidden xl:block shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-2 w-2 rounded-full bg-[#FF6B35] animate-ping shadow-[0_0_10px_#FF6B35]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#7E8C9A]">Active Module</h2>
            </div>
            <h1 className="text-2xl font-black font-space tracking-tighter text-white leading-none">
              {getModuleTitle()}
            </h1>
          </div>

          {/* Central Command Tabs (Superior Bar) */}
          {tabs && tabs.length > 0 && (
            <nav className="hidden lg:flex items-center p-1.5 bg-black/40 rounded-[1.5rem] border border-white/5 backdrop-blur-md shadow-2xl space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "group relative flex items-center gap-3 px-6 py-2.5 rounded-[1.1rem] transition-all duration-500 whitespace-nowrap overflow-hidden",
                      isActive 
                        ? "bg-white text-[#0F1419] shadow-[0_0_25px_rgba(255,255,255,0.15)] scale-105 z-10"
                        : "text-[#7E8C9A] hover:text-white hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/20 to-transparent animate-pulse pointer-events-none" />
                    )}
                    <Icon className={cn("h-4 w-4 transition-transform duration-500", isActive ? "scale-110 text-[#FF6B35]" : "group-hover:scale-110")} />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">{tab.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#FF6B35] shadow-[0_0_10px_#FF6B35]" />
                    )}
                  </button>
                )
              })}
            </nav>
          )}
        </div>

        {/* Right: Tactical HUD elements */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00D9FF]/20 to-transparent blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E8C9A] group-focus-within:text-[#00D9FF] transition-colors" />
            <input 
              type="text" 
              placeholder="GLOBAL SEARCH..." 
              className="w-48 lg:w-64 h-11 pl-12 pr-4 bg-[#161B22] border border-white/10 rounded-[1.2rem] text-[10px] font-black tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/20 transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-3">
             <button className="relative p-3 rounded-xl bg-white/5 hover:bg-[#FF1493]/10 transition-all text-[#7E8C9A] hover:text-[#FF1493] group border border-white/5">
               <Bell className="h-5 w-5 animate-pulse" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF1493] rounded-full ring-2 ring-[#0F1419] shadow-[0_0_8px_#FF1493]" />
             </button>

             <div className="h-10 w-px bg-white/10 mx-2" />

             {/* Tactical Profile Badge */}
             <button className="flex items-center gap-4 p-2 pl-3 rounded-[1.5rem] bg-[#161B22] border border-white/10 hover:border-[#FF6B35]/40 transition-all group overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               
               <div className="text-right shrink-0">
                 <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-none mb-1 group-hover:text-[#FF6B35] transition-colors">
                   {user?.name.split(' ')[0]}
                 </p>
                 <div className="flex items-center justify-end gap-1.5">
                   <div className="h-1 w-1 rounded-full bg-[#00FF88]" />
                   <p className="text-[8px] font-black text-[#7E8C9A] uppercase tracking-[0.2em] leading-none">
                     {user?.role === "admin" ? "ROOT_ADMIN" : "OP_USER"}
                   </p>
                 </div>
               </div>

               <div className="w-10 h-10 rounded-[0.9rem] bg-gradient-to-br from-[#FF6B35] to-[#FF8C00] flex items-center justify-center text-white font-black shadow-2xl relative z-10 border border-white/10">
                 {user?.name.charAt(0).toUpperCase()}
               </div>
               
               <ChevronDown className="h-4 w-4 text-[#7E8C9A] group-hover:text-white transition-all mr-1" />
             </button>
          </div>
        </div>
      </div>
    </header>
  )
}

