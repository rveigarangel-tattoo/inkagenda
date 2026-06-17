"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DollarSign, Wallet, Calendar, Users, ArrowRight } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { formatCurrency, formatDate, formatTime } from "@/lib/utils"

export default function ArtistDashboardPage() {
  const [data, setData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/artist/dashboard").then((r) => r.json()).then(setData).catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const today = new Date()
  const todayCount = data.todayAppointments.length

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Hero: today */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border cursor-pointer"
        onClick={() => router.push("/artist/agenda")}
      >
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">Hoje</p>
              <p className="text-2xl font-bold capitalize">
                {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-2xl font-bold text-primary">
              {todayCount}
            </div>
          </div>

          {todayCount === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum agendamento hoje. Aproveite!</p>
          ) : (
            <div className="space-y-2.5">
              {data.todayAppointments.map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl bg-background/60 px-3 py-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="w-11 shrink-0 text-xs font-semibold tabular-nums text-primary">
                    {formatTime(a.date)}
                  </span>
                  <div className="h-4 w-px bg-border" />
                  <AvatarInitials name={a.client?.name ?? "?"} size={30} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/artist/clients/${a.clientId}`}
                      className="block truncate text-sm font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {a.client?.name ?? "—"}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{a.service}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-1 text-xs text-primary/70">
            <span>Abrir agenda</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* KPIs */}
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

      {/* Upcoming */}
      {data.upcoming.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Próximos Agendamentos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.upcoming.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3">
                <AvatarInitials name={a.client?.name ?? "?"} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.client?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{a.service}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(a.date, "dd/MM HH:mm")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
