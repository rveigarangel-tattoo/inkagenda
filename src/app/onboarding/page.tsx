"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { InkagendaLogo } from "@/components/ui/logo"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", commissionPct: "50" })

  useEffect(() => {
    fetch("/api/studio")
      .then((r) => r.json())
      .then((d) => { if (d.name) setForm((p) => ({ ...p, name: d.name })) })
      .catch(() => {})
  }, [])

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/studio", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, commissionPct: Number(form.commissionPct) }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error("Erro ao salvar configurações")
      return
    }
    toast.success("Estúdio configurado!")
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <InkagendaLogo className="mb-2" />
          <h1 className="text-2xl font-bold">Configure seu Estúdio</h1>
          <p className="text-sm text-muted-foreground">Leva menos de 1 minuto para começar</p>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Conta criada com sucesso!</p>
            <p className="text-xs text-muted-foreground">Agora personalize as informações do estúdio.</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Estúdio *</Label>
                <Input value={form.name} onChange={set("name")} required placeholder="Black Label Tattoo" />
              </div>
              <div className="space-y-2">
                <Label>Comissão padrão dos tatuadores (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.commissionPct}
                  onChange={set("commissionPct")}
                />
                <p className="text-xs text-muted-foreground">
                  Pode ser ajustado individualmente por tatuador depois.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Começar a usar o InkFlow →"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Pode pular por agora e ajustar depois em Configurações.{" "}
          <button onClick={() => router.push("/dashboard")} className="text-primary hover:underline">
            Pular
          </button>
        </p>
      </div>
    </div>
  )
}
