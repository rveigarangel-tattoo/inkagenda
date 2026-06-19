"use client"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, AlertCircle, CheckCircle2, Clock, Settings2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDate, cn, SETTLEMENT_FREQUENCIES } from "@/lib/utils"

const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  closed:  { label: "Aguardando pagamento", cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
  paid:    { label: "Pago",                 cls: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",  icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { label: "Pendente",             cls: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",          icon: <AlertCircle className="h-3 w-3" /> },
}

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.closed
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", cfg.cls)}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

// ── Artist config dialog ──────────────────────────────────────────────────────
function ArtistConfigDialog({
  preview,
  open,
  onClose,
  onSaved,
}: {
  preview: any
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [commission, setCommission]   = useState(preview.artist.commissionPct)
  const [frequency, setFrequency]     = useState(preview.artist.settlementFrequency ?? "monthly")
  const [customDays, setCustomDays]   = useState(preview.artist.settlementDays ?? 30)
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    if (open) {
      setCommission(preview.artist.commissionPct)
      setFrequency(preview.artist.settlementFrequency ?? "monthly")
      setCustomDays(preview.artist.settlementDays ?? 30)
    }
  }, [open, preview])

  async function save() {
    setSaving(true)
    try {
      const r = await fetch(`/api/team/${preview.artist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: preview.artist.name,
          commissionPct: commission,
          settlementFrequency: frequency,
          settlementDays: customDays,
          avatarColor: preview.artist.avatarColor,
          isActive: true,
        }),
      })
      if (!r.ok) { toast.error("Erro ao salvar configurações"); return }
      toast.success("Configurações salvas! O próximo período usará os novos valores.")
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Configurar — {preview.artist.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Comissão do tatuador (%)</Label>
            <Input
              type="number" min="0" max="100" step="1"
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Afeta os próximos acertos. Acertos já fechados mantêm o valor original.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Frequência de acerto</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SETTLEMENT_FREQUENCIES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {frequency === "custom" && (
            <div className="space-y-1.5">
              <Label>Dias por ciclo</Label>
              <Input
                type="number" min="1" max="365"
                value={customDays}
                onChange={(e) => setCustomDays(Number(e.target.value))}
              />
            </div>
          )}

          {/* Preview do próximo período */}
          <div className="rounded-xl border bg-muted/20 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Período atual (prévia)
            </p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bruto acumulado</span>
              <span className="font-medium">{formatCurrency(preview.totalGross)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Tatuador ({commission}%)</span>
              <span className="font-medium text-primary">
                {formatCurrency(preview.totalGross * (commission / 100))}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Estúdio ({100 - commission}%)</span>
              <span className="font-medium">
                {formatCurrency(preview.totalGross * ((100 - commission) / 100))}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettlementsPage() {
  const [previews, setPreviews]         = useState<any[]>([])
  const [settlements, setSettlements]   = useState<any[]>([])
  const [loadingP, setLoadingP]         = useState(true)
  const [loadingS, setLoadingS]         = useState(true)
  const [closing, setClosing]           = useState<string | null>(null)
  const [editingArtist, setEditingArtist] = useState<any | null>(null)

  const loadPreviews = useCallback(async () => {
    setLoadingP(true)
    try {
      const r = await fetch("/api/settlements/preview")
      setPreviews(await r.json())
    } finally { setLoadingP(false) }
  }, [])

  const loadSettlements = useCallback(async () => {
    setLoadingS(true)
    try {
      const r = await fetch("/api/settlements")
      setSettlements(await r.json())
    } finally { setLoadingS(false) }
  }, [])

  useEffect(() => { loadPreviews(); loadSettlements() }, [loadPreviews, loadSettlements])

  async function closeSettlement(preview: any) {
    setClosing(preview.artist.id)
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: preview.artist.id,
          periodStart: preview.periodStart,
          periodEnd: preview.scheduledEnd,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || "Erro ao fechar acerto")
        return
      }
      toast.success("Período fechado com sucesso!")
      loadPreviews()
      loadSettlements()
    } catch {
      toast.error("Erro ao fechar acerto")
    } finally {
      setClosing(null)
    }
  }

  async function markPaid(id: string) {
    const res = await fetch(`/api/settlements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    })
    if (!res.ok) { toast.error("Erro ao marcar como pago"); return }
    toast.success("Acerto marcado como pago e travado!")
    loadSettlements()
  }

  return (
    <div className="space-y-8 p-4 md:p-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Acertos de Repasse</h1>
        <p className="text-sm text-muted-foreground">Gerencie os repasses financeiros com seus tatuadores</p>
      </div>

      {/* Artist config dialog */}
      {editingArtist && (
        <ArtistConfigDialog
          preview={editingArtist}
          open={!!editingArtist}
          onClose={() => setEditingArtist(null)}
          onSaved={() => { loadPreviews() }}
        />
      )}

      {/* ── Períodos em aberto ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Períodos em Aberto
        </h2>

        {loadingP ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : previews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nenhum tatuador ativo encontrado. Configure os tatuadores na aba <strong>Equipe</strong>.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previews.map((p) => (
              <Card key={p.artist.id} className={cn("transition-shadow hover:shadow-md", p.isOverdue && "border-amber-500/40")}>
                <CardContent className="p-5">
                  {/* Artist header */}
                  <div className="mb-4 flex items-center gap-3">
                    <AvatarInitials name={p.artist.name} color={p.artist.avatarColor} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.artist.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.periodStart, "dd/MM")} – {formatDate(p.scheduledEnd, "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {p.isOverdue && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          Vencido
                        </span>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingArtist(p)}
                        title="Configurar comissão e frequência"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Bruto acumulado</p>
                      <p className="mt-0.5 font-bold">{formatCurrency(p.totalGross)}</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3">
                      <p className="text-xs text-muted-foreground">{p.artist.commissionPct}% tatuador</p>
                      <p className="mt-0.5 font-bold text-primary">{formatCurrency(p.artistAmount)}</p>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.appointmentsCount} sessão(ões) concluída(s)</span>
                    <span>Estúdio: {formatCurrency(p.studioAmount)}</span>
                  </div>

                  {p.totalGross > 0 ? (
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" className="w-full" disabled={closing === p.artist.id}>
                          {closing === p.artist.id ? "Fechando..." : "Fechar e Calcular"}
                        </Button>
                      }
                      title="Fechar período de acerto?"
                      description={`Período de ${p.artist.name}: ${formatDate(p.periodStart, "dd/MM")} a ${formatDate(p.scheduledEnd, "dd/MM/yyyy")} · ${p.appointmentsCount} sessão(ões) · Total bruto: ${formatCurrency(p.totalGross)}. Após fechar, o acerto fica aguardando pagamento.`}
                      confirmText="Fechar período"
                      onConfirm={() => closeSettlement(p)}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                      Nenhuma sessão concluída neste período
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Histórico ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Histórico de Acertos
        </h2>

        {loadingS ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : settlements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nenhum acerto fechado ainda. Feche um período para criar o primeiro registro.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {settlements.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 md:p-4 transition-colors hover:bg-accent/30"
              >
                <AvatarInitials name={s.artist.name} color={s.artist.avatarColor} size={36} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.artist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(s.periodStart, "dd/MM")} – {formatDate(s.periodEnd, "dd/MM/yyyy")}
                  </p>
                </div>

                <div className="hidden sm:block shrink-0 text-right">
                  <p className="text-sm font-semibold">{formatCurrency(s.totalGross)}</p>
                  <p className="text-xs text-primary">
                    {formatCurrency(s.artistAmount + (s.adjustmentAmount ?? 0))} p/ tatuador
                    {s.adjustmentAmount && s.adjustmentAmount !== 0 ? " ✱" : ""}
                  </p>
                </div>

                <StatusChip status={s.status} />

                <div className="flex shrink-0 items-center gap-1">
                  {s.status === "closed" && (
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" variant="outline" className="border-green-600/30 text-green-700 hover:bg-green-500/10 dark:text-green-400">
                          Pago
                        </Button>
                      }
                      title="Marcar acerto como pago?"
                      description={`O acerto de ${s.artist.name} (${formatCurrency(s.artistAmount + (s.adjustmentAmount ?? 0))}) será travado como histórico permanente.`}
                      confirmText="Confirmar pagamento"
                      onConfirm={() => markPaid(s.id)}
                    />
                  )}
                  <Link href={`/dashboard/settlements/${s.id}`}>
                    <Button size="icon" variant="ghost" aria-label="Ver detalhes">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
