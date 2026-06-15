"use client"
import { useEffect, useState } from "react"
import { DollarSign, CalendarCheck, CheckCircle, Receipt } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatTime } from "@/lib/utils"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).catch(() => {})
  }, [])

  if (!data) {
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do estúdio</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receita do Mês" value={formatCurrency(data.kpis.revenue)} icon={DollarSign} />
        <StatCard label="Agendamentos" value={String(data.kpis.appointments)} icon={CalendarCheck} />
        <StatCard label="Taxa de Conclusão" value={`${data.kpis.completionRate.toFixed(0)}%`} icon={CheckCircle} />
        <StatCard label="Ticket Médio" value={formatCurrency(data.kpis.avgTicket)} icon={Receipt} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Receita (últimos 6 meses)</CardTitle></CardHeader>
          <CardContent><RevenueChart data={data.monthlyRevenue} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Agendamentos de Hoje</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.todayAppointments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum agendamento hoje.</p>}
            {data.todayAppointments.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3">
                <AvatarInitials name={a.artist.name} color={a.artist.avatarColor} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.client.name}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(a.date)} · {a.service}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Ranking de Tatuadores</CardTitle></CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
