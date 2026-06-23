"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ studioName: "", name: "", email: "", password: "", confirm: "" })

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error("As senhas não coincidem")
      return
    }
    setLoading(true)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studioName: form.studioName, name: form.name, email: form.email, password: form.password }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || "Erro ao criar conta")
      setLoading(false)
      return
    }
    const login = await signIn("credentials", { email: form.email, password: form.password, redirect: false })
    setLoading(false)
    if (login?.error) {
      toast.error("Conta criada, mas erro ao fazer login. Tente entrar manualmente.")
      router.push("/login")
      return
    }
    router.push("/onboarding")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo.svg" alt="InkFlow" className="mb-2 h-28 object-contain" />
          <p className="text-sm text-muted-foreground">Crie a conta do seu estúdio</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Estúdio *</Label>
                <Input value={form.studioName} onChange={set("studioName")} required placeholder="Black Label Tattoo" />
              </div>
              <div className="space-y-2">
                <Label>Seu Nome *</Label>
                <Input value={form.name} onChange={set("name")} required placeholder="Marcos Silva" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={set("email")} required placeholder="marcos@studio.com" />
              </div>
              <div className="space-y-2">
                <Label>Senha *</Label>
                <Input type="password" value={form.password} onChange={set("password")} required placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Senha *</Label>
                <Input type="password" value={form.confirm} onChange={set("confirm")} required placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando conta..." : "Criar conta gratuita"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
