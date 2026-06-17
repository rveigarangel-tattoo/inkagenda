"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Plus, Mail, Phone, Percent, CalendarCheck, Palette, Link2, MessageCircle,
  Send, Clock, CheckCircle2, Copy, Crown, ExternalLink, Pencil, Trash2, X, AlertTriangle,
} from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

type RoleType = "artist" | "admin" | "admin_artist"
function roleTypeToFields(rt: RoleType): { role: string; isArtist: boolean } {
  if (rt === "admin") return { role: "admin", isArtist: false }
  if (rt === "admin_artist") return { role: "admin", isArtist: true }
  return { role: "artist", isArtist: false }
}

const inviteSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  commissionPct: z.coerce.number().min(0).max(100),
  avatarColor: z.string().min(1),
})
type InviteValues = z.infer<typeof inviteSchema>

const editSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  phone: z.string().optional(),
  commissionPct: z.coerce.number().min(0).max(100),
  avatarColor: z.string().min(1),
  isActive: z.boolean(),
})
type EditValues = z.infer<typeof editSchema>

interface CreatedInvite {
  token: string
  name: string
  email: string | null
  phone: string | null
  expiresAt: string
}

function InviteForm({ onCreated }: { onCreated: (invite: CreatedInvite) => void }) {
  const [roleType, setRoleType] = useState<RoleType>("artist")
  const needsArtistFields = roleType !== "admin"

  const { register, handleSubmit, formState, reset } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: "", email: "", phone: "", commissionPct: 50, avatarColor: "#7c3aed" },
  })

  async function onSubmit(values: InviteValues) {
    const { role, isArtist } = roleTypeToFields(roleType)
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, role, isArtist }),
    })
    if (!res.ok) { toast.error("Erro ao criar convite"); return }
    const data = await res.json()
    onCreated(data)
    reset()
    setRoleType("artist")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Cargo</Label>
        <Select value={roleType} onValueChange={(v) => setRoleType(v as RoleType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="artist">Tatuador</SelectItem>
            <SelectItem value="admin">Co-dono</SelectItem>
            <SelectItem value="admin_artist">Co-dono Tatuador</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {roleType === "artist" && "Vê apenas a própria agenda e comissão."}
          {roleType === "admin" && "Acesso completo. Não aparece na agenda como artista."}
          {roleType === "admin_artist" && "Acesso completo e aparece na agenda e ranking."}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input {...register("name")} placeholder="João Silva" />
        {formState.errors.name && <p className="text-xs text-red-600 dark:text-red-400">{formState.errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...register("email")} placeholder="joao@studio.com" />
        </div>
        <div className="space-y-2">
          <Label>WhatsApp</Label>
          <Input {...register("phone")} placeholder="(11) 99999-0000" />
        </div>
      </div>

      {needsArtistFields && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Comissão (%)</Label>
            <Input type="number" step="1" min="0" max="100" {...register("commissionPct")} />
          </div>
          <div className="space-y-2">
            <Label>Cor do Avatar</Label>
            <Input type="color" className="h-10 p-1" {...register("avatarColor")} />
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        A pessoa receberá um link para criar a própria senha e confirmar os dados.
      </p>
      <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
        <Send className="mr-2 h-4 w-4" />
        {formState.isSubmitting ? "Gerando convite..." : "Gerar link de convite"}
      </Button>
    </form>
  )
}

function InviteResult({ invite, onDone }: { invite: CreatedInvite; onDone: () => void }) {
  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/invite/${invite.token}` : ""

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl)
    toast.success("Link copiado!")
  }

  function shareWhatsApp() {
    const phone = invite.phone?.replace(/\D/g, "") ?? ""
    const msg = encodeURIComponent(
      `Olá ${invite.name}! Você foi convidado para o InkFlow. Clique no link para criar sua conta: ${inviteUrl}`
    )
    const url = phone ? `https://wa.me/55${phone}?text=${msg}` : `https://wa.me/?text=${msg}`
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-green-500/10 border border-green-500/20 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-700 dark:text-green-400" />
        <div>
          <p className="text-sm font-medium">Convite gerado para {invite.name}</p>
          <p className="text-xs text-muted-foreground">Válido por 7 dias</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Link de convite</Label>
        <div className="flex items-center gap-2">
          <Input readOnly value={inviteUrl} className="font-mono text-xs" />
          <Button size="icon" variant="outline" onClick={copyLink} title="Copiar">
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" asChild title="Abrir em nova aba">
            <a href={inviteUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="w-full" onClick={copyLink}>
          <Link2 className="mr-2 h-4 w-4" /> Copiar link
        </Button>
        <Button variant="outline" className="w-full text-green-700 dark:text-green-400 border-green-600/30 dark:border-green-500/30 hover:bg-green-500/10" onClick={shareWhatsApp}>
          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
        </Button>
      </div>

      <Button className="w-full" onClick={onDone}>
        <Plus className="mr-2 h-4 w-4" /> Convidar outra pessoa
      </Button>
    </div>
  )
}

function EditArtistDialog({
  artist,
  onSaved,
}: {
  artist: any
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, formState, reset, setValue, watch } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: artist.name,
      phone: artist.phone ?? "",
      commissionPct: artist.commissionPct,
      avatarColor: artist.avatarColor,
      isActive: artist.isActive,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: artist.name,
        phone: artist.phone ?? "",
        commissionPct: artist.commissionPct,
        avatarColor: artist.avatarColor,
        isActive: artist.isActive,
      })
    }
  }, [open, artist, reset])

  const isActive = watch("isActive")

  async function onSubmit(values: EditValues) {
    const res = await fetch(`/api/team/${artist.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) { toast.error("Erro ao salvar"); return }
    toast.success("Tatuador atualizado")
    setOpen(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar — {artist.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input {...register("name")} />
            {formState.errors.name && <p className="text-xs text-red-600 dark:text-red-400">{formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input {...register("phone")} placeholder="(11) 99999-0000" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Comissão (%)</Label>
              <Input type="number" step="1" min="0" max="100" {...register("commissionPct")} />
            </div>
            <div className="space-y-2">
              <Label>Cor do Avatar</Label>
              <Input type="color" className="h-10 p-1" {...register("avatarColor")} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Conta ativa</p>
              <p className="text-xs text-muted-foreground">Desativar impede o login imediatamente</p>
            </div>
            <button
              type="button"
              onClick={() => setValue("isActive", !isActive)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                isActive ? "bg-primary" : "bg-muted"
              )}
            >
              <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform", isActive ? "translate-x-6" : "translate-x-1")} />
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RemoveArtistDialog({
  artist,
  onRemoved,
}: {
  artist: any
  onRemoved: (hard: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<"soft" | "hard" | null>(null)

  async function handle(hard: boolean) {
    setLoading(hard ? "hard" : "soft")
    const url = hard ? `/api/team/${artist.id}?hard=true` : `/api/team/${artist.id}`
    const res = await fetch(url, { method: "DELETE" })
    setLoading(null)
    if (!res.ok) { toast.error("Erro ao remover tatuador"); return }
    setOpen(false)
    onRemoved(hard)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Remover
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover {artist.name}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Escolha como deseja remover este tatuador do estúdio:</p>
        <div className="grid gap-3 py-1">
          <button
            onClick={() => handle(false)}
            disabled={!!loading}
            className="flex items-start gap-3 rounded-xl border p-4 text-left hover:bg-accent transition-colors disabled:opacity-50"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
              <X className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Desativar conta</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                O tatuador perde o acesso imediatamente. O card fica visível como "Desativado" e pode ser reativado depois.
              </p>
            </div>
            {loading === "soft" && <span className="ml-auto text-xs text-muted-foreground">...</span>}
          </button>

          <button
            onClick={() => handle(true)}
            disabled={!!loading}
            className="flex items-start gap-3 rounded-xl border border-destructive/30 p-4 text-left hover:bg-destructive/5 transition-colors disabled:opacity-50"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-sm text-destructive">Excluir permanentemente</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Remove o card completamente. Agendamentos anteriores são preservados no histórico, mas sem vínculo com o tatuador.
              </p>
            </div>
            {loading === "hard" && <span className="ml-auto text-xs text-muted-foreground">...</span>}
          </button>
        </div>
        <Button variant="outline" className="w-full" onClick={() => setOpen(false)} disabled={!!loading}>
          Cancelar
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default function TeamPage() {
  const [artists, setArtists] = useState<any[] | null>(null)
  const [invites, setInvites] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [createdInvite, setCreatedInvite] = useState<CreatedInvite | null>(null)

  function loadArtists() {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => setArtists(Array.isArray(d) ? d : []))
      .catch(() => setArtists([]))
  }

  function loadInvites() {
    fetch("/api/invites")
      .then((r) => r.json())
      .then((d) => setInvites(Array.isArray(d) ? d.filter((i: any) => !i.usedAt) : []))
      .catch(() => {})
  }

  useEffect(() => { loadArtists(); loadInvites() }, [])

  function handleOpen(v: boolean) {
    setOpen(v)
    if (!v) setCreatedInvite(null)
  }

  function onInviteCreated(invite: CreatedInvite) {
    setCreatedInvite(invite)
    loadInvites()
  }

  async function cancelInvite(token: string, name: string) {
    const res = await fetch(`/api/invites/${token}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Erro ao cancelar convite"); return }
    toast.success(`Convite de ${name} cancelado`)
    loadInvites()
  }

  function onArtistRemoved(name: string, hard: boolean) {
    toast.success(hard ? `${name} excluído permanentemente` : `${name} desativado`)
    loadArtists()
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-sm text-muted-foreground">Gerencie tatuadores e co-donos do estúdio</p>
        </div>
        <Dialog open={open} onOpenChange={handleOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Convidar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar para o Estúdio</DialogTitle>
            </DialogHeader>
            {createdInvite ? (
              <InviteResult invite={createdInvite} onDone={() => setCreatedInvite(null)} />
            ) : (
              <InviteForm onCreated={onInviteCreated} />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Convites pendentes */}
      {invites.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Convites Pendentes</h2>
          <div className="flex flex-col gap-2">
            {invites.map((inv: any) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-dashed bg-card px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inv.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.role === "admin" ? (inv.isArtist ? "Co-dono Tatuador" : "Co-dono") : "Tatuador"} ·
                    expira {formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Copiar link"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.token}`)
                      toast.success("Link copiado!")
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" title="Abrir link" asChild>
                    <a href={`/invite/${inv.token}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <ConfirmDialog
                    title="Cancelar convite?"
                    description={`O link de ${inv.name} será invalidado e não poderá ser usado.`}
                    confirmText="Cancelar convite"
                    onConfirm={() => cancelInvite(inv.token, inv.name)}
                    trigger={
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" title="Cancelar convite">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de membros */}
      {artists === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : artists.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="Nenhum membro na equipe"
          description="Convide tatuadores ou co-donos. Cada um cria a própria senha e acessa apenas os próprios dados."
          action={{ label: "Convidar", onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((a: any) => {
            const isOwner = a.role === "admin"
            return (
              <Card key={a.id} className={cn(!a.isActive && "opacity-60")}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <AvatarInitials name={a.name} color={a.avatarColor} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold">{a.name}</p>
                        {isOwner && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          a.isActive ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-red-500/15 text-red-700 dark:text-red-400"
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", a.isActive ? "bg-green-600 dark:bg-green-400" : "bg-red-500")} />
                          {a.isActive ? "Ativo" : "Desativado"}
                        </span>
                        {isOwner && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                            {a.isArtist ? "Co-dono Tatuador" : "Co-dono"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{a.email}</span></p>
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> {a.phone || "—"}</p>
                    <p className="flex items-center gap-2"><Percent className="h-4 w-4 shrink-0" /> Comissão: {a.commissionPct}%</p>
                    <p className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 shrink-0" /> {a.appointments?.length ?? 0} agendamentos</p>
                  </div>

                  {!isOwner && (
                    <div className="mt-4 flex gap-2 border-t pt-4">
                      <EditArtistDialog artist={a} onSaved={loadArtists} />
                      <RemoveArtistDialog
                        artist={a}
                        onRemoved={(hard) => onArtistRemoved(a.name, hard)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
