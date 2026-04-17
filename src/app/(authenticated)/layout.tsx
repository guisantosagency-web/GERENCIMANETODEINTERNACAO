"use client"

import type React from "react"

import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { TabProvider } from "@/lib/tab-context"
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
    <TabProvider>
      <div className="min-h-screen flex flex-col bg-[#F4F7F9] overflow-x-hidden">
        {/* Healthcare Light — Subtle ambient */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="ambient-orb floating w-[700px] h-[700px] bg-teal-400/5 -top-48 -right-48" />
          <div className="ambient-orb floating-slow w-[500px] h-[500px] bg-cyan-400/4 top-1/3 -left-32" />
          <div className="ambient-orb floating-delay w-[400px] h-[400px] bg-emerald-400/4 bottom-0 right-1/4" />
        </div>

        <Sidebar />
        <Header />
        <MainContent>{children}</MainContent>
      </div>
    </TabProvider>
  )
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <>
      <main
        className={cn(
          "flex-1 relative z-10 transition-all duration-300 ease-in-out mt-16",
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
        )}
      >
        <div className="p-4 lg:p-8 max-w-[1800px] mx-auto">{children}</div>
      </main>
      <div
        className={cn(
          "relative z-10 transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-64",
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
