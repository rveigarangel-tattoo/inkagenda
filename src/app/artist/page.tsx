"use client"
import { useEffect, useState } from "react"
import { DollarSign, Wallet, Calendar, Users } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { formatCurrency, formatDate, formatTime } from "@/lib/utils"

export default function ArtistDashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/artist/dashboard").then((r) => r.json()).then(setData).catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Painel</h1>
        <p className="text-sm text-muted-foreground">Resumo da sua atividade</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receita do Mês" value={formatCurrency(data.kpis.revenue)} icon={DollarSign} />
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Meus Ganhos</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold">{formatCurrency(data.kpis.earnings)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Comissão de {data.kpis.commissionPct}%</p>
          </CardContent>
        </Card>
        <StatCard label="Agendamentos" value={String(data.kpis.appointments)} icon={Calendar} />
        <StatCard label="Meus Clientes" value={String(data.kpis.clients)} icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Agendamentos de Hoje</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.todayAppointments.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum agendamento hoje.</p>
            )}
            {data.todayAppointments.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3">
                <AvatarInitials name={a.client.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.client.name}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(a.date)} · {a.service}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Próximos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum agendamento futuro.</p>
            )}
            {data.upcoming.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3">
                <AvatarInitials name={a.client.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.client.name}</p>
                  <p className="text-xs text-muted-foreground">{a.service}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(a.date, "dd/MM HH:mm")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
