"use client"
import { useEffect, useMemo, useState } from "react"
import { startOfMonth, endOfMonth } from "date-fns"
import { DollarSign, Percent, Wallet, CheckCircle } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function ArtistEarningsPage() {
  const [kpis, setKpis] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[] | null>(null)

  useEffect(() => {
    fetch("/api/artist/dashboard").then((r) => r.json()).then((d) => setKpis(d.kpis)).catch(() => {})
    const from = startOfMonth(new Date())
    const to = endOfMonth(new Date())
    fetch(`/api/appointments?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then(setAppointments)
      .catch(() => setAppointments([]))
  }, [])

  const pct = kpis?.commissionPct ?? 0

  const completed = useMemo(
    () => (appointments ?? []).filter((a) => a.status === "completed"),
    [appointments]
  )
  const totals = useMemo(() => {
    const revenue = completed.reduce((s, a) => s + (a.value ?? 0), 0)
    const share = revenue * (pct / 100)
    return { revenue, share }
  }, [completed, pct])

  if (!kpis) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Ganhos</h1>
        <p className="text-sm text-muted-foreground">Comissões e faturamento do mês</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receita Gerada" value={formatCurrency(kpis.revenue)} icon={DollarSign} />
        <StatCard label="Comissão" value={`${kpis.commissionPct}%`} icon={Percent} />
        <StatCard label="Meus Ganhos" value={formatCurrency(kpis.earnings)} icon={Wallet} />
        <StatCard label="Sessões Concluídas" value={String(kpis.completed)} icon={CheckCircle} />
      </div>

      <Card>
        <CardHeader><CardTitle>Sessões Concluídas (este mês)</CardTitle></CardHeader>
        <CardContent>
          {!appointments ? (
            <Skeleton className="h-40" />
          ) : completed.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma sessão concluída este mês.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Minha Parte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completed
                  .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                  .map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{formatDate(a.date, "dd/MM/yyyy")}</TableCell>
                      <TableCell>{a.client?.name}</TableCell>
                      <TableCell>{a.service}</TableCell>
                      <TableCell className="text-right">{formatCurrency(a.value ?? 0)}</TableCell>
                      <TableCell className="text-right text-primary">
                        {formatCurrency((a.value ?? 0) * (pct / 100))}
                      </TableCell>
                    </TableRow>
                  ))}
                <TableRow>
                  <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(totals.revenue)}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{formatCurrency(totals.share)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
