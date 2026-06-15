"use client"
import { useEffect, useState } from "react"
import { format, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DollarSign, CalendarCheck, CheckCircle, Receipt } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatTime } from "@/lib/utils"

// Month options: last 12 months up to and including current month
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const d = subMonths(new Date(), 11 - i)
  const raw = format(d, "MMM/yyyy", { locale: ptBR })
  return {
    value: format(d, "yyyy-MM"),
    label: raw.charAt(0).toUpperCase() + raw.slice(1),
  }
})

const SELECT_CLS =
  "rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"))
  const [artistId, setArtistId] = useState("")

  useEffect(() => {
    const params = new URLSearchParams({ month })
    if (artistId) params.set("artistId", artistId)
    fetch(`/api/dashboard?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [month, artistId])

  if (!data) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-40 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-60 w-full" />
          </div>
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const selectedLabel = MONTH_OPTIONS.find((o) => o.value === month)?.label ?? month

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Title + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {selectedLabel}
            {data.isAdmin && artistId
              ? ` · ${data.artists.find((a: any) => a.id === artistId)?.name ?? ""}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={SELECT_CLS}
            aria-label="Filtrar por mês"
          >
            {MONTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {data.isAdmin && (
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              className={SELECT_CLS}
              aria-label="Filtrar por tatuador"
            >
              <option value="">Todos os tatuadores</option>
              {data.artists.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receita do Mês" value={formatCurrency(data.kpis.revenue)} icon={DollarSign} change={data.kpis.revenueChange} variant="primary" />
        <StatCard label="Agendamentos" value={String(data.kpis.appointments)} icon={CalendarCheck} change={data.kpis.appointmentsChange} />
        <StatCard label="Taxa de Conclusão" value={`${data.kpis.completionRate.toFixed(0)}%`} icon={CheckCircle} change={data.kpis.completionRateChange} />
        <StatCard label="Ticket Médio" value={formatCurrency(data.kpis.avgTicket)} icon={Receipt} change={data.kpis.avgTicketChange} />
      </div>

      {/* Chart + today */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Receita (6 meses)</CardTitle></CardHeader>
          <CardContent><RevenueChart data={data.monthlyRevenue} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Agendamentos de Hoje</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.todayAppointments.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum agendamento hoje.</p>
            )}
            {data.todayAppointments.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3">
                <AvatarInitials name={a.artist.name} color={a.artist.avatarColor} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.client?.name ?? "Horário Bloqueado"}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(a.date)} · {a.service}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>
            {data.isAdmin && !artistId ? "Ranking de Tatuadores" : "Desempenho do Tatuador"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados para o período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tatuador</TableHead>
                  <TableHead className="text-right">Agendamentos</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ranking.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AvatarInitials name={r.name} color={r.avatarColor} size={32} />
                        <span className="font-medium">{r.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{r.appointments}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.revenue)}</TableCell>
                    <TableCell className="text-right text-primary">{formatCurrency(r.commission)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
