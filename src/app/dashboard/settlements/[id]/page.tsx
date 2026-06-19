"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  closed: {
    label: "Aguardando pagamento",
    cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  paid: {
    label: "Pago",
    cls: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  pending: {
    label: "Pendente",
    cls: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    icon: <AlertCircle className="h-3 w-3" />,
  },
}

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.closed
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        cfg.cls
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function PaymentBar({ label, amount, total }: { label: string; amount: number; total: number }) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {formatCurrency(amount)}
          {total > 0 && <span className="ml-1 text-xs text-muted-foreground">({pct}%)</span>}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function normalizeMethod(m: string | null | undefined): string {
  if (!m) return "Não informado"
  const l = m.toLowerCase()
  if (l.includes("pix")) return "PIX"
  if (l.includes("dinheiro")) return "Dinheiro"
  if (l.includes("cart")) return "Cartão"
  return m
}

export default function SettlementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [settlement, setSettlement] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [acting, setActing] = useState(false)
  const notesRef = useRef<string>("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/settlements/${id}`)
      if (!r.ok) { toast.error("Acerto não encontrado"); return }
      const data = await r.json()
      setSettlement(data)
      setNotes(data.notes ?? "")
      notesRef.current = data.notes ?? ""
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function patch(body: object) {
    setActing(true)
    try {
      const r = await fetch(`/api/settlements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const d = await r.json()
        toast.error(d.error || "Erro ao atualizar acerto")
        return
      }
      const updated = await r.json()
      setSettlement(updated)
      setNotes(updated.notes ?? "")
      notesRef.current = updated.notes ?? ""
    } finally {
      setActing(false)
    }
  }

  async function markPaid() {
    await patch({ status: "paid" })
    toast.success("Acerto marcado como pago e travado!")
  }

  async function reopen() {
    await patch({ status: "closed" })
    toast.success("Acerto reaberto — agora aguarda pagamento novamente.")
  }

  async function saveNotes() {
    setSavingNotes(true)
    try {
      const r = await fetch(`/api/settlements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      if (!r.ok) { toast.error("Erro ao salvar observações"); return }
      toast.success("Observações salvas")
      notesRef.current = notes
    } finally {
      setSavingNotes(false)
    }
  }

  async function deleteSettlement() {
    setActing(true)
    try {
      const r = await fetch(`/api/settlements/${id}`, { method: "DELETE" })
      if (!r.ok) {
        const d = await r.json()
        toast.error(d.error || "Erro ao excluir acerto")
        return
      }
      toast.success("Acerto excluído")
      router.push("/dashboard/settlements")
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!settlement) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Acerto não encontrado.</p>
        <Link href="/dashboard/settlements">
          <Button variant="link" className="mt-2 p-0">← Voltar</Button>
        </Link>
      </div>
    )
  }

  const { artist, items, status, periodStart, periodEnd, totalGross, artistAmount, studioAmount,
          commissionPct, pixAmount, cashAmount, cardAmount, otherAmount, paidAt } = settlement

  const notesChanged = notes !== notesRef.current

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/settlements">
            <Button size="icon" variant="ghost" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <AvatarInitials name={artist.name} color={artist.avatarColor} size={44} />
          <div>
            <h1 className="text-xl font-bold leading-tight">{artist.name}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(periodStart, "dd/MM/yyyy")} – {formatDate(periodEnd, "dd/MM/yyyy")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <StatusChip status={status} />

          {status === "closed" && (
            <>
              <ConfirmDialog
                trigger={
                  <Button size="sm" disabled={acting} className="border-green-600/40 bg-green-600/10 text-green-700 hover:bg-green-600/20 dark:text-green-400" variant="outline">
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Marcar como Pago
                  </Button>
                }
                title="Confirmar pagamento?"
                description={`O acerto de ${artist.name} (${formatCurrency(artistAmount)}) será travado como histórico permanente. Esta ação só pode ser revertida com "Reabrir acerto".`}
                confirmText="Confirmar pagamento"
                onConfirm={markPaid}
              />
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="outline" disabled={acting} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Excluir
                  </Button>
                }
                title="Excluir acerto?"
                description="Esta ação é irreversível. O período será liberado para um novo fechamento."
                confirmText="Excluir acerto"
                onConfirm={deleteSettlement}
              />
            </>
          )}

          {status === "paid" && (
            <ConfirmDialog
              trigger={
                <Button size="sm" variant="outline" disabled={acting}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Reabrir acerto
                </Button>
              }
              title="Reabrir acerto pago?"
              description="O acerto voltará para 'Aguardando pagamento'. O histórico de itens permanece intacto."
              confirmText="Reabrir"
              onConfirm={reopen}
            />
          )}
        </div>
      </div>

      {status === "paid" && paidAt && (
        <p className="text-xs text-muted-foreground">
          Pago em {formatDate(paidAt, "dd/MM/yyyy 'às' HH:mm")}
        </p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total bruto</p>
            <p className="mt-0.5 text-lg font-bold">{formatCurrency(totalGross)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{items.length} sessão(ões)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tatuador ({commissionPct}%)</p>
            <p className="mt-0.5 text-lg font-bold text-primary">{formatCurrency(artistAmount)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{artist.name}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Estúdio ({100 - commissionPct}%)</p>
            <p className="mt-0.5 text-lg font-bold">{formatCurrency(studioAmount)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Comissão do estúdio</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Forma de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PaymentBar label="PIX" amount={pixAmount} total={totalGross} />
          <PaymentBar label="Dinheiro" amount={cashAmount} total={totalGross} />
          <PaymentBar label="Cartão" amount={cardAmount} total={totalGross} />
          {otherAmount > 0 && (
            <PaymentBar label="Não informado" amount={otherAmount} total={totalGross} />
          )}
        </CardContent>
      </Card>

      {/* Items table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Serviços Incluídos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Nenhum serviço neste acerto.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Serviço</th>
                    <th className="px-4 py-3 font-medium text-right">Valor</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Pagamento</th>
                    <th className="px-4 py-3 font-medium text-right hidden md:table-cell">Tatuador</th>
                    <th className="px-4 py-3 font-medium text-right hidden md:table-cell">Estúdio</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, i: number) => (
                    <tr
                      key={item.id}
                      className={cn("border-b last:border-0", i % 2 === 0 ? "bg-transparent" : "bg-muted/20")}
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(item.serviceDate, "dd/MM/yy")}
                      </td>
                      <td className="px-4 py-3 max-w-[120px] truncate">
                        {item.clientName ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell max-w-[140px] truncate text-muted-foreground">
                        {item.service}
                      </td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                        {formatCurrency(item.value)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                        {normalizeMethod(item.paymentMethod)}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-primary whitespace-nowrap">
                        {formatCurrency(item.artistAmount)}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground whitespace-nowrap">
                        {formatCurrency(item.studioAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30 font-semibold">
                    <td colSpan={3} className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                      Total
                    </td>
                    <td colSpan={3} className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground sm:hidden">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(totalGross)}</td>
                    <td className="hidden md:table-cell" />
                    <td className="px-4 py-3 text-right hidden md:table-cell text-primary whitespace-nowrap">
                      {formatCurrency(artistAmount)}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground whitespace-nowrap">
                      {formatCurrency(studioAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adicione observações sobre este acerto..."
            rows={3}
            disabled={savingNotes}
          />
          {notesChanged && (
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNotes(notesRef.current)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
                {savingNotes ? "Salvando..." : "Salvar observações"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
