"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { FileText, Download, Calendar, TrendingUp, Users, Building2, Baby, Activity } from "lucide-react"
import type { Patient } from "@/lib/data"
import { useAuth } from "@/lib/auth-context"

interface ExportPDFModalProps {
  patients: Patient[]
}

  export function ExportPDFModal({ patients }: ExportPDFModalProps) {
    const [open, setOpen] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
      return (new Date().getMonth() + 1).toString().padStart(2, "0")
    })
    const [selectedYear, setSelectedYear] = useState<string>(() => {
      return new Date().getFullYear().toString()
    })
    const [isGenerating, setIsGenerating] = useState(false)

  const { logos } = useAuth()

  const months = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ]

  const years = ["2024", "2025", "2026"]

  const filteredPatients = useMemo(() => {
    if (!selectedMonth || !selectedYear) return []

    console.log("[v0] Filtrando pacientes - Mês:", selectedMonth, "Ano:", selectedYear)
    console.log("[v0] Total de pacientes:", patients.length)

    const filtered = patients.filter((p) => {
      if (!p.data) return false

      // Suporta formatos: dd.mm.yy, dd.mm.yyyy, dd/mm/yy, dd/mm/yyyy
      const separator = p.data.includes(".") ? "." : "/"
      const dateParts = p.data.split(separator)

      if (dateParts.length >= 3) {
        const dataMonth = dateParts[1]?.padStart(2, "0")
        let dataYear = dateParts[2]?.trim()

        // Converte ano de 2 dígitos para 4 dígitos
        if (dataYear && dataYear.length === 2) {
          dataYear = `20${dataYear}`
        }

        const match = dataMonth === selectedMonth && dataYear === selectedYear
        if (match) {
          console.log("[v0] Paciente encontrado:", p.paciente, "Data:", p.data)
        }
        return match
      }
      return false
    })

    console.log("[v0] Pacientes filtrados:", filtered.length)
    return filtered
  }, [patients, selectedMonth, selectedYear])

  const stats = useMemo(() => {
    const childrenCount = filteredPatients.filter((p) => {
      const ageStr = p.idade?.toString().replace(/\D/g, "") || "0"
      const age = Number.parseInt(ageStr) || 0
      return age >= 0 && age <= 13
    }).length

    const utiCount = filteredPatients.filter(
      (p) => p.leito?.toUpperCase().includes("UTI") || p.destino?.toUpperCase().includes("UTI"),
    ).length

    const citiesCount = new Set(filteredPatients.map((p) => p.cidadeOrigem).filter(Boolean)).size

    const receptionistStats: Record<string, number> = {}
    filteredPatients.forEach((p) => {
      const name = (p.recepcionista || "Não informado").trim().toUpperCase()
      receptionistStats[name] = (receptionistStats[name] || 0) + 1
    })

    const topReceptionists = Object.entries(receptionistStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const cityStats: Record<string, number> = {}
    filteredPatients.forEach((p) => {
      const city = (p.cidadeOrigem || "Não informado").trim().toUpperCase()
      cityStats[city] = (cityStats[city] || 0) + 1
    })

    const topCities = Object.entries(cityStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return { childrenCount, utiCount, citiesCount, topReceptionists, topCities }
  }, [filteredPatients])

  const generatePDF = async () => {
    if (filteredPatients.length === 0) {
      alert("Nenhum paciente encontrado para o período selecionado.")
      return
    }

    setIsGenerating(true)

    const monthLabel = months.find((m) => m.value === selectedMonth)?.label || "Todos"

    const hasAnyLogo = logos.logo_hto || logos.logo_maranhao || logos.logo_instituto || logos.logo_sus

    const logosHtml = hasAnyLogo
      ? `
      <div class="logos-header">
        ${logos.logo_hto ? `<img src="${logos.logo_hto}" alt="HTO" class="logo" />` : ""}
        ${logos.logo_instituto ? `<img src="${logos.logo_instituto}" alt="Instituto" class="logo" />` : ""}
        ${logos.logo_maranhao ? `<img src="${logos.logo_maranhao}" alt="Governo do Maranhão" class="logo" />` : ""}
        ${logos.logo_sus ? `<img src="${logos.logo_sus}" alt="SUS" class="logo" />` : ""}
      </div>
    `
      : ""

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Internações - ${monthLabel}/${selectedYear}</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              font-size: 10px;
              line-height: 1.4;
              color: #333;
              background: white;
            }
            .page {
              width: 100%;
              padding: 5mm;
              background: white;
            }
            
              /* Header com logos maiores e adaptáveis */
              .logos-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 30px;
                margin-bottom: 15px;
                border-bottom: 4px solid #0066cc;
              }
              .logo {
                max-height: 150px;
                max-width: 300px;
                width: auto;
                height: auto;
                object-fit: contain;
              }
  
            
            .header { 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: ${hasAnyLogo ? "none" : "2px solid #0066cc"};
            }
            .header-left h1 { 
              color: #0066cc; 
              font-size: 22px; 
              font-weight: 700;
              margin-bottom: 4px;
            }
            .header-left .subtitle { 
              color: #666; 
              font-size: 11px;
            }
            .header-right {
              text-align: right;
            }
            .header-right .period {
              font-size: 14px;
              font-weight: 600;
              color: #0066cc;
            }
            .header-right .date {
              font-size: 10px;
              color: #999;
            }
            
            .indicators-row {
              display: flex;
              gap: 10px;
              margin-bottom: 15px;
            }
            .indicator {
              flex: 1;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 10px 12px;
              text-align: center;
            }
            .indicator-value {
              font-size: 22px;
              font-weight: 700;
              color: #0066cc;
            }
            .indicator-label {
              font-size: 9px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .section-title {
              font-size: 12px;
              font-weight: 600;
              color: #0066cc;
              margin-bottom: 6px;
              padding-bottom: 4px;
              border-bottom: 1.5px solid #e2e8f0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 9px;
            }
            th {
              background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
              color: white;
              padding: 6px 4px;
              text-align: left;
              font-weight: 600;
              font-size: 9px;
              text-transform: uppercase;
            }
            td {
              padding: 5px 4px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: middle;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            tr:hover {
              background-color: #e0f2fe;
            }
            
            .stats-grid {
              display: flex;
              gap: 12px;
              margin-top: 12px;
            }
            .stat-box {
              flex: 1;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 10px;
            }
            .stat-box h4 {
              font-size: 11px;
              font-weight: 600;
              color: #0066cc;
              margin-bottom: 6px;
            }
            .stat-item {
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              padding: 4px 0;
              border-bottom: 1px dotted #e2e8f0;
            }
            .stat-item:last-child {
              border-bottom: none;
            }
            
            .footer {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
            }
            .footer-text {
              font-size: 9px;
              color: #999;
            }
          .footer-link {
            color: #0066cc;
            text-decoration: none;
          }
          
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          ${logosHtml}
          
          <div class="header">
            <div class="header-left">
              <h1>Hospital de Traumatologia e Ortopedia</h1>
              <div class="subtitle">Relatório de Internações - Caxias/MA</div>
            </div>
            <div class="header-right">
              <div class="period">${monthLabel}/${selectedYear}</div>
              <div class="date">Gerado em: ${new Date().toLocaleDateString("pt-BR")}</div>
            </div>
          </div>
          
          <div class="indicators-row">
            <div class="indicator">
              <div class="indicator-value">${filteredPatients.length}</div>
              <div class="indicator-label">Total Internações</div>
            </div>
            <div class="indicator">
              <div class="indicator-value">${stats.utiCount}</div>
              <div class="indicator-label">Pacientes UTI</div>
            </div>
            <div class="indicator">
              <div class="indicator-value">${stats.childrenCount}</div>
              <div class="indicator-label">Crianças (0-13)</div>
            </div>
            <div class="indicator">
              <div class="indicator-value">${stats.citiesCount}</div>
              <div class="indicator-label">Cidades Atendidas</div>
            </div>
          </div>
          
          <div class="section-title">Lista de Internações</div>
          <table>
            <thead>
              <tr>
                <th style="width: 4%">#</th>
                <th style="width: 6%">Data</th>
                <th style="width: 18%">Paciente</th>
                <th style="width: 10%">CPF</th>
                <th style="width: 10%">Cidade</th>
                <th style="width: 5%">Hora</th>
                <th style="width: 8%">Leito</th>
                <th style="width: 10%">Destino</th>
                <th style="width: 10%">Médico</th>
                <th style="width: 10%">Procedimento</th>
                <th style="width: 9%">Recepcionista</th>
              </tr>
            </thead>
              <tbody>
                ${[...filteredPatients]
                  .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0))
                  .map(
                  (p, i) => `
                <tr>
                  <td>${p.ordem || i + 1}</td>
                  <td>${p.data}</td>
                  <td>${p.paciente}</td>
                  <td>${p.cpf || "-"}</td>
                  <td>${p.cidadeOrigem || "-"}</td>
                  <td>${p.horario}</td>
                  <td>${p.leito}</td>
                  <td>${p.destino}</td>
                  <td>${p.medico}</td>
                  <td>${p.procedimento}</td>
                  <td>${p.recepcionista}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="stats-grid">
            <div class="stat-box">
              <h4>Top 5 Recepcionistas</h4>
              ${stats.topReceptionists
                .map(
                  ([name, count]) => `
                <div class="stat-item">
                  <span>${name}</span>
                  <strong>${count}</strong>
                </div>
              `,
                )
                .join("")}
            </div>
            <div class="stat-box">
              <h4>Top 5 Cidades de Origem</h4>
              ${stats.topCities
                .map(
                  ([city, count]) => `
                <div class="stat-item">
                  <span>${city}</span>
                  <strong>${count}</strong>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          
            <div class="footer">
              <p class="footer-text">© ${new Date().getFullYear()} Hospital de Traumatologia e Ortopedia - Todos os direitos reservados</p>
            </div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
        setIsGenerating(false)
      }, 500)
    } else {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 bg-transparent">
          <FileText className="h-4 w-4" />
          Exportar PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Exportar Relatório em PDF
          </DialogTitle>
          <DialogDescription>Selecione o período para gerar o relatório de internações.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Mês
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Ano
              </Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedMonth && selectedYear && (
            <div className="rounded-xl bg-accent/30 border border-border/50 p-4 space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Prévia do Relatório - {months.find((m) => m.value === selectedMonth)?.label}/{selectedYear}
              </h4>

              {filteredPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum paciente encontrado para o período selecionado.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 rounded-lg bg-background/80 border border-border/30">
                      <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                      <div className="text-lg font-bold text-foreground">{filteredPatients.length}</div>
                      <div className="text-[10px] text-muted-foreground">Internações</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/80 border border-border/30">
                      <Activity className="h-4 w-4 mx-auto mb-1 text-red-500" />
                      <div className="text-lg font-bold text-foreground">{stats.utiCount}</div>
                      <div className="text-[10px] text-muted-foreground">UTI</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/80 border border-border/30">
                      <Baby className="h-4 w-4 mx-auto mb-1 text-green-500" />
                      <div className="text-lg font-bold text-foreground">{stats.childrenCount}</div>
                      <div className="text-[10px] text-muted-foreground">Crianças</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background/80 border border-border/30">
                      <Building2 className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                      <div className="text-lg font-bold text-foreground">{stats.citiesCount}</div>
                      <div className="text-[10px] text-muted-foreground">Cidades</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <h5 className="font-medium mb-2 text-muted-foreground">Top Recepcionistas</h5>
                      <div className="space-y-1">
                        {stats.topReceptionists.slice(0, 3).map(([name, count]) => (
                          <div key={name} className="flex justify-between bg-background/50 px-2 py-1 rounded">
                            <span className="truncate">{name}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2 text-muted-foreground">Top Cidades</h5>
                      <div className="space-y-1">
                        {stats.topCities.slice(0, 3).map(([city, count]) => (
                          <div key={city} className="flex justify-between bg-background/50 px-2 py-1 rounded">
                            <span className="truncate">{city}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={generatePDF}
            disabled={!selectedMonth || !selectedYear || filteredPatients.length === 0 || isGenerating}
            className="gap-2 bg-gradient-to-r from-primary to-secondary"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? "Gerando..." : "Gerar PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
