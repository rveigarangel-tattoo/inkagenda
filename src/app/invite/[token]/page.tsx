"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AvatarInitials } from "@/components/ui/avatar-initials"

interface InviteInfo {
  name: string
  email: string | null
  phone: string | null
  role: string
  studioName: string
  commissionPct: number
  avatarColor: string
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" })

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setInvite(d)
        setForm((p) => ({ ...p, name: d.name || "", email: d.email || "", phone: d.phone || "" }))
      })
      .catch(() => setError("Erro ao carregar convite"))
      .finally(() => setLoading(false))
  }, [token])

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error("As senhas não coincidem")
      return
    }
    if (form.password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres")
      return
    }
    setSubmitting(true)
    const res = await fetch(`/api/invites/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone || null, password: form.password }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || "Erro ao criar conta")
      setSubmitting(false)
      return
    }
    const login = await signIn("credentials", { email: form.email, password: form.password, redirect: false })
    setSubmitting(false)
    if (login?.error) {
      toast.success("Conta criada! Faça login para continuar.")
      router.push("/login")
      return
    }
    toast.success("Bem-vindo ao InkFlow!")
    router.push(invite?.role === "admin" ? "/dashboard" : "/artist")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
          </div>
          <h1 className="mb-2 text-xl font-bold">Convite inválido</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button className="mt-6" variant="outline" onClick={() => router.push("/login")}>
            Ir para login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo.svg" alt="inkagenda" className="mb-4 w-32 object-contain logo-primary" />
          <p className="text-sm text-muted-foreground">Você foi convidado para o estúdio</p>
        </div>

        <div className="mb-6 flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center">
          <AvatarInitials name={invite!.name} color={invite!.avatarColor} size={56} />
          <div>
            <p className="font-semibold">{invite!.name}</p>
            <p className="text-sm text-muted-foreground">
              {invite!.role === "artist" ? "Tatuador" : "Admin"} · {invite!.studioName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Comissão: {invite!.commissionPct}%</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <p className="mb-4 text-sm font-medium">Complete seu cadastro</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={set("name")} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={set("email")} required />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={set("phone")} placeholder="(11) 9xxxx-xxxx" />
              </div>
              <div className="space-y-2">
                <Label>Senha *</Label>
                <Input type="password" value={form.password} onChange={set("password")} required placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Senha *</Label>
                <Input type="password" value={form.confirm} onChange={set("confirm")} required placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Criando conta..." : "Criar minha conta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
