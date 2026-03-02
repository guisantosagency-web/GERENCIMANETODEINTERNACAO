"use client"

import type React from "react"

import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

const adminRoutes = ["/dashboard", "/internacoes", "/admin"]
const userRoutes = ["/internacoes"]

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

      if (!hasAccess) {
        router.push("/internacoes")
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
  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route))

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
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
