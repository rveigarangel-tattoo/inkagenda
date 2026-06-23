"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  addDays, startOfWeek, endOfWeek, format, isSameDay,
  startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths,
  startOfDay, endOfDay,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Lock, LockOpen, CalendarDays, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AppointmentSheet } from "@/components/forms/appointment-sheet"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn, formatCurrency, formatTime } from "@/lib/utils"
import { toast } from "sonner"
import type { Appointment } from "@/types"

const START_HOUR = 1
const END_HOUR = 24
const HOUR_HEIGHT = 60
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60
const SNAP = 15
const SCROLL_TARGET_HOUR = 8

function formatHour(h: number): string {
  const display = h >= 24 ? h - 24 : h
  return `${String(display).padStart(2, "0")}:00`
}
function minutesFromDate(d: Date) {
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes()
}
function topFromDate(d: Date) {
  return (minutesFromDate(d) / 60) * HOUR_HEIGHT
}
function durationToHeight(min: number) {
  return Math.max((min / 60) * HOUR_HEIGHT - 2, 18)
}
function snapMinutes(raw: number) {
  return Math.round(raw / SNAP) * SNAP
}
function yToMinutes(y: number) {
  return Math.max(0, Math.min(snapMinutes((y / HOUR_HEIGHT) * 60), TOTAL_MINUTES - SNAP))
}

