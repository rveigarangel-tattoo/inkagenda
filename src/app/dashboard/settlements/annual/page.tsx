"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { formatCurrency, cn } from "@/lib/utils"

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

type Metric = "totalGross" | "artistAmount" | "studioAmount" | "sessionsCount"

const METRICS: { key: Metric; label: string; format: (v: number) => string }[] = [
  { key: "totalGross",    label: "Bruto",    format: formatCurrency },
  { key: "artistAmount",  label: "Repasse",  format: formatCurrency },
  { key: "studioAmount",  label: "Estúdio",  format: formatCurrency },
  { key: "sessionsCount", label: "Sessões",  format: (v) => String(v) },
]

function heatClass(intensity: number): string {
  if (intensity <= 0)   return ""
  if (intensity < 0.2)  return "bg-primary/5"
  if (intensity < 0.4)  return "bg-primary/10"
  if (intensity < 0.6)  return "bg-primary/20"
  if (intensity < 0.8)  return "bg-primary/30"
  return "bg-primary/40"
}

function exportCSV(data: any, metric: Metric, year: number) {
  const fmt = METRICS.find((m) => m.key === metric)!.format
  const rows: string[][] = []

  // Header
  rows.push(["Tatuador", ...MONTHS, "Total Ano"])

  // Artist rows
  for (const artist of data.artists) {
    const row = [artist.name]
    for (let m = 1; m <= 12; m++) {
      const val = artist.months[m]?.[metric] ?? 0
      row.push(metric === "sessionsCount" ? String(val) : String(val.toFixed(2)).replace(".", ","))
    }
    const total = artist.annual[metric]
    row.push(metric === "sessionsCount" ? String(total) : String(total.toFixed(2)).replace(".", ","))
    rows.push(row)
  }

  // Totals row
  const totRow = ["TOTAL"]
  for (let m = 1; m <= 12; m++) {
    const val = data.monthlyTotals[m]?.[metric] ?? 0
    totRow.push(metric === "sessionsCount" ? String(val) : String(val.toFixed(2)).replace(".", ","))
  }
  const annualVal = data.annualTotal[metric]
  totRow.push(metric === "sessionsCount" ? String(annualVal) : String(annualVal.toFixed(2)).replace(".", ","))
  rows.push(totRow)

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `acertos_${year}_${metric}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AnnualSettlementsPage() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear]       = useState(new Date().getFullYear())
  const [metric, setMetric]   = useState<Metric>("artistAmount")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/settlements/annual?year=${year}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [year])

  // Compute max cell value for heat map scaling
  const maxCellValue = (() => {
    if (!data) return 1
    let max = 0
    for (const artist of data.artists) {
      for (let m = 1; m <= 12; m++) {
        const v = artist.months[m]?.[metric] ?? 0
        if (v > max) max = v
      }
    }
    return max || 1
  })()

  const fmt = METRICS.find((m) => m.key === metric)!.format

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/settlements">
            <Button size="icon" variant="ghost" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Visão Anual de Acertos</h1>
            <p className="text-sm text-muted-foreground">Comparativo mês a mês por tatuador</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            {(data?.availableYears ?? [year]).map((y: number) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Export */}
          {data && data.artists.length > 0 && (
            <Button
              size="sm" variant="outline"
              onClick={() => exportCSV(data, metric, year)}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Metric toggle */}
      <div className="flex gap-1 rounded-xl border bg-muted/30 p-1 w-fit">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              metric === m.key
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      ) : !data || data.artists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 gap-2">
          <p className="text-sm text-muted-foreground">
            Nenhum acerto fechado em {year}.
          </p>
          <Link href="/dashboard/settlements">
            <Button variant="link" size="sm">← Ir para Acertos</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              {/* thead */}
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left font-semibold min-w-[140px] whitespace-nowrap">
                    Tatuador
                  </th>
                  {MONTHS.map((m, i) => {
                    const hasData = data.monthlyTotals[i + 1] !== undefined
                    return (
                      <th
                        key={m}
                        className={cn(
                          "px-3 py-3 text-center font-medium whitespace-nowrap min-w-[90px]",
                          hasData ? "text-foreground" : "text-muted-foreground/50"
                        )}
                      >
                        {m}
                      </th>
                    )
                  })}
                  <th className="px-4 py-3 text-right font-semibold whitespace-nowrap min-w-[110px] bg-muted/60">
                    Total Ano
                  </th>
                </tr>
              </thead>

              {/* tbody */}
              <tbody>
                {data.artists.map((artist: any, ai: number) => (
                  <tr
                    key={artist.id}
                    className={cn(
                      "border-b transition-colors hover:bg-accent/20",
                      ai % 2 === 1 && "bg-muted/10"
                    )}
                  >
                    {/* Artist name — sticky */}
                    <td className={cn(
                      "sticky left-0 z-10 px-4 py-3 font-medium",
                      ai % 2 === 1 ? "bg-muted/10" : "bg-card"
                    )}>
                      <div className="flex items-center gap-2">
                        <AvatarInitials name={artist.name} color={artist.avatarColor} size={28} />
                        <span className="truncate max-w-[90px]">{artist.name}</span>
                      </div>
                    </td>

                    {/* Month cells */}
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const cell = artist.months[m]
                      const val = cell?.[metric] ?? 0
                      const intensity = val / maxCellValue
                      return (
                        <td
                          key={m}
                          className={cn(
                            "px-3 py-3 text-center tabular-nums transition-colors",
                            val > 0 ? heatClass(intensity) : ""
                          )}
                        >
                          {val > 0 ? (
                            <span className={cn("font-medium", val > 0 && intensity >= 0.6 ? "text-primary" : "")}>
                              {fmt(val)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      )
                    })}

                    {/* Annual total */}
                    <td className="px-4 py-3 text-right font-bold tabular-nums bg-muted/20 whitespace-nowrap">
                      {fmt(artist.annual[metric])}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* tfoot — totals */}
              <tfoot>
                <tr className="border-t-2 bg-muted/40 font-semibold">
                  <td className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">
                    Total
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const val = data.monthlyTotals[m]?.[metric] ?? 0
                    return (
                      <td key={m} className="px-3 py-3 text-center tabular-nums">
                        {val > 0 ? fmt(val) : <span className="text-muted-foreground/30">—</span>}
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-right tabular-nums bg-muted/60 text-primary whitespace-nowrap">
                    {fmt(data.annualTotal[metric])}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      {data && data.artists.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Intensidade:</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
            <span key={v} className={cn("inline-block h-4 w-8 rounded", heatClass(v))} />
          ))}
          <span>← menor → maior</span>
        </div>
      )}

      {/* Note about data source */}
      <p className="text-xs text-muted-foreground">
        Inclui apenas acertos <strong>fechados</strong> e <strong>pagos</strong>. Períodos em aberto não aparecem aqui.
        Os valores de Repasse já incluem ajustes manuais aplicados a cada acerto.
      </p>
    </div>
  )
}
