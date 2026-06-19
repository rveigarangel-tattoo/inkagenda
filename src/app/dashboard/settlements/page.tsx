"use client"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

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

export default function SettlementsPage() {
  const [previews, setPreviews]         = useState<any[]>([])
  const [settlements, setSettlements]   = useState<any[]>([])
  const [loadingP, setLoadingP]         = useState(true)
  const [loadingS, setLoadingS]         = useState(true)
  const [closing, setClosing]           = useState<string | null>(null)

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
                    {p.isOverdue && (
                      <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Vencido
                      </span>
                    )}
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
                  <p className="text-xs text-primary">{formatCurrency(s.artistAmount)} p/ tatuador</p>
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
                      description={`O acerto de ${s.artist.name} (${formatCurrency(s.artistAmount)}) será travado como histórico permanente. Esta ação não pode ser desfeita sem reabrir manualmente.`}
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
