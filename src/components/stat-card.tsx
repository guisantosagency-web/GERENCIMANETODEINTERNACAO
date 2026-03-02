import { memo } from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  variant?: "primary" | "secondary" | "accent" | "warning"
  className?: string
}

export const StatCard = memo(function StatCard({ title, value, subtitle, icon: Icon, variant = "primary", className }: StatCardProps) {
  const variants = {
    primary: "from-primary/20 via-primary/5 to-transparent border-primary/20 text-primary",
    secondary: "from-blue-500/20 via-blue-500/5 to-transparent border-blue-500/20 text-blue-500",
    accent: "from-pink-500/20 via-pink-500/5 to-transparent border-pink-500/20 text-pink-500",
    warning: "from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/20 text-amber-500",
  }

  const iconVariants = {
    primary: "bg-primary text-primary-foreground shadow-primary/20",
    secondary: "bg-blue-500 text-white shadow-blue-500/20",
    accent: "bg-pink-500 text-white shadow-pink-500/20",
    warning: "bg-amber-500 text-white shadow-amber-500/20",
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden group p-6 glass-card rounded-3xl border transition-all duration-500",
        "hover:scale-[1.02] hover:shadow-premium bg-gradient-to-br",
        variants[variant],
        className
      )}
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="h-24 w-24 -rotate-12" />
      </div>

      <div className="relative flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black font-space tracking-tight text-foreground">{value}</h3>
          </div>
          {subtitle && (
            <p className="text-xs font-bold text-muted-foreground/80 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {subtitle}
            </p>
          )}
        </div>
        
        <div className={cn("p-3.5 rounded-2xl shadow-indicator transition-transform duration-500 group-hover:scale-110", iconVariants[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-10" />
    </div>
  )
})
StatCard.displayName = "StatCard"