// ─── hover popover ───────────────────────────────────────────────────────────
function ApptPopover({ appt, rect }: { appt: Appointment; rect: DOMRect }) {
  const color = appt.artist?.avatarColor ?? "#7c3aed"
  const winW = typeof window !== "undefined" ? window.innerWidth : 1440
  const winH = typeof window !== "undefined" ? window.innerHeight : 900
  const x = rect.right + 12 + 224 > winW ? rect.left - 224 - 8 : rect.right + 8
  const y = Math.max(8, Math.min(rect.top, winH - 200))
  return (
    <div
      className="pointer-events-none fixed z-50 w-56 rounded-xl border bg-card p-4 shadow-2xl text-xs"
      style={{ left: x, top: y }}
    >
      <div className="mb-3 flex items-start gap-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {appt.client?.name?.slice(0, 2).toUpperCase() ?? "??"}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-sm">{appt.client?.name ?? "—"}</p>
          <p className="truncate text-muted-foreground">{appt.client?.phone || appt.client?.email || "—"}</p>
        </div>
      </div>
      <div className="space-y-1 text-muted-foreground">
        {appt.style && (
          <div className="flex justify-between">
            <span>Estilo</span>
            <span className="text-foreground font-medium">{appt.style}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Duração</span>
          <span className="text-foreground font-medium">{appt.durationMinutes}min</span>
        </div>
        <div className="flex justify-between">
          <span>Valor</span>
          <span className="text-foreground font-medium">{formatCurrency(appt.value)}</span>
        </div>
      </div>
      <div className="mt-3 border-t pt-2">
        <StatusBadge status={appt.status} />
      </div>
    </div>
  )
}

// ─── appointment block ───────────────────────────────────────────────────────
interface BlockProps {
  appt: Appointment
  top: number
  height: number
  isDark: boolean
  draggingId: string | null
  onEdit: () => void
  onDragStart: (e: React.DragEvent, appt: Appointment, offsetY: number) => void
  onResizeStart: (e: React.PointerEvent, appt: Appointment) => void
  onHover: (appt: Appointment | null, rect?: DOMRect) => void
}

function AppointmentBlock({ appt, top, height, isDark, draggingId, onEdit, onDragStart, onResizeStart, onHover }: BlockProps) {
  const ref = useRef<HTMLDivElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>()
  const isBlocked = appt.status === "blocked"
  const isCompleted = appt.status === "completed"
  const isCancelled = appt.status === "cancelled" || appt.status === "no_show"
  const isDragging = draggingId === appt.id
  const color = appt.artist?.avatarColor ?? "#7c3aed"

  const bgColor = isBlocked ? undefined
    : isCompleted ? (isDark ? "#16a34a35" : "#16a34a22")
    : isCancelled ? (isDark ? "#71717a22" : "#71717a30")
    : `${color}${isDark ? "40" : "CC"}`

  const borderCol = isCompleted ? "#16a34a" : isCancelled ? "#71717a" : color

  return (
    <div
      ref={ref}
      draggable={!isBlocked && !isCancelled}
      onDragStart={isBlocked || isCancelled ? undefined : (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        onDragStart(e, appt, e.clientY - rect.top)
      }}
      onClick={(e) => { e.stopPropagation(); onEdit() }}
      onMouseEnter={() => {
        hoverTimer.current = setTimeout(() => {
          const rect = ref.current?.getBoundingClientRect()
          if (rect) onHover(appt, rect)
        }, 350)
      }}
      onMouseLeave={() => { clearTimeout(hoverTimer.current); onHover(null) }}
      className={cn(
        "absolute left-0.5 right-0.5 overflow-hidden rounded-md border-l-4 text-[11px] select-none transition-opacity",
        isBlocked ? "cursor-default" : "cursor-grab active:cursor-grabbing hover:brightness-110",
        isDragging && "opacity-30",
        isCancelled && "opacity-60"
      )}
      style={{
        top,
        height,
        borderColor: borderCol,
        color: isDark ? "white" : "black",
        backgroundColor: bgColor,
        backgroundImage: isBlocked
          ? `repeating-linear-gradient(45deg, ${color}${isDark ? "25" : "B0"} 0px, ${color}${isDark ? "25" : "B0"} 5px, transparent 5px, transparent 12px)`
          : undefined,
      }}
    >
      <div className="px-2 py-1 leading-tight">
        <p className={cn("font-semibold truncate", isCancelled && "line-through")}>
          {formatTime(appt.date)}
          {!isBlocked && appt.client ? ` · ${appt.client.name}` : isBlocked ? " Bloqueado" : ""}
        </p>
        {!isBlocked && <p className="truncate opacity-75">{appt.service}</p>}
      </div>
      {isCompleted && (
        <div className="absolute right-1 top-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
        </div>
      )}
      {isCancelled && (
        <div className="absolute right-1 top-1">
          <X className="h-3 w-3 text-gray-400" />
        </div>
      )}
      {!isBlocked && !isCancelled && (
        <div
          className="absolute bottom-0 left-0 right-0 flex h-3 cursor-ns-resize items-center justify-center"
          onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, appt) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-0.5 w-6 rounded-full bg-black/20 dark:bg-white/40" />
        </div>
      )}
    </div>
  )
}

// ─── calendar column ─────────────────────────────────────────────────────────
interface ColumnProps {
  appts: Appointment[]
  isToday: boolean
  isDark: boolean
  draggingId: string | null
  onCellClick: (minute: number) => void
  onDrop: (e: React.DragEvent, colEl: HTMLDivElement) => void
  onEdit: (a: Appointment) => void
  onDragStart: (e: React.DragEvent, a: Appointment, oy: number) => void
  onResizeStart: (e: React.PointerEvent, a: Appointment) => void
  onHover: (a: Appointment | null, rect?: DOMRect) => void
}

function CalendarColumn({ appts, isToday, isDark, draggingId, onCellClick, onDrop, onEdit, onDragStart, onResizeStart, onHover }: ColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const slots = useMemo(() => Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => i * 30), [])

  return (
    <div
      ref={ref}
      className={cn("relative border-l", isToday && "bg-primary/[0.03]")}
      style={{ height: TOTAL_MINUTES }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => ref.current && onDrop(e, ref.current)}
    >
      {slots.map((min) => (
        <div
          key={min}
          className={cn(
            "absolute left-0 right-0 cursor-pointer hover:bg-accent/30 transition-colors",
            min % 60 === 0 ? "border-t border-border/60" : "border-t border-border/25"
          )}
          style={{ top: (min / 60) * HOUR_HEIGHT, height: HOUR_HEIGHT / 2 }}
          onClick={() => onCellClick(min)}
        />
      ))}
      {appts.map((a) => {
        const start = new Date(a.date)
        if (minutesFromDate(start) < 0 || start.getHours() >= END_HOUR) return null
        return (
          <AppointmentBlock
            key={a.id}
            appt={a}
            top={topFromDate(start)}
            height={durationToHeight(a.durationMinutes)}
            isDark={isDark}
            draggingId={draggingId}
            onEdit={() => onEdit(a)}
            onDragStart={onDragStart}
            onResizeStart={onResizeStart}
            onHover={onHover}
          />
        )
      })}
    </div>
  )
}

// ─── month view ───────────────────────────────────────────────────────────────
interface MonthViewProps {
  monthStart: Date
  appointments: Appointment[]
  onEdit: (a: Appointment) => void
  onNewDay: (day: Date) => void
  onDayView: (day: Date) => void
}

