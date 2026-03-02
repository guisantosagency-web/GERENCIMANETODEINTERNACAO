"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Persist state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved) setIsCollapsed(saved === "true")
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newState = !prev
      localStorage.setItem("sidebar-collapsed", String(newState))
      return newState
    })
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
