"use client"

import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Play, Users, Loader2, 
  Clock, Printer, Trash2, CheckCircle2, X,
  Edit2, UserMinus, RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO, differenceInYears } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { Footer } from "@/components/footer"

// --------- Types ---------
type FilaItem = {
  id: string
  patient_name: string
  procedure_name: string
  exam_type: string
  status: string
  arrival_time: string | null
  birth_date: string | null
  priority: string
  chave_sisreg: string | null
}

type GroupedFilaItem = {
  patient_name: string
  arrival_time: string | null
  birth_date: string | null
  priority: string
  ids: string[]
  procedures: { id: string; name: string; type: string; status: string }[]
  status: string // Overall status (representative)
}

export default function FilaTab() {
  const [loading, setLoading] = useState(true)
  const [allData, setAllData] = useState<FilaItem[]>([])
  const [appointments, setAppointments] = useState<Record<string, GroupedFilaItem[]>>({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const { logos } = useAuth()

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => { loadData() }, [selectedDate])

  async function loadData() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("exam_appointments")
        .select("*")
        .eq("exam_date", selectedDate)
        .in("status", ["presente", "realizando", "finalizado", "falta"])
        .order("arrival_time", { ascending: true })

      if (error) throw error

      setAllData(data || [])

      // Grouping Logic: 
      // 1. By Category (procedure_name)
      // 2. Inside Category, by Patient (Name + Arrival Time)
      const categoryGroups: Record<string, GroupedFilaItem[]> = {}

      const rawItems = (data || []) as FilaItem[]
      
      const processedCategoryGroups: Record<string, Record<string, GroupedFilaItem>> = {}

      rawItems.forEach(item => {
        const cat = item.procedure_name || "Outros"
        const patientKey = `${item.patient_name}-${item.arrival_time}`

        if (!processedCategoryGroups[cat]) processedCategoryGroups[cat] = {}
        
        if (!processedCategoryGroups[cat][patientKey]) {
          processedCategoryGroups[cat][patientKey] = {
            patient_name: item.patient_name,
            arrival_time: item.arrival_time,
            birth_date: item.birth_date,
            priority: item.priority,
            ids: [item.id],
            procedures: [{ id: item.id, name: item.procedure_name, type: item.exam_type, status: item.status }],
            status: item.status
          }
        } else {
          processedCategoryGroups[cat][patientKey].ids.push(item.id)
          processedCategoryGroups[cat][patientKey].procedures.push({ 
            id: item.id, 
            name: item.procedure_name, 
            type: item.exam_type, 
            status: item.status 
          })
          // If any is 'realizando', the group might be considered 'realizando'
          if (item.status === 'realizando' || processedCategoryGroups[cat][patientKey].status === 'presente') {
             processedCategoryGroups[cat][patientKey].status = item.status
          }
        }
      })

      // Convert back to arrays
      Object.keys(processedCategoryGroups).forEach(cat => {
        categoryGroups[cat] = Object.values(processedCategoryGroups[cat])
      })

      setAppointments(categoryGroups)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(ids: string[], newStatus: string) {
    try {
      const { error } = await supabase.from("exam_appointments").update({ status: newStatus }).in("id", ids)
      if (error) throw error
      loadData()
    } catch (err) {
      console.error(err)
      alert("Erro ao atualizar status")
    }
  }

  async function handleCancel(ids: string[], name: string) {
    if (!confirm(`Remover os procedimentos de ${name} desta fila? Eles retornarão para o status 'agendado'.`)) return
    try {
      await supabase.from("exam_appointments").update({ status: 'agendado', arrival_time: null }).in("id", ids)
      loadData()
    } catch (err) {
      console.error(err)
      alert("Erro ao cancelar")
    }
  }

  const generateRelatorio = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const logosHtml = `
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:8px;">
        ${logos?.logo_hto ? `<img src="${logos.logo_hto}" style="height:56px; object-fit:contain;" />` : ""}
        ${logos?.logo_instituto ? `<img src="${logos.logo_instituto}" style="height:56px; object-fit:contain;" />` : ""}
        ${logos?.logo_maranhao ? `<img src="${logos.logo_maranhao}" style="height:56px; object-fit:contain;" />` : ""}
        ${logos?.logo_sus ? `<img src="${logos.logo_sus}" style="height:56px; object-fit:contain;" />` : ""}
      </div>
    `

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fila de Atendimento - ${format(parseISO(selectedDate), 'dd/MM/yyyy')}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: Arial, sans-serif; color: #111; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #14b8a6; padding-bottom: 8px; margin-bottom: 12px; }
          .title { font-size: 18pt; font-weight: bold; text-transform: uppercase; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10mm; }
          th { background: #f0fdf4; border: 1px solid #d1fae5; padding: 3mm; font-size: 9pt; text-align: left; }
          td { border: 1px solid #e2e8f0; padding: 3mm; font-size: 9pt; }
          .badge { padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-weight: bold; }
          .presente { background: #fef3c7; color: #92400e; }
          .realizando { background: #dbeafe; color: #1e40af; }
          .finalizado { background: #d1fae5; color: #065f46; }
          .footer { margin-top: 10mm; text-align: center; font-size: 8pt; opacity: 0.5; border-top: 1px solid #ccc; padding-top: 5mm; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logosHtml}
          <div>
            <div class="title">Fila de Atendimento</div>
            <div style="font-size:9pt; color:#64748b; margin-top:4px;">Data: ${format(parseISO(selectedDate), 'dd/MM/yyyy')} &nbsp;|&nbsp; Total: ${allData.length} exames</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="8%">Chegada</th>
              <th width="28%">Paciente</th>
              <th width="32%">Procedimentos / Especificações</th>
              <th width="8%">Idade</th>
              <th width="10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${allData.sort((a,b) => (a.arrival_time || '').localeCompare(b.arrival_time || '')).map(p => {
              const age = p.birth_date ? differenceInYears(new Date(), parseISO(p.birth_date)) : "--"
              return `
              <tr>
                <td style="text-align: center;">${p.arrival_time ? format(new Date(p.arrival_time), 'HH:mm') : '--:--'}</td>
                <td><strong>${p.patient_name}</strong></td>
                <td>${p.procedure_name} ${p.exam_type ? `(${p.exam_type})` : ''}</td>
                <td style="text-align: center;">${age} anos</td>
                <td><span class="badge ${p.status}">${p.status}</span></td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
        <div class="footer">HTO Caxias — Sistema de Gestão de Exames — Desenvolvido por Guilherme Santos · Avero Agency</div>
      </body>
      </html>
    `
    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sincronizando Fila...</p>
      </div>
    )
  }

  const statusBadge = (status: string) => {
    if (status === 'presente') return 'bg-orange-50 text-orange-600 border border-orange-100'
    if (status === 'realizando') return 'bg-blue-50 text-blue-600 border border-blue-100'
    if (status === 'falta') return 'bg-rose-50 text-rose-600 border border-rose-100'
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100'
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-xl border border-orange-100">
              <Play className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Fila de Realização</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Terminal de Chamada Operacional</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex flex-col">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Data de Referência</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 p-0 mt-0.5"
              />
            </div>
            <Button
              onClick={generateRelatorio}
              className="h-10 px-5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider gap-2 shadow-sm"
            >
              <Printer className="h-4 w-4" />
              Gerar Relatório
            </Button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {Object.keys(appointments).length === 0 ? (
        <div className="bg-white rounded-2xl py-24 text-center border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-4 opacity-40">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200"><Users className="h-10 w-10 text-slate-400" /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Nenhum paciente em espera</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(appointments).map(category => (
            <div key={category} className="space-y-3">
              {/* Category header */}
              <div className="flex items-center gap-3 px-1">
                <div className="relative shrink-0">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <div className="absolute inset-0 h-2 w-2 rounded-full bg-purple-500 animate-ping opacity-75" />
                </div>
                <h3 className="text-sm font-bold text-purple-700 tracking-widest uppercase">{category}</h3>
                <div className="h-px flex-1 bg-purple-100" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{appointments[category].length} Pacientes</span>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="py-4 px-5 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">Chegada</th>
                      <th className="py-4 px-5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Paciente</th>
                      <th className="py-4 px-5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Exame / Especificação</th>
                      <th className="py-4 px-5 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">Idade</th>
                      <th className="py-4 px-5 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="py-4 px-5 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appointments[category].map((group) => {
                      const age = group.birth_date ? differenceInYears(new Date(), parseISO(group.birth_date)) : "--"
                      return (
                        <tr key={`${group.patient_name}-${group.arrival_time}`} className={`hover:bg-slate-50 transition-colors group ${group.status === 'finalizado' ? 'opacity-50' : ''}`}>
                          <td className="py-4 px-5 text-center text-xs font-bold text-slate-500">
                            {group.arrival_time ? format(new Date(group.arrival_time), 'HH:mm') : '--:--'}
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                group.priority !== 'Sem Prioridade' ? 'bg-orange-100 text-orange-600 animate-pulse' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {group.patient_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-xs uppercase tracking-tight">{group.patient_name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">
                                  {group.priority !== 'Sem Prioridade' ? `⚡ ${group.priority}` : 'Normal'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                             <div className="space-y-1">
                               {group.procedures.map((p, idx) => (
                                 <div key={p.id} className={idx > 0 ? "pt-1 border-t border-slate-50" : ""}>
                                   <p className="font-bold text-slate-700 text-[10px] uppercase leading-tight">{p.name}</p>
                                   <p className="text-[8px] font-bold text-teal-500 uppercase">{p.type || 'Geral'}</p>
                                 </div>
                               ))}
                             </div>
                          </td>
                          <td className="py-4 px-5 text-center text-xs font-bold text-slate-500">{age} anos</td>
                          <td className="py-4 px-5 text-center">
                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide ${statusBadge(group.status)}`}>
                              {group.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {group.status === 'presente' && (
                                <>
                                  <button
                                    onClick={() => updateStatus(group.ids, 'realizando')}
                                    title="Chamar Paciente"
                                    className="h-8 px-3 bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all border border-blue-100 hover:border-blue-500 flex items-center gap-1.5"
                                  >
                                    <Play className="h-3 w-3" /> Chamada
                                  </button>
                                  <button
                                    onClick={() => updateStatus(group.ids, 'falta')}
                                    title="Marcar Falta"
                                    className="h-8 w-8 flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all border border-rose-100 hover:border-rose-500"
                                  >
                                    <UserMinus className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                              
                              {group.status === 'realizando' && (
                                <>
                                  <button
                                    onClick={() => updateStatus(group.ids, 'finalizado')}
                                    title="Finalizar Atendimento"
                                    className="h-8 px-3 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all border border-emerald-100 hover:border-emerald-500 flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="h-3 w-3" /> Finalizar
                                  </button>
                                  <button
                                    onClick={() => updateStatus(group.ids, 'presente')}
                                    title="Voltar para Espera"
                                    className="h-8 w-8 flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg transition-all border border-slate-200"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}

                              {group.status === 'finalizado' && (
                                <button
                                  onClick={() => updateStatus(group.ids, 'realizando')}
                                  title="Reabrir Atendimento"
                                  className="h-8 w-8 flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg transition-all border border-slate-200"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {group.status === 'falta' && (
                                <button
                                  onClick={() => updateStatus(group.ids, 'presente')}
                                  title="Marcar como Presente"
                                  className="h-8 w-8 flex items-center justify-center bg-emerald-50 text-emerald-500 hover:bg-emerald-100 rounded-lg transition-all border border-emerald-200"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {/* Delete/Rollback button (Enviado por engano) */}
                              <button
                                onClick={() => handleCancel(group.ids, group.patient_name)}
                                title="Remover da Fila (Enviado por engano)"
                                className="h-8 w-8 flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:text-amber-600 rounded-lg transition-all border border-transparent hover:border-amber-100"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      <Footer />
    </div>
  )
}
