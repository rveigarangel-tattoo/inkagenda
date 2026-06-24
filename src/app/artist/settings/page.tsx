"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { KeyRound, AtSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarInitials } from "@/components/ui/avatar-initials"

const COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626",
  "#db2777", "#0891b2", "#65a30d", "#9333ea", "#ea580c",
]

export default function ArtistSettingsPage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [savingUsername, setSavingUsername] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", avatarColor: "#7c3aed" })
  const [username, setUsername] = useState("")
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" })

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setForm({ name: d.name ?? "", phone: d.phone ?? "", avatarColor: d.avatarColor ?? "#7c3aed" })
        setUsername(d.username ?? "")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone, avatarColor: form.avatarColor }),
      })
      if (!res.ok) throw new Error()
      await update({ name: form.name.trim(), avatarColor: form.avatarColor })
      toast.success("Perfil atualizado")
    } catch {
      toast.error("Erro ao salvar perfil")
    } finally {
      setSaving(false)
    }
  }

  async function saveUsername(e: React.FormEvent) {
    e.preventDefault()
    setSavingUsername(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Erro ao salvar"); return }
      setUsername(data.username ?? "")
      toast.success("Username salvo")
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setSavingUsername(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwd.next !== pwd.confirm) { toast.error("As senhas não coincidem"); return }
    setSavingPwd(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Erro ao alterar senha"); return }
      setPwd({ current: "", next: "", confirm: "" })
      toast.success("Senha alterada com sucesso")
    } catch {
      toast.error("Erro ao alterar senha")
    } finally {
      setSavingPwd(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">Atualize seus dados pessoais</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <AvatarInitials name={form.name || "?"} color={form.avatarColor} size={56} />
            <div>
              <CardTitle className="text-base">{form.name || "—"}</CardTitle>
              <p className="text-sm text-muted-foreground">{(session?.user as any)?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor do Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, avatarColor: c }))}
                    className="h-11 w-11 rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: c,
                      borderColor: form.avatarColor === c ? "white" : "transparent",
                      boxShadow: form.avatarColor === c ? `0 0 0 2px ${c}` : undefined,
                    }}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AtSign className="h-5 w-5 text-primary" />
            Username
          </CardTitle>
          <CardDescription>Use seu username para fazer login em vez do email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveUsername} className="flex gap-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="meu_username"
              className="lowercase"
            />
            <Button type="submit" disabled={savingUsername}>
              {savingUsername ? "Salvando..." : "Salvar"}
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">Apenas letras, números e _ (mínimo 3 caracteres)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Escolha uma senha forte com pelo menos 6 caracteres</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Senha atual</Label>
              <Input
                type="password"
                value={pwd.current}
                onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <Input
                type="password"
                value={pwd.next}
                onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={savingPwd}>
              {savingPwd ? "Alterando..." : "Alterar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
