"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      toast.error("Email ou senha inválidos")
      return
    }
    router.push("/")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-6">
      <div className="flex w-full max-w-[392px] flex-col items-center">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="inkagenda"
            width={72}
            height={72}
            style={{ borderRadius: 18, boxShadow: "0 8px 24px rgba(124,58,237,.35)" }}
          />
          <h1 className="mt-[18px] mb-1.5 text-[30px] font-bold tracking-tight text-white">
            inkagenda
          </h1>
          <p className="text-sm text-[#8a8a8a]">Gestão de estúdio de tatuagem</p>
        </div>

        {/* Card */}
        <div className="w-full rounded-[14px] border border-[#262626] bg-[#161616] p-7">
          <form onSubmit={onSubmit} className="space-y-[18px]">
            <div>
              <Label className="mb-2 block text-[13px] font-semibold text-white">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@inkagenda.com"
                className="rounded-[9px] border-[#2a2a2a] bg-[#0e0e0e] text-sm text-white placeholder:text-[#6b6b6b] focus-visible:ring-[#7c3aed]"
              />
            </div>
            <div>
              <Label className="mb-2 block text-[13px] font-semibold text-white">Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="rounded-[9px] border-[#2a2a2a] bg-[#0e0e0e] text-sm text-white placeholder:text-[#6b6b6b] focus-visible:ring-[#7c3aed]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="mt-1 h-[46px] w-full rounded-[9px] bg-[#7c3aed] text-[15px] font-semibold text-white hover:bg-[#6d28d9]"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

        </div>
      </div>
    </div>
  )
}
