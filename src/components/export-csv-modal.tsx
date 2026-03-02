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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, Download, Filter, CheckCircle2 } from "lucide-react"
import type { Patient } from "@/lib/data"

interface ExportCSVModalProps {
  patients: Patient[]
  selectedCity: string | null
  selectedDestination: string | null
  selectedMonth: string | null
  selectedYear: string | null
}

export function ExportCSVModal({
  patients,
  selectedCity,
  selectedDestination,
  selectedMonth,
  selectedYear,
}: ExportCSVModalProps) {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const hasFilters = selectedCity || selectedDestination || selectedMonth || selectedYear

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (selectedCity && p.cidadeOrigem !== selectedCity) return false
      if (selectedDestination && p.destino !== selectedDestination) return false
      if (selectedMonth) {
        const monthMap: Record<string, string[]> = {
          Janeiro: ["01"],
          Fevereiro: ["02"],
          Março: ["03"],
          Abril: ["04"],
          Maio: ["05"],
          Junho: ["06"],
          Julho: ["07"],
          Agosto: ["08"],
          Setembro: ["09"],
          Outubro: ["10"],
          Novembro: ["11"],
          Dezembro: ["12"],
        }
        const monthNums = monthMap[selectedMonth] || []
        const dataMonth = p.data.split(".")[1]
        if (!monthNums.includes(dataMonth)) return false
      }
      if (selectedYear) {
        const yearMatch = p.data.match(/\d{4}/) || p.data.match(/(\d{2})$/)
        const dataYear = yearMatch ? (yearMatch[0].length === 2 ? `20${yearMatch[0]}` : yearMatch[0]) : ""
        if (dataYear !== selectedYear) return false
      }
      return true
    })
  }, [patients, selectedCity, selectedDestination, selectedMonth, selectedYear])

  const exportToCSV = () => {
    setIsExporting(true)

    const headers = [
      "Ordem",
      "Data",
      "Paciente",
      "CPF",
      "Cidade Origem",
      "Horário",
      "Leito",
      "SUS",
      "Data Nascimento",
      "Idade",
      "Procedência",
      "Destino",
      "Prontuário",
      "Médico",
      "Procedimento",
        "Recepcionista",
        "Estado",
        "Telefone",
      ]


      const csvContent = [
        headers.join(";"),
        ...[...filteredPatients]
          .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0))
          .map((p) =>
          [
            p.ordem,
            p.data,
            p.paciente,
            p.cpf || "",
            p.cidadeOrigem,
            p.horario,
            p.leito,
            p.sus,
            p.dataNascimento,
            p.idade,
            p.procedencia,
            p.destino,
            p.prontuario,
            p.medico,
            p.procedimento,
            p.recepcionista,
            p.estado || "MA",
            p.telefone || "",
          ].join(";"),
        ),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)

    const filterParts = []
    if (selectedMonth) filterParts.push(selectedMonth.toLowerCase())
    if (selectedYear) filterParts.push(selectedYear)
    if (selectedCity) filterParts.push(selectedCity.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase())
    if (selectedDestination) filterParts.push(selectedDestination.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase())

    const fileName =
      filterParts.length > 0
        ? `internacoes_${filterParts.join("_")}_${new Date().toISOString().split("T")[0]}.csv`
        : `internacoes_completo_${new Date().toISOString().split("T")[0]}.csv`

    link.download = fileName
    link.click()

    setTimeout(() => {
      setIsExporting(false)
      setOpen(false)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 shadow-md hover:shadow-lg transition-all border-2 hover:border-emerald-500 hover:text-emerald-600 bg-transparent"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            Exportar para CSV
          </DialogTitle>
          <DialogDescription>Exportar dados com base nos filtros aplicados</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Filtros ativos */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filtros Aplicados
            </Label>

            {hasFilters ? (
              <div className="flex flex-wrap gap-2">
                {selectedCity && (
                  <Badge variant="secondary" className="px-3 py-1">
                    Cidade: {selectedCity}
                  </Badge>
                )}
                {selectedDestination && (
                  <Badge variant="secondary" className="px-3 py-1">
                    Destino: {selectedDestination}
                  </Badge>
                )}
                {selectedMonth && (
                  <Badge variant="secondary" className="px-3 py-1">
                    Mês: {selectedMonth}
                  </Badge>
                )}
                {selectedYear && (
                  <Badge variant="secondary" className="px-3 py-1">
                    Ano: {selectedYear}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                Nenhum filtro aplicado - todos os dados serão exportados
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registros a exportar</p>
                <p className="text-3xl font-bold text-emerald-600">{filteredPatients.length}</p>
              </div>
              <div className="p-3 rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
          </div>

          {/* Info - atualizado para incluir CPF */}
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
            <p>O arquivo CSV incluirá todas as colunas:</p>
            <p className="font-medium">
              Ordem, Data, Paciente, <span className="text-emerald-600 font-bold">CPF</span>, Cidade, Horário, Leito,
              SUS, Nascimento, Idade, Procedência, Destino, Prontuário, Médico, Procedimento, Recepcionista,{" "}
              Estado, <span className="text-emerald-600 font-bold">Telefone</span>
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={exportToCSV}
            disabled={filteredPatients.length === 0 || isExporting}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Baixar CSV
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
