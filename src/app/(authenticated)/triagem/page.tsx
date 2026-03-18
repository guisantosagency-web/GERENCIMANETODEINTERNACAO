"use client"

import { useState } from "react"
import { ClipboardCheck, ListFilter, LayoutDashboard, FormInput, FileHeart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FormularioTab from "./formulario-tab"
import AdmissaoEnfermagemTab from "./admissao-tab"
import DashboardAdmissaoTab from "./dashboard-admissao-tab"
import ListaTab from "./lista-tab"
import DashboardTab from "./dashboard-tab"

export default function TriagemPage() {
  const [activeModule, setActiveModule] = useState("checklist")
  const [activeTabChecklist, setActiveTabChecklist] = useState("formulario")
  const [activeTabAdmissao, setActiveTabAdmissao] = useState("formulario")

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
          
          <div className="flex bg-slate-100 p-2 rounded-[2rem] border border-slate-200">
            <button
              onClick={() => setActiveModule("checklist")}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all ${
                activeModule === "checklist" ? "bg-white text-emerald-600 shadow-md" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ClipboardCheck className="h-4 w-4" /> Checklist Cirúrgico
            </button>
            <button
              onClick={() => setActiveModule("admissao")}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all ${
                activeModule === "admissao" ? "bg-white text-emerald-600 shadow-md" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileHeart className="h-4 w-4" /> Admissão de Enfermagem
            </button>
          </div>
        </div>

        {/* Modules Content */}
        {activeModule === "checklist" && (
          <Tabs defaultValue="formulario" value={activeTabChecklist} onValueChange={setActiveTabChecklist} className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-center">
              <TabsList className="bg-white/50 backdrop-blur-xl p-2 rounded-[2.5rem] border border-slate-200 h-20 shadow-lg">
                <TabsTrigger 
                  value="formulario" 
                  className="rounded-[2rem] px-10 h-16 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-black uppercase text-xs tracking-widest gap-2"
                >
                  <ClipboardCheck className="h-4 w-4" /> Checklist
                </TabsTrigger>
                <TabsTrigger 
                  value="lista" 
                  className="rounded-[2rem] px-10 h-16 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-black uppercase text-xs tracking-widest gap-2"
                >
                  <ListFilter className="h-4 w-4" /> Lista
                </TabsTrigger>
                <TabsTrigger 
                  value="dashboard" 
                  className="rounded-[2rem] px-10 h-16 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-black uppercase text-xs tracking-widest gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
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
        )}

        {activeModule === "admissao" && (
          <Tabs defaultValue="formulario" value={activeTabAdmissao} onValueChange={setActiveTabAdmissao} className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-center">
              <TabsList className="bg-white/50 backdrop-blur-xl p-2 rounded-[2.5rem] border border-slate-200 h-20 shadow-lg">
                <TabsTrigger 
                  value="formulario" 
                  className="rounded-[2rem] px-10 h-16 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-black uppercase text-xs tracking-widest gap-2"
                >
                  <FormInput className="h-4 w-4" /> Admissão
                </TabsTrigger>
                <TabsTrigger 
                  value="dashboard" 
                  className="rounded-[2rem] px-10 h-16 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-black uppercase text-xs tracking-widest gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="formulario" className="mt-0 focus-visible:outline-none">
              <AdmissaoEnfermagemTab />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-0 focus-visible:outline-none">
              <DashboardAdmissaoTab />
            </TabsContent>
          </Tabs>
        )}

      </div>
    </div>
  )
}
      </div>
    </div>
  )
}
