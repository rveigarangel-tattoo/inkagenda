"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { addDays, format, parseISO, startOfMonth, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown, DollarSign, CalendarCheck, CheckCircle, Receipt, ArrowRight } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatTime, cn } from "@/lib/utils"

type DateRange = { from: string; to: string }

const PRESETS: { label: string; get: () => DateRange }[] = [
  {
    label: "Hoje",
    get: () => { const t = format(new Date(), "yyyy-MM-dd"); return { from: t, to: t } },
  },
  {
    label: "Últimos 3 dias",
    get: () => ({ from: format(addDays(new Date(), -2), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }),
  },
  {
    label: "Últimos 7 dias",
    get: () => ({ from: format(addDays(new Date(), -6), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }),
  },
  {
    label: "Últimos 15 dias",
    get: () => ({ from: format(addDays(new Date(), -14), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }),
  },
  {
    label: "Esta semana",
    get: () => ({
      from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
      to: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Este mês",
    get: () => ({
      from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      to: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Mês anterior",
    get: () => {
      const now = new Date()
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: format(first, "yyyy-MM-dd"), to: format(last, "yyyy-MM-dd") }
    },
  },
]

function getActiveLabel(range: DateRange): string {
  for (const p of PRESETS) {
    const r = p.get()
    if (r.from === range.from && r.to === range.to) return p.label
  }
  return "Personalizado"
}

function displayDate(str: string) {
  try { return format(parseISO(str), "dd/MM/yyyy") } catch { return str }
}

function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  useEffect(() => { setDraft(value) }, [value])

  const label = getActiveLabel(value)
  const todayStr = format(new Date(), "yyyy-MM-dd")

  function applyPreset(get: () => DateRange) {
    onChange(get())
    setOpen(false)
  }

  function applyCustom() {
    if (draft.from && draft.to && draft.from <= draft.to) {
      onChange(draft)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">·</span>
        {value.from !== value.to ? (
          <span className="text-muted-foreground">{displayDate(value.from)} → {displayDate(value.to)}</span>
        ) : (
          <span className="text-muted-foreground">{displayDate(value.from)}</span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-150", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 flex flex-col sm:flex-row overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {/* Preset list */}
          <div className="flex flex-row sm:flex-col flex-wrap gap-0.5 border-b sm:border-b-0 sm:border-r border-border p-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.get)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-left text-sm transition-colors whitespace-nowrap",
                  label === preset.label
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-accent"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <div className="flex flex-col gap-3 p-4 min-w-[260px]">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Período personalizado
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">De</label>
                <input
                  type="date"
                  value={draft.from}
                  max={draft.to || todayStr}
                  onChange={(e) => setDraft({ ...draft, from: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Até</label>
                <input
                  type="date"
                  value={draft.to}
                  min={draft.from}
                  max={todayStr}
                  onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={!draft.from || !draft.to || draft.from > draft.to}
              onClick={applyCustom}
            >
              Aplicar período
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const SELECT_CLS =
  "rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [range, setRange] = useState<DateRange>(() => ({
    from: format(addDays(new Date(), -6), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  }))
  const [artistId, setArtistId] = useState("")
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams({ from: range.from, to: range.to })
    if (artistId) params.set("artistId", artistId)
    fetch(`/api/dashboard?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [range, artistId])

  if (!data) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-52 rounded-lg" />
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

  const activeLabel = getActiveLabel(range)
  const todayCount = data.todayAppointments.filter((a: any) => a.status !== "blocked").length

  return (
    <div className="p-4 pb-24 md:p-6 md:pb-6 space-y-6">

      {/* ══ HOJE — primeira coisa visível ══ */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {format(new Date(), "EEEE", { locale: ptBR })}
            </p>
            <h1 className="text-2xl font-bold">
              {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
            </h1>
            {todayCount > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {todayCount} agendamento{todayCount > 1 ? "s" : ""} hoje
              </p>
            )}
          </div>
          <Link href="/dashboard/schedule" className="flex items-center gap-1 text-sm text-primary hover:underline pb-1">
            Agenda <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {data.todayAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 py-10 gap-2">
            <CalendarCheck className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum agendamento hoje</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.todayAppointments.map((a: any) => (
              <div
                key={a.id}
                onClick={() => router.push("/dashboard/schedule")}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 cursor-pointer hover:bg-accent/50 active:scale-[0.99] transition-all"
              >
                <div className="shrink-0 w-12 text-center">
                  <p className="text-base font-bold tabular-nums leading-tight">{formatTime(a.date)}</p>
                </div>
                <div className="h-8 w-px bg-border shrink-0" />
                <AvatarInitials name={a.artist.name} color={a.artist.avatarColor} size={36} />
                <div className="min-w-0 flex-1">
                  {a.client ? (
                    <Link
                      href={`/dashboard/clients/${a.client.id}`}
                      className="text-sm font-semibold truncate block hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {a.client.name}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-muted-foreground">Bloqueado</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{a.service} · {a.artist.name}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══ ANÁLISES ══ */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-muted-foreground">Análises</h2>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker value={range} onChange={setRange} />
            {data.isAdmin && (
              <select
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
                className={SELECT_CLS}
                aria-label="Filtrar por tatuador"
              >
                <option value="">Todos os tatuadores</option>
                {data.artists.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Receita no Período" value={formatCurrency(data.kpis.revenue)} icon={DollarSign} change={data.kpis.revenueChange} variant="primary" href="/dashboard/finances" />
          <StatCard label="Agendamentos" value={String(data.kpis.appointments)} icon={CalendarCheck} change={data.kpis.appointmentsChange} href="/dashboard/schedule" />
          <StatCard label="Taxa de Conclusão" value={`${data.kpis.completionRate.toFixed(0)}%`} icon={CheckCircle} change={data.kpis.completionRateChange} href="/dashboard/schedule" />
          <StatCard label="Ticket Médio" value={formatCurrency(data.kpis.avgTicket)} icon={Receipt} change={data.kpis.avgTicketChange} href="/dashboard/finances" />
        </div>

        {/* Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Receita · {activeLabel}
              {data.isAdmin && artistId ? ` · ${data.artists.find((a: any) => a.id === artistId)?.name ?? ""}` : ""}
            </CardTitle>
            <Link href="/dashboard/finances" className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
              Ver financeiro <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent><RevenueChart data={data.monthlyRevenue} /></CardContent>
        </Card>

        {/* Ranking */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {data.isAdmin && !artistId ? "Ranking de Tatuadores" : "Desempenho do Tatuador"}
            </CardTitle>
            <div className="flex items-center gap-3">
              {data.isAdmin && artistId && (
                <button onClick={() => setArtistId("")} className="text-xs text-muted-foreground hover:text-foreground underline">
                  ← Todos
                </button>
              )}
              {data.isAdmin && !artistId && (
                <Link href="/dashboard/team" className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
                  Ver equipe <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
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
                    <TableRow
                      key={r.id}
                      className={cn("cursor-pointer transition-colors", r.id === artistId ? "bg-primary/5" : "hover:bg-accent/50")}
                      onClick={() => setArtistId(r.id === artistId ? "" : r.id)}
                    >
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
      </section>
    </div>
  )
}
