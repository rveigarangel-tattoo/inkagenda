"use client"
import { useEffect, useMemo, useState } from "react"
import { addDays, startOfWeek, endOfWeek, format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AppointmentSheet } from "@/components/forms/appointment-sheet"
import { cn, formatTime } from "@/lib/utils"
import type { Appointment, User } from "@/types"

const START_HOUR = 8
const END_HOUR = 22
const HOUR_HEIGHT = 56

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [artists, setArtists] = useState<User[]>([])
  const [artistFilter, setArtistFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>()

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const hours = useMemo(() => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i), [])

  function load() {
    setLoading(true)
    const from = weekStart.toISOString()
    const to = endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString()
    const q = artistFilter !== "all" ? `&artistId=${artistFilter}` : ""
    fetch(`/api/appointments?from=${from}&to=${to}${q}`)
      .then((r) => r.json())
      .then((d) => setAppointments(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [weekStart, artistFilter])
  useEffect(() => { fetch("/api/team").then((r) => r.json()).then(setArtists).catch(() => {}) }, [])

  function openNew(day?: Date, hour?: number) {
    const d = day ? new Date(day) : new Date()
    if (hour !== undefined) d.setHours(hour, 0, 0, 0)
    setSelected(null)
    setDefaultDate(d)
    setSheetOpen(true)
  }
  function openEdit(a: Appointment) {
    setSelected(a)
    setSheetOpen(true)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {format(weekStart, "dd MMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "dd MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={artistFilter} onValueChange={setArtistFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Tatuador" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tatuadores</SelectItem>
              {artists.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Hoje</Button>
          <Button onClick={() => openNew()}><Plus className="h-4 w-4" /> Novo Agendamento</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : (
          <div className="min-w-[820px]">
            <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div />
              {days.map((d) => {
                const today = isSameDay(d, new Date())
                return (
                  <div key={d.toISOString()} className={cn("border-b p-2 text-center", today && "text-primary")}>
                    <p className="text-xs uppercase text-muted-foreground">{format(d, "EEE", { locale: ptBR })}</p>
                    <p className={cn("text-lg font-semibold", today && "text-primary")}>{format(d, "dd")}</p>
                  </div>
                )
              })}
            </div>
            <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div>
                {hours.map((h) => (
                  <div key={h} className="relative text-right pr-2 text-xs text-muted-foreground" style={{ height: HOUR_HEIGHT }}>
                    <span className="absolute -top-2 right-2">{String(h).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>
              {days.map((day) => {
                const dayAppts = appointments.filter((a) => isSameDay(new Date(a.date), day))
                return (
                  <div key={day.toISOString()} className="relative border-l">
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="border-b border-border/50 hover:bg-accent/30 cursor-pointer"
                        style={{ height: HOUR_HEIGHT }}
                        onClick={() => openNew(day, h)}
                      />
                    ))}
                    {dayAppts.map((a) => {
                      const start = new Date(a.date)
                      const offsetMin = (start.getHours() - START_HOUR) * 60 + start.getMinutes()
                      const top = (offsetMin / 60) * HOUR_HEIGHT
                      const height = Math.max((a.durationMinutes / 60) * HOUR_HEIGHT - 2, 24)
                      const color = a.artist?.avatarColor ?? "#7c3aed"
                      if (offsetMin < 0 || start.getHours() >= END_HOUR) return null
                      return (
                        <button
                          key={a.id}
                          onClick={(e) => { e.stopPropagation(); openEdit(a) }}
                          className="absolute left-1 right-1 overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs text-white"
                          style={{ top, height, backgroundColor: `${color}33`, borderColor: color }}
                        >
                          <p className="font-semibold leading-tight">{formatTime(a.date)} {a.client?.name}</p>
                          <p className="truncate opacity-80">{a.service}</p>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <AppointmentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        appointment={selected}
        defaultDate={defaultDate}
        isAdmin
        onSaved={load}
      />
    </div>
  )
}
