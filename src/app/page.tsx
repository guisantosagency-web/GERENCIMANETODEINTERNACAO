"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, AuthProvider } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Footer } from "@/components/footer"
import { Hospital, Eye, EyeOff, AlertCircle, Loader2, TrendingUp, Target, ShieldCheck } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-[#0F1419]">
        <div className="flex flex-col items-center gap-8">
           <div className="relative">
              <div className="absolute inset-0 bg-[#FF6B35] blur-3xl opacity-20 animate-pulse" />
              <div className="w-20 h-20 rounded-[2.5rem] bg-[#161B22] border border-[#FF6B35]/30 flex items-center justify-center shadow-2xl relative">
                <Loader2 className="h-10 w-10 text-[#FF6B35] animate-spin" />
              </div>
           </div>
           <div className="space-y-2 text-center">
              <p className="text-[#FF6B35] font-black uppercase tracking-[0.5em] text-[10px]">Synchronizing Terminal</p>
              <p className="text-[#7E8C9A] font-black uppercase tracking-[0.2em] text-[8px] opacity-50">Establishing Secure Handshake...</p>
           </div>
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
      setError("AUTHORIZATION_FAILED: Invalid credentials detected.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0F1419] overflow-hidden relative">
      {/* Immersive Background Effects - CSGO Style */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="ambient-orb floating-slow w-[900px] h-[900px] bg-[#FF6B35]/5 -top-48 -right-48" />
        <div className="ambient-orb floating w-[700px] h-[700px] bg-[#FF1493]/5 top-1/4 -left-32" />
        <div className="ambient-orb glow-pulse-slow w-[500px] h-[500px] bg-[#00D9FF]/5 bottom-0 right-1/4" />
        
        {/* Tactical Scan Line Overlay */}
        <div className="absolute inset-0 bg-scanline pointer-events-none opacity-[0.02]" />
        
        {/* Holographic Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }} />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-1000">
          
          {/* Main Login UI Terminal */}
          <div className="relative group">
            {/* Dynamic Holographic Aura */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#00D9FF] rounded-[4rem] blur-3xl opacity-[0.05] group-hover:opacity-15 transition-all duration-1000 animate-pulse" />
            
            <div className="card-csgo border-white/[0.03] bg-[#161B22]/95 backdrop-blur-3xl rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative p-12 lg:p-16">
              {/* Tactical Status Line */}
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent shadow-[0_0_20px_#FF6B35]" />
              
              <div className="text-center space-y-12 mb-16">
                <div className="relative mx-auto w-32 h-32 group">
                  <div className="absolute -inset-8 bg-gradient-to-br from-[#FF6B35] to-[#FF8C00] rounded-[3.5rem] blur-3xl opacity-10 group-hover:opacity-30 animate-pulse transition-opacity duration-1000" />
                  <div className="relative h-full w-full rounded-[3rem] bg-[#161B22] border border-white/10 flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:rotate-[360deg] group-hover:border-[#FF6B35]/40 overflow-hidden">
                    <Hospital className="h-16 w-16 text-white group-hover:text-[#FF6B35] transition-colors" />
                    {/* Visual Scan Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[40%] w-full animate-scan pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-6xl font-black font-space tracking-tighter text-white uppercase leading-none">
                    Ambulatório<br/><span className="text-[#FF6B35] drop-shadow-[0_0_20px_rgba(255,107,53,0.4)]">Digital</span>
                  </h1>
                  <div className="flex items-center justify-center gap-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <p className="text-[#7E8C9A] font-black text-[10px] uppercase tracking-[0.7em] whitespace-nowrap opacity-60">Control Point</p>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                {error && (
                  <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 text-rose-200 animate-in slide-in-from-top-6">
                    <AlertCircle className="h-5 w-5 text-rose-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                  </div>
                )}

                <div className="space-y-8">
                  <div className="space-y-2 group/input">
                    <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7E8C9A] ml-8 group-focus-within/input:text-[#FF6B35] transition-colors flex items-center gap-3">
                       <Target className="h-3 w-3" /> Authorization ID
                    </Label>
                    <div className="relative">
                       <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="IDENTIFIER_CODE"
                        className="h-20 px-10 rounded-[2rem] bg-black/40 border-white/5 text-white font-black tracking-[0.3em] uppercase placeholder:text-white/5 focus:border-[#FF6B35]/40 focus:ring-8 focus:ring-[#FF6B35]/5 transition-all duration-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 group/input">
                    <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7E8C9A] ml-8 group-focus-within/input:text-[#FF6B35] transition-colors flex items-center gap-3">
                       <ShieldCheck className="h-3 w-3" /> Tactical Key
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-20 px-10 rounded-[2rem] bg-black/40 border-white/5 text-white font-black tracking-[0.3em] focus:border-[#FF6B35]/40 focus:ring-8 focus:ring-[#FF6B35]/5 transition-all duration-500 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-8 top-1/2 -translate-y-1/2 text-[#7E8C9A] hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl"
                      >
                        {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full h-20 rounded-[2.5rem] bg-white text-[#0F1419] hover:bg-[#FF6B35] hover:text-white transition-all duration-700 font-black uppercase text-sm tracking-[0.5em] shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative group/btn overflow-hidden" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-5">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="animate-pulse">Authorizing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-4">
                        Initialize Terminal
                        <TrendingUp className="h-5 w-5 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-500" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-16 pt-10 border-t border-white/5 flex flex-col items-center gap-4">
                <div className="flex gap-3">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-1 w-6 bg-white/5 rounded-full" />)}
                </div>
                <p className="text-[9px] font-black text-[#7E8C9A] uppercase tracking-[0.6em] opacity-40 whitespace-nowrap">Secure Operational Layer v4.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pb-12 text-center relative z-10">
        <Footer />
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