function MonthView({ monthStart, appointments, onEdit, onNewDay, onDayView }: MonthViewProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const gridStart = startOfWeek(startOfMonth(monthStart), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

  const selectedAppts = selectedDay
    ? appointments.filter((a) => isSameDay(new Date(a.date), selectedDay) && a.status !== "blocked")
    : []

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* day-of-week headers */}
      <div className="grid grid-cols-7 gap-px text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {weekDays.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>

      {/* grid */}
      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border bg-border">
        {days.map((day) => {
          const isThisMonth = isSameMonth(day, monthStart)
          const isToday = isSameDay(day, new Date())
          const isSelected = selectedDay && isSameDay(day, selectedDay)
          const dayAppts = appointments.filter(
            (a) => isSameDay(new Date(a.date), day) && a.status !== "blocked"
          )

          return (
            <div
              key={day.toISOString()}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={cn(
                "bg-card min-h-[80px] cursor-pointer p-1.5 transition-colors",
                !isThisMonth && "bg-muted/30 text-muted-foreground",
                isSelected && "ring-2 ring-inset ring-primary",
                isToday && !isSelected && "bg-primary/5"
              )}
            >
              <div
                onClick={(e) => { e.stopPropagation(); onDayView(day) }}
                className={cn(
                  "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all",
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary/10"
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    onClick={(e) => { e.stopPropagation(); onEdit(a) }}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[10px] font-medium",
                      a.status === "cancelled" || a.status === "no_show"
                        ? "opacity-60 line-through text-foreground"
                        : "text-white"
                    )}
                    style={{
                      backgroundColor: a.status === "completed"
                        ? "#16a34a35"
                        : a.status === "cancelled" || a.status === "no_show"
                        ? "#71717a30"
                        : a.artist?.avatarColor ?? "#7c3aed",
                    }}
                  >
                    {formatTime(a.date)} {a.client?.name ?? a.service}{a.status === "completed" ? " ✓" : ""}
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">+{dayAppts.length - 3} mais</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* selected day detail */}
      {selectedDay && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold capitalize">
              {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <Button size="sm" onClick={() => onNewDay(selectedDay)}>
              <Plus className="mr-1 h-4 w-4" /> Novo
            </Button>
          </div>
          {selectedAppts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum agendamento neste dia.</p>
          ) : (
            <div className="space-y-2">
              {selectedAppts
                .sort((a, b) => +new Date(a.date) - +new Date(b.date))
                .map((a) => (
                  <div
                    key={a.id}
                    onClick={() => onEdit(a)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 hover:bg-accent/50 transition-colors"
                  >
                    <span className="w-10 shrink-0 text-xs font-semibold text-primary">{formatTime(a.date)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.client?.name ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.service}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────
type ViewMode = "week" | "month" | "day"

export default function ArtistAgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()))
  const [dayDate, setDayDate] = useState(() => new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [blockMode, setBlockMode] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>()
  const [hoverState, setHoverState] = useState<{ appt: Appointment; rect: DOMRect } | null>(null)

  const gridScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (viewMode !== "month") {
      const target = (SCROLL_TARGET_HOUR - START_HOUR) * HOUR_HEIGHT - 40
      gridScrollRef.current?.scrollTo({ top: Math.max(0, target), behavior: "smooth" })
    }
  }, [viewMode])

  const dragData = useRef<{ apptId: string; offsetY: number } | null>(null)
  const resizeData = useRef<{ apptId: string; startY: number; startDuration: number } | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [resizeHeight, setResizeHeight] = useState(0)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const hours = useMemo(() => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i), [])

  function load() {
    setLoading(true)
    let from: string, to: string
    if (viewMode === "month") {
      const ms = startOfWeek(startOfMonth(monthStart), { weekStartsOn: 1 })
      const me = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 })
      from = ms.toISOString()
      to = me.toISOString()
    } else if (viewMode === "day") {
      from = startOfDay(dayDate).toISOString()
      to = endOfDay(dayDate).toISOString()
    } else {
      from = weekStart.toISOString()
      to = endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString()
    }
    fetch(`/api/appointments?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setAppointments(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [weekStart, monthStart, dayDate, viewMode])

  // pointer resize events
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!resizeData.current) return
      const delta = e.clientY - resizeData.current.startY
      const newDur = Math.max(SNAP, snapMinutes(resizeData.current.startDuration + (delta / HOUR_HEIGHT) * 60))
      setResizeHeight(durationToHeight(newDur))
    }
    async function onUp(e: PointerEvent) {
      if (!resizeData.current) return
      const { apptId, startY, startDuration } = resizeData.current
      const delta = e.clientY - startY
      const newDur = Math.max(SNAP, snapMinutes(startDuration + (delta / HOUR_HEIGHT) * 60))
      setResizingId(null)
      resizeData.current = null
      try {
        const res = await fetch(`/api/appointments/${apptId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ durationMinutes: newDur }),
        })
        if (!res.ok) throw new Error()
        load()
        toast.success("Duração atualizada")
      } catch {
        toast.error("Erro ao atualizar duração")
      }
    }
    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
    return () => {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
    }
  }, [appointments])

  function startResize(e: React.PointerEvent, appt: Appointment) {
    e.preventDefault()
    resizeData.current = { apptId: appt.id, startY: e.clientY, startDuration: appt.durationMinutes }
    setResizingId(appt.id)
    setResizeHeight(durationToHeight(appt.durationMinutes))
  }

  function handleDragStart(e: React.DragEvent, appt: Appointment, offsetY: number) {
    dragData.current = { apptId: appt.id, offsetY }
    setDraggingId(appt.id)
    e.dataTransfer.effectAllowed = "move"
  }

  async function handleDrop(e: React.DragEvent, colEl: HTMLDivElement, newDate: Date) {
    e.preventDefault()
    if (!dragData.current) return
    const { apptId, offsetY } = dragData.current
    dragData.current = null
    setDraggingId(null)
    const rect = colEl.getBoundingClientRect()
    const minutes = yToMinutes(Math.max(0, e.clientY - rect.top - offsetY))
    const result = new Date(newDate)
    result.setHours(START_HOUR + Math.floor(minutes / 60), minutes % 60, 0, 0)
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: result.toISOString() }),
      })
      if (!res.ok) throw new Error()
      load()
      toast.success("Agendamento movido")
    } catch {
      toast.error("Erro ao mover agendamento")
    }
  }

  async function createBlock(date: Date, minute: number) {
    const d = new Date(date)
    d.setHours(START_HOUR + Math.floor(minute / 60), minute % 60, 0, 0)
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: "Bloqueio", status: "blocked", value: 0, deposit: 0, date: d.toISOString(), durationMinutes: 60 }),
      })
      if (!res.ok) throw new Error()
      load()
      toast.success("Horário bloqueado")
    } catch {
      toast.error("Erro ao bloquear horário")
    }
  }

  function openNew(date: Date, minute: number) {
    if (blockMode) { createBlock(date, minute); return }
    const d = new Date(date)
    d.setHours(START_HOUR + Math.floor(minute / 60), minute % 60, 0, 0)
    setSelected(null)
    setDefaultDate(d)
    setSheetOpen(true)
  }

  function openNewFromDay(day: Date) {
    setSelected(null)
    setDefaultDate(day)
    setSheetOpen(true)
  }

  function openEdit(a: Appointment) {
    if (a.status === "blocked") return
    setSelected(a)
    setSheetOpen(true)
  }

  function handleHover(appt: Appointment | null, rect?: DOMRect) {
    setHoverState(appt && rect ? { appt, rect } : null)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card p-3 shrink-0">
        {/* view toggle */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setViewMode("week")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors", viewMode === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={cn("flex items-center gap-1.5 border-l px-3 py-1.5 text-sm transition-colors", viewMode === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            Dia
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={cn("flex items-center gap-1.5 border-l px-3 py-1.5 text-sm transition-colors", viewMode === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Mês
          </button>
        </div>

        {/* navigation */}
        {viewMode === "month" ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setMonthStart(addMonths(monthStart, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium capitalize">
              {format(monthStart, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={() => setMonthStart(addMonths(monthStart, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMonthStart(startOfMonth(new Date()))}>Hoje</Button>
            <Button size="sm" onClick={() => { setSelected(null); setDefaultDate(new Date()); setSheetOpen(true) }}>
              <Plus className="mr-1 h-4 w-4" /> Novo
            </Button>
          </div>
        ) : viewMode === "day" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBlockMode((b) => !b)}
              title={blockMode ? "Sair do modo bloqueio" : "Bloquear horário"}
              className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors", blockMode ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400" : "text-muted-foreground hover:text-foreground")}
            >
              {blockMode ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
              {blockMode ? "Bloqueando" : "Bloquear"}
            </button>
            <Button variant="outline" size="icon" onClick={() => setDayDate(addDays(dayDate, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[160px] text-center text-sm font-medium capitalize">
              {format(dayDate, "EEE, dd 'de' MMM", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={() => setDayDate(addDays(dayDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDayDate(new Date())}>Hoje</Button>
            <Button size="sm" onClick={() => openNew(dayDate, 9 * 60 - START_HOUR * 60)}>
              <Plus className="mr-1 h-4 w-4" /> Novo
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBlockMode((b) => !b)}
              title={blockMode ? "Sair do modo bloqueio" : "Bloquear horário (clique num slot vazio)"}
              className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors", blockMode ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400" : "text-muted-foreground hover:text-foreground")}
            >
              {blockMode ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
              {blockMode ? "Bloqueando" : "Bloquear"}
            </button>
            <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[160px] text-center text-sm font-medium">
              {format(weekStart, "dd MMM", { locale: ptBR })} — {format(addDays(weekStart, 6), "dd MMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Hoje</Button>
            <Button size="sm" onClick={() => openNew(new Date(), 9 * 60 - START_HOUR * 60)}>
              <Plus className="mr-1 h-4 w-4" /> Novo
            </Button>
          </div>
        )}
      </div>

      {/* calendar content */}
      <div ref={gridScrollRef} className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4"><Skeleton className="h-[600px] w-full" /></div>
        ) : viewMode === "month" ? (
          <MonthView
            monthStart={monthStart}
            appointments={appointments}
            onEdit={openEdit}
            onNewDay={openNewFromDay}
            onDayView={(date) => { setDayDate(date); setViewMode("day") }}
          />
        ) : (
          <div className={viewMode !== "day" ? "min-w-[640px]" : ""}>
            {/* column headers */}
            <div className="sticky top-0 z-20 flex border-b bg-card">
              <div className="shrink-0 sticky left-0 z-20 bg-card" style={{ width: 52 }} />
              {(viewMode === "day" ? [dayDate] : days).map((day) => {
                const isToday = isSameDay(day, new Date())
                const label = format(day, "EEE dd", { locale: ptBR })
                const [dayName, dayNum] = [label.split(" ")[0], label.split(" ").pop()]
                return (
                  <div
                    key={day.toISOString()}
                    onClick={viewMode === "week" ? () => { setDayDate(day); setViewMode("day") } : undefined}
                    className={cn(
                      "flex-1 border-l py-2 text-center text-xs",
                      isToday && "text-primary",
                      viewMode === "week" && "cursor-pointer hover:bg-accent/40 transition-colors select-none"
                    )}
                  >
                    <p className="uppercase text-muted-foreground">{dayName.slice(0, 3)}</p>
                    <p className={cn("text-base font-semibold", isToday && "text-primary")}>{dayNum}</p>
                  </div>
                )
              })}
            </div>

            {/* time gutter + columns */}
            <div className="flex pt-2">
              <div className="shrink-0 sticky left-0 z-10 bg-card" style={{ width: 52 }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="relative pr-2 text-right text-[11px] text-muted-foreground"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <span className="absolute -top-2 right-2">{formatHour(h)}</span>
                  </div>
                ))}
              </div>

              {(viewMode === "day" ? [dayDate] : days).map((day) => {
                const isToday = isSameDay(day, new Date())
                const dayAppts = appointments.filter((a) => isSameDay(new Date(a.date), day))
                return (
                  <div key={day.toISOString()} className="flex-1 min-w-0" onDragEnd={() => setDraggingId(null)}>
                    <CalendarColumn
                      appts={resizingId
                        ? dayAppts.map((a) => a.id === resizingId ? { ...a, durationMinutes: Math.round((resizeHeight / HOUR_HEIGHT) * 60) } : a)
                        : dayAppts
                      }
                      isToday={isToday}
                      isDark={isDark}
                      draggingId={draggingId}
                      onCellClick={(min) => openNew(day, min)}
                      onDrop={(e, el) => handleDrop(e, el, day)}
                      onEdit={openEdit}
                      onDragStart={handleDragStart}
                      onResizeStart={startResize}
                      onHover={handleHover}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {hoverState && <ApptPopover appt={hoverState.appt} rect={hoverState.rect} />}

      <AppointmentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        appointment={selected}
        defaultDate={defaultDate}
        isAdmin={false}
        onSaved={load}
      />
    </div>
  )
}
