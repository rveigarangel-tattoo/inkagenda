"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, isSameDay } from "date-fns"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/ui/status-badge"
import { AppointmentSheet } from "@/components/forms/appointment-sheet"
import { formatCurrency, formatDate, formatTime } from "@/lib/utils"

export default function ArtistAgendaPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [items, setItems] = useState<any[] | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)

  const { from, to, days, label } = useMemo(() => {
    const base = addWeeks(new Date(), weekOffset)
    const from = startOfWeek(base, { weekStartsOn: 1 })
    const to = endOfWeek(base, { weekStartsOn: 1 })
    return {
      from,
      to,
      days: eachDayOfInterval({ start: from, end: to }),
      label: `${formatDate(from, "dd/MM")} - ${formatDate(to, "dd/MM/yyyy")}`,
    }
  }, [weekOffset])

  const fetchData = useCallback(() => {
    setItems(null)
    fetch(`/api/appointments?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]))
  }, [from, to])

  useEffect(() => { fetchData() }, [fetchData])

  function openNew() {
    setSelected(null)
    setSheetOpen(true)
  }
  function openEdit(a: any) {
    setSelected(a)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Minha Agenda</h1>
          <p className="text-sm text-muted-foreground">Seus agendamentos da semana</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{label}</span>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {weekOffset !== 0 && (
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Esta semana</Button>
        )}
      </div>

      {!items ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Nenhum agendamento nesta semana.
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {days.map((day) => {
            const dayItems = items
              .filter((a) => isSameDay(new Date(a.date), day))
              .sort((a, b) => +new Date(a.date) - +new Date(b.date))
            if (dayItems.length === 0) return null
            return (
              <div key={day.toISOString()} className="space-y-2">
                <h2 className="text-sm font-semibold capitalize text-muted-foreground">
                  {formatDate(day, "EEEE, dd/MM")}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dayItems.map((a) => (
                    <button key={a.id} onClick={() => openEdit(a)} className="text-left">
                      <Card className="transition-colors hover:border-primary/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{formatTime(a.date)}</span>
                            <StatusBadge status={a.status} />
                          </div>
                          <p className="mt-2 truncate font-medium">{a.client?.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{a.service}</p>
                          <p className="mt-1 text-sm text-primary">{formatCurrency(a.value ?? 0)}</p>
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AppointmentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        appointment={selected}
        isAdmin={false}
        onSaved={fetchData}
      />
    </div>
  )
}
