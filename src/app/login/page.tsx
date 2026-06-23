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
    <div className="flex min-h-screen bg-background">
      {/* Left — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center gap-6 bg-primary/5 border-r border-border p-16">
        <img src="/logo.svg" alt="inkagenda" className="logo-primary w-56" />
        <p className="text-center text-muted-foreground text-sm max-w-xs leading-relaxed">
          Gestão completa para estúdios de tatuagem — agenda, clientes, finanças e equipe num só lugar.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <img src="/logo.svg" alt="inkagenda" className="logo-primary mb-10 w-40 lg:hidden" />

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@inkflow.com" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="h-11" />
            </div>
            <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Demo: admin@inkflow.com / Admin@123
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Novo estúdio?{" "}
            <a href="/register" className="text-primary font-medium hover:underline">
              Criar conta gratuita
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
