"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, AuthProvider } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"
import { Hospital, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary animate-pulse" />
          <p className="text-muted-foreground font-medium">Carregando...</p>
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
      setError("Usuário ou senha inválidos")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top_right,var(--primary)_0%,transparent_25%),radial-gradient(circle_at_bottom_left,var(--secondary)_0%,transparent_25%),var(--background)] overflow-y-auto overflow-x-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
          <Card className="border-border/30 bg-card/70 backdrop-blur-xl rounded-[2.5rem] shadow-card-hover overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-gradient-x" />
            <CardHeader className="text-center space-y-6 pb-2 pt-10">
              <div className="mx-auto w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-indicator transform hover:rotate-6 transition-transform duration-500">
                <Hospital className="h-12 w-12 text-primary-foreground" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-4xl font-bold font-space tracking-tight gradient-text">Ambulatorio Digital</CardTitle>
                <CardDescription className="text-lg font-medium text-muted-foreground/80">Gestão Hospitalar Inteligente</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 px-8 pb-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/10 animate-in zoom-in-95 duration-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2.5">
                  <Label htmlFor="username" className="text-sm font-semibold ml-1">
                    Usuário
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-14 px-5 rounded-2xl bg-background/50 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-lg"
                    required
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="password" className="text-sm font-semibold ml-1">
                    Senha
                  </Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 px-5 pr-14 rounded-2xl bg-background/50 border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-lg"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-10 w-10 rounded-xl hover:bg-accent/50 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold text-lg shadow-indicator transition-all duration-500 ease-out"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </div>
                  ) : (
                    "Entrar no Sistema"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="text-center mt-8 text-muted-foreground/60 text-sm font-medium">
            © {new Date().getFullYear()} Ambulatorio Digital. Todos os direitos reservados.
          </p>
        </div>
      </div>
      <Footer />
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
