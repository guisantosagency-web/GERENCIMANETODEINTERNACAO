"use client"

import { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { 
  Play, Users, Loader2, 
  Clock, Printer, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO, differenceInYears } from "date-fns"
import { useAuth } from "@/lib/auth-context"

export default function FilaTab() {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<any>({})
  const [allPatients, setAllPatients] = useState<any[]>([])
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
        .in("status", ["presente", "realizando", "finalizado"])
        .order("arrival_time", { ascending: true })

      if (error) throw error

      setAllPatients(data || [])

      const groups = (data || []).reduce((acc: any, curr: any) => {
        const cat = curr.procedure_name || "Outros"
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(curr)
        return acc
      }, {})

      setAppointments(groups)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase.from("exam_appointments").update({ status: newStatus }).eq("id", id)
      if (error) throw error
      loadData()
    } catch (err) {
      console.error(err)
      alert("Erro ao atualizar status")
    }
  }

  async function handleCancel(id: string, name: string) {
    if (!confirm(`Cancelar o atendimento de ${name}? Esta ação retornará o paciente para o status 'agendado'.`)) return
    try {
      await supabase.from("exam_appointments").update({ status: 'agendado', arrival_time: null }).eq("id", id)
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
          .meta { font-size: 9pt; margin-bottom: 10mm; display: flex; justify-content: space-between; }
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
            <div style="font-size:9pt; color:#64748b; margin-top:4px;">Data: ${format(parseISO(selectedDate), 'dd/MM/yyyy')} &nbsp;|&nbsp; Total: ${allPatients.length} pacientes</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="8%">Chegada</th>
              <th width="28%">Paciente</th>
              <th width="14%">Chave SISREG</th>
              <th width="32%">Exame / Especificação</th>
              <th width="8%">Idade</th>
              <th width="10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${allPatients.sort((a,b) => (a.arrival_time || '').localeCompare(b.arrival_time || '')).map(p => {
              const age = p.birth_date ? differenceInYears(new Date(), parseISO(p.birth_date)) : "--"
              return `
              <tr>
                <td style="text-align: center;">${p.arrival_time ? format(new Date(p.arrival_time), 'HH:mm') : '--:--'}</td>
                <td><strong>${p.patient_name}</strong></td>
                <td style="text-align: center; color: #666;">${(p.chave_sisreg && !p.chave_sisreg.includes('IMPORT_SISREG')) ? p.chave_sisreg : '--'}</td>
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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{appointments[category].length} Pac.</span>
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
                    {appointments[category].map((a: any) => {
                      const age = a.birth_date ? differenceInYears(new Date(), parseISO(a.birth_date)) : "--"
                      return (
                        <tr key={a.id} className={`hover:bg-slate-50 transition-colors group ${a.status === 'finalizado' ? 'opacity-50' : ''}`}>
                          <td className="py-4 px-5 text-center text-xs font-bold text-slate-500">
                            {a.arrival_time ? format(new Date(a.arrival_time), 'HH:mm') : '--:--'}
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                a.priority !== 'Sem Prioridade' ? 'bg-orange-100 text-orange-600 animate-pulse' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {a.patient_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-xs uppercase tracking-tight">{a.patient_name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">
                                  {a.priority !== 'Sem Prioridade' ? `⚡ ${a.priority}` : 'Normal'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <p className="font-bold text-slate-700 text-xs uppercase">{a.procedure_name}</p>
                            <p className="text-[9px] font-bold text-teal-500 uppercase">{a.exam_type}</p>
                          </td>
                          <td className="py-4 px-5 text-center text-xs font-bold text-slate-500">{age} anos</td>
                          <td className="py-4 px-5 text-center">
                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide ${statusBadge(a.status)}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {a.status === 'presente' && (
                                <button
                                  onClick={() => updateStatus(a.id, 'realizando')}
                                  className="h-8 px-3 bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all border border-blue-100 hover:border-blue-500"
                                >
                                  Chamada
                                </button>
                              )}
                              {a.status === 'realizando' && (
                                <button
                                  onClick={() => updateStatus(a.id, 'finalizado')}
                                  className="h-8 px-3 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all border border-emerald-100 hover:border-emerald-500"
                                >
                                  Finalizar
                                </button>
                              )}
                              {/* Cancel/Delete button */}
                              {a.status !== 'finalizado' && (
                                <button
                                  onClick={() => handleCancel(a.id, a.patient_name)}
                                  title="Cancelar atendimento"
                                  className="h-8 w-8 flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all border border-transparent hover:border-rose-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
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
    </div>
  )
}
