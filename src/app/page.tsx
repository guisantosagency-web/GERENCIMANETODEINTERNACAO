"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, AuthProvider } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Eye, EyeOff, AlertCircle, Loader2, 
  ShieldCheck, Heart, Activity, Users, ArrowRight
} from "lucide-react"

function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-slate-50">
        <div className="flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const success = await login(username, password)
    if (success) {
      router.push("/dashboard")
    } else {
      setError("Usuário ou senha incorretos. Tente novamente.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-white">
      {/* LEFT PANEL — Hero Image */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-teal-700/60 to-emerald-600/70 z-10" />
        
        {/* Geometric decorations */}
        <div className="absolute top-20 left-16 w-72 h-72 bg-white/5 rounded-full blur-3xl z-10" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-300/10 rounded-full blur-3xl z-10" />

        {/* Content overlay */}
        <div className="relative z-20 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top Logo Area */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">HTO Caxias</p>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">Hospital Regional</p>
            </div>
          </div>

          {/* Middle — Main Headline */}
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Sistema Operacional Ativo</span>
              </div>
              <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] tracking-tight">
                Ambulatório<br />
                <span className="text-emerald-300">Digital</span>
              </h1>
              <p className="text-white/70 text-base font-medium leading-relaxed max-w-sm">
                Gestão completa de exames, agendamentos e atendimentos para profissionais de saúde.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Users, label: "Pacientes", value: "100+" },
                { icon: Activity, label: "Exames/Mês", value: "500+" },
                { icon: ShieldCheck, label: "Segurança", value: "100%" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center">
                  <Icon className="h-5 w-5 text-emerald-300 mx-auto mb-2" />
                  <p className="text-white font-black text-xl leading-none">{value}</p>
                  <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="border-t border-white/15 pt-8">
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
              Tecnologia a serviço da saúde — Desenvolvido por Guilherme Santos · Avero Agency
            </p>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 border border-white/10 rounded-full z-10" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 border border-white/5 rounded-full z-10" />
      </div>

      {/* RIGHT PANEL — Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 xl:p-16 bg-white">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
          
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100">
              <Heart className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-sm leading-none">HTO Caxias</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Ambulatório Digital</p>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Bem-vindo de<br />volta <span className="text-teal-500">👋</span>
            </h2>
            <p className="text-slate-500 text-sm mt-3 font-medium">
              Entre com suas credenciais para acessar o painel operacional.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl mb-6 animate-in slide-in-from-top-4 duration-300">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <p className="text-xs font-bold tracking-wide">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                <span className="h-1 w-3 bg-teal-400 rounded-full" />
                Usuário / E-mail
              </Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seu.usuario@hto.com.br"
                className="h-13 px-5 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                <span className="h-1 w-3 bg-emerald-400 rounded-full" />
                Senha de Acesso
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-13 px-5 pr-14 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-teal-200 transition-all duration-300 group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="animate-pulse">Verificando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    Entrar no Sistema
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Security badge */}
          <div className="mt-10 flex items-center justify-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <ShieldCheck className="h-4 w-4 text-teal-500 shrink-0" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Conexão Segura SSL/TLS · Dados Protegidos
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-8">
            HTO Caxias © 2026 · v4.0
          </p>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  )
}
