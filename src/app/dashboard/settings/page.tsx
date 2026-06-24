"use client"
import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { LogOut, Moon, Brush, KeyRound, AtSign } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = (session?.user as any) ?? {}
  const isAdmin = user.role === "admin"

  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [savingUsername, setSavingUsername] = useState(false)
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" })
  const [username, setUsername] = useState("")

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d)
        setUsername(d.username ?? "")
      })
  }, [])

  async function saveArtistProfile() {
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isArtist: profile.isArtist,
          commissionPct: profile.commissionPct,
          avatarColor: profile.avatarColor,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Perfil atualizado")
    } catch {
      toast.error("Erro ao salvar")
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

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">{user.name}</p>
      </div>

      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Informações da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={user.name ?? ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email ?? ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Input value={user.role === "admin" ? "Administrador" : "Tatuador"} readOnly />
            </div>
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

        {isAdmin && profile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brush className="h-5 w-5 text-primary" />
                Perfil de Artista
              </CardTitle>
              <CardDescription>
                Ative se você também tatua. Seus dados aparecerão no ranking, na agenda e nos filtros.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Também sou tatuador</p>
                  <p className="text-xs text-muted-foreground">Aparece na agenda e no ranking como artista</p>
                </div>
                <Switch
                  checked={profile.isArtist}
                  onCheckedChange={(v: boolean) => setProfile({ ...profile, isArtist: v })}
                />
              </div>

              {profile.isArtist && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Comissão (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={profile.commissionPct}
                      onChange={(e) => setProfile({ ...profile, commissionPct: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor do Avatar</Label>
                    <Input
                      type="color"
                      className="h-10 p-1"
                      value={profile.avatarColor}
                      onChange={(e) => setProfile({ ...profile, avatarColor: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <Button onClick={saveArtistProfile} disabled={saving}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Preferências</CardTitle>
            <CardDescription>Personalize sua experiência</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              <Moon className="h-4 w-4" />
              Modo escuro está ativado por padrão.
            </div>
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-fit" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </div>
  )
}
