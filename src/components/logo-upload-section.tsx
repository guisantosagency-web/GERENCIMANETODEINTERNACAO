"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageIcon, Upload, Trash2, Check, Loader2 } from "lucide-react"

interface LogoUploadItemProps {
  title: string
  logoKey: "logo_hto" | "logo_maranhao" | "logo_instituto" | "logo_sus"
  currentValue: string | null
  onUpload: (key: "logo_hto" | "logo_maranhao" | "logo_instituto" | "logo_sus", base64: string | null) => Promise<void>
}

function LogoUploadItem({ title, logoKey, currentValue, onUpload }: LogoUploadItemProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.")
      return
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 2MB.")
      return
    }

    setIsUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result as string
        await onUpload(logoKey, base64)
        setIsUploading(false)
      }
      reader.onerror = () => {
        alert("Erro ao ler o arquivo.")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      alert("Erro ao fazer upload da imagem.")
      setIsUploading(false)
    }

    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemove = async () => {
    setIsRemoving(true)
    await onUpload(logoKey, null)
    setIsRemoving(false)
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-accent/20 hover:bg-accent/30 transition-colors">
      {/* Preview da logo */}
      <div className="w-20 h-20 rounded-xl bg-white border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
        {currentValue ? (
          <img src={currentValue || "/placeholder.svg"} alt={title} className="w-full h-full object-contain p-2" />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
        )}
      </div>

      {/* Info e ações */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">
          {currentValue ? (
            <span className="flex items-center gap-1 text-emerald-600">
              <Check className="w-3 h-3" /> Logo configurada
            </span>
          ) : (
            "Nenhuma logo configurada"
          )}
        </p>
      </div>

      {/* Botões */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id={`logo-upload-${logoKey}`}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {currentValue ? "Alterar" : "Enviar"}
            </>
          )}
        </Button>
        {currentValue && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={isRemoving}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </div>
  )
}

export function LogoUploadSection() {
  const { logos, updateLogo } = useAuth()

  const logoItems: { title: string; key: "logo_hto" | "logo_maranhao" | "logo_instituto" | "logo_sus" }[] = [
    { title: "Logo HTO", key: "logo_hto" },
    { title: "Logo Governo do Maranhão", key: "logo_maranhao" },
    { title: "Logo Instituto (Invisa)", key: "logo_instituto" },
    { title: "Logo SUS", key: "logo_sus" },
  ]

  return (
    <Card className="shadow-card border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 rounded-xl bg-violet-500/10">
            <ImageIcon className="h-5 w-5 text-violet-500" />
          </div>
          Logos para PDFs
        </CardTitle>
        <CardDescription className="ml-12">
          Configure as logos que aparecerão na Ficha de Internação e no Relatório PDF
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {logoItems.map((item) => (
            <LogoUploadItem
              key={item.key}
              title={item.title}
              logoKey={item.key}
              currentValue={logos[item.key]}
              onUpload={updateLogo}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 ml-1">
          Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2MB por imagem.
        </p>
      </CardContent>
    </Card>
  )
}
