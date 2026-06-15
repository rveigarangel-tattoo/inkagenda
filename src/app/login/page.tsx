"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Zap } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await signIn("credentials", { email, password, redirect: false })
    if (result?.error) {
      setError("Email ou senha incorretos")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#d4a853]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#d4a853]/3 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#d4a853]/10 border border-[#d4a853]/30 mb-5">
            <Zap className="w-7 h-7 text-[#d4a853]" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">InkAgenda</h1>
          <p className="text-[#888] mt-2 text-sm">Studio Management System</p>
        </div>
        <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-5">Entrar na sua conta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#444] focus:outline-none focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853]/50 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5">Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#444] focus:outline-none focus:border-[#d4a853] focus:ring-1 focus:ring-[#d4a853]/50 transition-all text-sm" />
            </div>
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-[#d4a853] hover:bg-[#c49840] active:bg-[#b8892e] text-black font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
        <div className="mt-4 p-4 bg-[#0d0d0d] rounded-2xl border border-[#1a1a1a]">
          <p className="text-xs text-[#666] font-medium mb-2.5 uppercase tracking-wider">Contas de demonstração</p>
          <div className="space-y-2">
            <button onClick={() => { setEmail("admin@inkagenda.com"); setPassword("admin123") }} className="w-full text-left flex items-center gap-3 p-2.5 hover:bg-[#1a1a1a] rounded-xl transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#d4a853] flex items-center justify-center text-black font-bold text-xs">R</div>
              <div><p className="text-xs font-medium text-white">Rafael Veiga · Admin</p><p className="text-[10px] text-[#666]">admin@inkagenda.com</p></div>
            </button>
            <button onClick={() => { setEmail("ana@inkagenda.com"); setPassword("artist123") }} className="w-full text-left flex items-center gap-3 p-2.5 hover:bg-[#1a1a1a] rounded-xl transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#e879f9] flex items-center justify-center text-black font-bold text-xs">A</div>
              <div><p className="text-xs font-medium text-white">Ana Lima · Artista</p><p className="text-[10px] text-[#666]">ana@inkagenda.com</p></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
