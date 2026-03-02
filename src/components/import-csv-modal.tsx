"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import type { Patient } from "@/lib/data"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react"
import { calculateAge } from "@/lib/utils"

export function ImportCSVModal() {
  const [open, setOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count: number } | null>(null)
  const [previewData, setPreviewData] = useState<Patient[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importPatientsFromCSV } = useAuth()

  // Ordem das colunas na exportação:
  // 0: Ordem, 1: Data, 2: Paciente, 3: CPF, 4: Cidade Origem, 5: Horário,
  // 6: Leito, 7: SUS, 8: Data Nascimento, 9: Idade, 10: Procedência,
    // 11: Destino, 12: Prontuário, 13: Médico, 14: Procedimento, 15: Recepcionista, 16: Estado, 17: Telefone
    const parseCSV = (content: string): Patient[] => {
      const lines = content.split("\n").filter((line) => line.trim())
      if (lines.length < 2) return []
  
      const patients: Patient[] = []
  
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(";").map((v) => v.trim().replace(/"/g, ""))
        if (values.length >= 18) {
          const procedencia = values[10] || ""
          const dataNascimento = values[8] || ""
          const idade = dataNascimento ? calculateAge(dataNascimento) : values[9] || ""
  
          patients.push({
            id: i,
            ordem: Number.parseInt(values[0]) || i,
            data: values[1] || "",
            paciente: values[2] || "",
            cpf: values[3] || "",
            cidadeOrigem: values[4] || "",
            horario: values[5] || "",
            leito: values[6] || "",
            sus: values[7] || "",
            dataNascimento: dataNascimento,
            idade: idade,
            procedencia: procedencia,
            isResidencia: procedencia.toUpperCase() === "RESIDÊNCIA" || procedencia.toUpperCase() === "RESIDENCIA",
            destino: values[11] || "",
            prontuario: values[12] || "",
            medico: values[13] || "",
            procedimento: values[14] || "",
            recepcionista: values[15] || "",
            estado: values[16] || "MA",
            telefone: values[17] || "",
          })
        }
      }


    return patients
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const parsedPatients = parseCSV(content)
      setPreviewData(parsedPatients)
      setImportResult(null)
    }
    reader.readAsText(file, "UTF-8")
  }

  const handleImport = async () => {
    if (!previewData || previewData.length === 0) return

    setIsImporting(true)

    try {
      await importPatientsFromCSV(previewData)
      setImportResult({
        success: true,
        message: "Dados importados e sincronizados com sucesso!",
        count: previewData.length,
      })
      setPreviewData(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.log("[v0] Error importing CSV:", error)
      setImportResult({
        success: false,
        message: "Erro ao importar dados. Tente novamente.",
        count: 0,
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setPreviewData(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            Importar Dados CSV
          </DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV exportado anteriormente para atualizar o banco de dados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-violet-500/10">
                  <Upload className="h-8 w-8 text-violet-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Clique para selecionar o arquivo</p>
                  <p className="text-sm text-muted-foreground">ou arraste e solte aqui</p>
                </div>
                <p className="text-xs text-muted-foreground">Apenas arquivos .csv são aceitos</p>
              </div>
            </label>
          </div>

          {/* Preview */}
          {previewData && previewData.length > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Registros encontrados</p>
                  <p className="text-3xl font-bold text-violet-600">{previewData.length}</p>
                </div>
                <div className="p-3 rounded-full bg-violet-500/10">
                  <CheckCircle2 className="h-8 w-8 text-violet-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">A importação irá substituir todos os dados atuais</p>
            </div>
          )}

          {/* Result */}
          {importResult && (
            <div
              className={`p-4 rounded-xl border ${
                importResult.success
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                  : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
              }`}
            >
              <div className="flex items-center gap-3">
                {importResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className={`font-medium ${importResult.success ? "text-emerald-700" : "text-red-700"}`}>
                    {importResult.message}
                  </p>
                  {importResult.success && (
                    <p className="text-sm text-muted-foreground">{importResult.count} registros importados</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            {importResult?.success ? "Fechar" : "Cancelar"}
          </Button>
          {previewData && previewData.length > 0 && !importResult && (
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              {isImporting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Confirmar Importação
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
