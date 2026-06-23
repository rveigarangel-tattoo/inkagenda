"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { addDays, format, parseISO, startOfMonth, startOfWeek } from "date-fns"
import { DollarSign, Percent, Wallet, CheckCircle, Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

type DateRange = { from: string; to: string }

const PRESETS: { label: string; get: () => DateRange }[] = [
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
  {
    label: "Últimos 7 dias",
    get: () => ({ from: format(addDays(new Date(), -6), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }),
  },
  {
    label: "Últimos 30 dias",
    get: () => ({ from: format(addDays(new Date(), -29), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }),
  },
]

function getPresetLabel(range: DateRange): string {
  for (const p of PRESETS) {
    const r = p.get()
    if (r.from === range.from && r.to === range.to) return p.label
  }
  return "Personalizado"
}

function displayDate(str: string) {
  try { return format(parseISO(str), "dd/MM/yyyy") } catch { return str }
}

function PeriodPicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
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

  const label = getPresetLabel(value)
  const todayStr = format(new Date(), "yyyy-MM-dd")

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm hover:border-primary/50 transition-colors"
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {displayDate(value.from)} — {displayDate(value.to)}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[min(288px,calc(100vw-2rem))] rounded-xl border bg-card p-4 shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Período</p>
          <div className="mb-3 flex flex-col gap-1.5">
            {PRESETS.map((p) => {
              const r = p.get()
              const active = r.from === value.from && r.to === value.to
              return (
                <button
                  key={p.label}
                  onClick={() => { onChange(p.get()); setOpen(false) }}
                  className={cn(
                    "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    active ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                  )}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personalizado</p>
          <div className="flex gap-2">
            <Input type="date" value={draft.from} max={todayStr}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} />
            <Input type="date" value={draft.to} max={todayStr}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} />
          </div>
          <Button className="mt-2 w-full" size="sm"
            disabled={!draft.from || !draft.to || draft.from > draft.to}
            onClick={() => { onChange(draft); setOpen(false) }}>
            Aplicar
          </Button>
        </div>
      )}
    </div>
  )
}

export default function ArtistEarningsPage() {
  const [range, setRange] = useState<DateRange>(() => PRESETS[0].get())
  const [commissionPct, setCommissionPct] = useState<number>(50)
  const [appointments, setAppointments] = useState<any[] | null>(null)

  useEffect(() => {
    fetch("/api/artist/dashboard")
      .then((r) => r.json())
      .then((d) => setCommissionPct(d.kpis.commissionPct ?? 50))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setAppointments(null)
    const from = new Date(range.from)
    const to = new Date(range.to)
    to.setHours(23, 59, 59, 999)
    fetch(`/api/appointments?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then(setAppointments)
      .catch(() => setAppointments([]))
  }, [range])

  const completed = useMemo(
    () => (appointments ?? []).filter((a) => a.status === "completed"),
    [appointments]
  )
  const totals = useMemo(() => {
    const revenue = completed.reduce((s, a) => s + (a.value ?? 0), 0)
    const share = revenue * (commissionPct / 100)
    return { revenue, share }
  }, [completed, commissionPct])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Ganhos</h1>
          <p className="text-sm text-muted-foreground">Comissões e faturamento por período</p>
        </div>
        <PeriodPicker value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receita Gerada" value={formatCurrency(totals.revenue)} icon={DollarSign} />
        <StatCard label="Comissão" value={`${commissionPct}%`} icon={Percent} />
        <StatCard label="Meus Ganhos" value={formatCurrency(totals.share)} icon={Wallet} />
        <StatCard label="Sessões Concluídas" value={String(completed.length)} icon={CheckCircle} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Sessões Concluídas
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {displayDate(range.from)} — {displayDate(range.to)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!appointments ? (
            <Skeleton className="h-40" />
          ) : completed.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma sessão concluída no período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Serviço</TableHead>
                    <TableHead className="text-right w-28">Valor</TableHead>
                    <TableHead className="text-right w-28">Minha Parte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completed
                    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                    .map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{formatDate(a.date, "dd/MM/yyyy")}</TableCell>
                        <TableCell>{a.client?.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{a.service}</TableCell>
                        <TableCell className="text-right">{formatCurrency(a.value ?? 0)}</TableCell>
                        <TableCell className="text-right text-primary">
                          {formatCurrency((a.value ?? 0) * (commissionPct / 100))}
                        </TableCell>
                      </TableRow>
                    ))}
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="hidden sm:table-cell" />
                    <TableCell className="hidden sm:table-cell" />
                    <TableCell className="text-right font-semibold">{formatCurrency(totals.revenue)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatCurrency(totals.share)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
