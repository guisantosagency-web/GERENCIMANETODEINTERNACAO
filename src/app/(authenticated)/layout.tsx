"use client"

import type React from "react"

import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

const adminRoutes = ["/dashboard", "/internacoes", "/admin", "/triagem", "/recepcao", "/portal", "/pacientes", "/resultados"]
const userRoutes = ["/internacoes", "/triagem", "/recepcao", "/portal", "/resultados"]

function AuthenticatedLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (!isLoading && user) {
      const allowedRoutes = user.role === "admin" ? adminRoutes : userRoutes
      const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route))

      // No redirect if at root/login
      if (pathname === "/") return

      if (!hasAccess) {
        if (user.role === "admin") {
          router.push("/portal")
        } else if (user.allowedModules && user.allowedModules.length > 0) {
          router.push("/portal")
        } else {
          router.push("/internacoes")
        }
      }
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary animate-pulse" />
          <p className="text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const allowedRoutes = user.role === "admin" ? adminRoutes : userRoutes
  // /resultados é sempre permitido para todos os usuários autenticados
  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route)) || pathname.startsWith("/resultados")

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary animate-pulse" />
          <p className="text-muted-foreground font-medium">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[oklch(0.975_0.008_265)] via-[oklch(0.970_0.012_280)] to-[oklch(0.968_0.010_255)]">
      {/* Premium Ambient Background — orbs flutuantes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Orbs de Plasma */}
        <div className="ambient-orb floating w-[700px] h-[700px] bg-gradient-to-br from-violet-200/50 to-blue-200/30 -top-48 -right-48" />
        <div className="ambient-orb floating-slow w-[500px] h-[500px] bg-gradient-to-br from-blue-200/40 to-cyan-100/30 top-1/3 -left-32" />
        <div className="ambient-orb floating-delay w-[400px] h-[400px] bg-gradient-to-br from-purple-100/40 to-pink-100/20 bottom-0 right-1/4" />
        <div className="ambient-orb glow-pulse-slow w-[300px] h-[300px] bg-gradient-to-br from-indigo-200/30 to-violet-100/20 top-1/4 right-1/3" />
        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }} />
      </div>

      <Sidebar />
      <MainContent>{children}</MainContent>
    </div>
  )
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <>
      <main
        className={cn(
          "flex-1 relative z-10 transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1600px] mx-auto">{children}</div>
      </main>
      <div
        className={cn(
          "relative z-10 transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        <Footer />
      </div>
    </>
  )
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AuthenticatedLayoutContent>{children}</AuthenticatedLayoutContent>
      </SidebarProvider>
    </AuthProvider>
  )
}
