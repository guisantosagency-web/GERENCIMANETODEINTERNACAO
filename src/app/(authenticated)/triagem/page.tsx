"use client"

import { useState } from "react"
import { ClipboardCheck, ListFilter, LayoutDashboard, FormInput } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FormularioTab from "./formulario-tab"
import ListaTab from "./lista-tab"
import DashboardTab from "./dashboard-tab"

export default function TriagemPage() {
  const [activeTab, setActiveTab] = useState("formulario")

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-emerald-500 rounded-[2rem] shadow-lg shadow-emerald-500/20 text-white">
              <ClipboardCheck className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-black font-space tracking-tight text-slate-800 uppercase">
                Módulo de Triagem
              </h1>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
                Hospital de Traumatologia e Ortopedia
              </p>
            </div>
          </div>
        </div>

        {/* Tabs System */}
        <Tabs defaultValue="formulario" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="bg-white/50 backdrop-blur-xl p-2 rounded-[2.5rem] border border-slate-200 h-20 shadow-lg">
              <TabsTrigger 
                value="formulario" 
                className="rounded-[2rem] px-10 h-16 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-black uppercase text-xs tracking-widest gap-3"
              >
                <FormInput className="h-5 w-5" /> Novo Atendimento
              </TabsTrigger>
              <TabsTrigger 
                value="lista" 
                className="rounded-[2rem] px-10 h-16 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-black uppercase text-xs tracking-widest gap-3"
              >
                <ListFilter className="h-5 w-5" /> Lista de Pacientes
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="rounded-[2rem] px-10 h-16 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-black uppercase text-xs tracking-widest gap-3"
              >
                <LayoutDashboard className="h-5 w-5" /> Dashboard
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="formulario" className="mt-0 focus-visible:outline-none">
            <FormularioTab />
          </TabsContent>

          <TabsContent value="lista" className="mt-0 focus-visible:outline-none">
            <ListaTab />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0 focus-visible:outline-none">
            <DashboardTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
