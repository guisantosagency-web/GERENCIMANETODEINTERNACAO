"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface Tab {
  id: string
  label: string
  icon: any
}

interface TabContextType {
  activeTab: string
  setActiveTab: (id: string) => void
  tabs: Tab[]
  setTabs: (tabs: Tab[]) => void
  moduleName: string
  setModuleName: (name: string) => void
}

const TabContext = createContext<TabContextType | undefined>(undefined)

export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("")
  const [tabs, setTabs] = useState<Tab[]>([])
  const [moduleName, setModuleName] = useState("")

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab, tabs, setTabs, moduleName, setModuleName }}>
      {children}
    </TabContext.Provider>
  )
}

export function useTabContext() {
  const context = useContext(TabContext)
  if (context === undefined) {
    throw new Error("useTabContext must be used within a TabProvider")
  }
  return context
}
