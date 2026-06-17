"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { addDays, startOfWeek, endOfWeek, format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Lock, LockOpen, Users, Calendar as CalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AppointmentSheet } from "@/components/forms/appointment-sheet"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn, formatCurrency, formatTime } from "@/lib/utils"
import { toast } from "sonner"
import type { Appointment, User } from "@/types"

const START_HOUR = 8
const END_HOUR = 22
const HOUR_HEIGHT = 60 // px per hour (= 1px per min)
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60
const SNAP = 15 // snap to 15-min increments

type ViewMode = "week" | "team"

// ─── helpers ────────────────────────────────────────────────────────────────
function minutesFromDate(d: Date): number {
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes()
}
function topFromDate(d: Date): number {
  return (minutesFromDate(d) / 60) * HOUR_HEIGHT
}
function durationToHeight(min: number): number {
  return Math.max((min / 60) * HOUR_HEIGHT - 2, 18)
}
function snapMinutes(rawMin: number): number {
  return Math.round(rawMin / SNAP) * SNAP
}
function yToMinutes(y: number): number {
  const raw = (y / HOUR_HEIGHT) * 60
  return Math.max(0, Math.min(snapMinutes(raw), TOTAL_MINUTES - SNAP))
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: color }}>
          {appt.client?.name?.slice(0, 2).toUpperCase() ?? "??"}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-sm">{appt.client?.name ?? "—"}</p>
          <p className="truncate text-muted-foreground">{appt.client?.phone || appt.client?.email || "—"}</p>
        </div>
      </div>
      <div className="space-y-1 text-muted-foreground">
        {appt.style && <div className="flex justify-between"><span>Estilo</span><span className="text-foreground font-medium">{appt.style}</span></div>}
        <div className="flex justify-between"><span>Duração</span><span className="text-foreground font-medium">{appt.durationMinutes}min</span></div>
        <div className="flex justify-between"><span>Valor</span><span className="text-foreground font-medium">{formatCurrency(appt.value)}</span></div>
        <div className="flex justify-between"><span>Artista</span><span className="text-foreground font-medium">{appt.artist?.name}</span></div>
      </div>
      <div className="mt-3 border-t pt-2">
        <StatusBadge status={appt.status} />
      </div>
    </div>
  )
}

// ─── appointment block (drag + resize + hover) ───────────────────────────────
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
  const isDragging = draggingId === appt.id
  const color = appt.artist?.avatarColor ?? "#7c3aed"

  return (
    <div
      ref={ref}
      draggable={!isBlocked}
      onDragStart={isBlocked ? undefined : (e) => {
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
        isDragging && "opacity-30"
      )}
      style={{
        top,
        height,
        borderColor: color,
        color: isDark ? "white" : "black",
        backgroundColor: isBlocked
          ? undefined
          : `${color}${isDark ? "40" : "CC"}`,
        backgroundImage: isBlocked
          ? `repeating-linear-gradient(45deg, ${color}${isDark ? "25" : "B0"} 0px, ${color}${isDark ? "25" : "B0"} 5px, transparent 5px, transparent 12px)`
          : undefined,
        borderLeftColor: color,
      }}
    >
      <div className="px-2 py-1 leading-tight">
        <p className="font-semibold truncate">
          {formatTime(appt.date)}{!isBlocked && appt.client ? ` · ${appt.client.name}` : isBlocked ? " Bloqueado" : ""}
        </p>
        {!isBlocked && <p className="truncate opacity-75">{appt.service}</p>}
      </div>
      {/* Resize handle */}
      {!isBlocked && (
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

// ─── day/artist column ───────────────────────────────────────────────────────
interface ColumnProps {
  appts: Appointment[]
  isToday?: boolean
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
      {/* 30-min slot lines */}
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

      {/* Appointment blocks */}
      {appts.map((a) => {
        const start = new Date(a.date)
        const minFromStart = minutesFromDate(start)
        if (minFromStart < 0 || start.getHours() >= END_HOUR) return null
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

// ─── main page ───────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [teamDay, setTeamDay] = useState(() => new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [artists, setArtists] = useState<User[]>([])
  const [artistFilter, setArtistFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("week")
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

  // drag state
  const dragData = useRef<{ apptId: string; offsetY: number } | null>(null)
  // resize state
  const resizeData = useRef<{ apptId: string; startY: number; startDuration: number; startDate: string } | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [resizeHeight, setResizeHeight] = useState(0)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const hours = useMemo(() => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i), [])

  function load() {
    setLoading(true)
    const useDay = viewMode === "team" ? teamDay : weekStart
    const from = viewMode === "team"
      ? new Date(teamDay.getFullYear(), teamDay.getMonth(), teamDay.getDate(), 0, 0, 0).toISOString()
      : weekStart.toISOString()
    const to = viewMode === "team"
      ? new Date(teamDay.getFullYear(), teamDay.getMonth(), teamDay.getDate(), 23, 59, 59).toISOString()
      : endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString()
    const q = artistFilter !== "all" ? `&artistId=${artistFilter}` : ""
    fetch(`/api/appointments?from=${from}&to=${to}${q}`)
      .then((r) => r.json())
      .then((d) => setAppointments(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [weekStart, teamDay, artistFilter, viewMode])
  useEffect(() => { fetch("/api/team").then((r) => r.json()).then(setArtists).catch(() => {}) }, [])

  // resize pointer events
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!resizeData.current) return
      const { startY, startDuration } = resizeData.current
      const delta = e.clientY - startY
      const deltaMins = (delta / HOUR_HEIGHT) * 60
      const newDuration = Math.max(SNAP, snapMinutes(startDuration + deltaMins))
      setResizeHeight(durationToHeight(newDuration))
    }
    async function onUp(e: PointerEvent) {
      if (!resizeData.current) return
      const { apptId, startY, startDuration } = resizeData.current
      const delta = e.clientY - startY
      const deltaMins = (delta / HOUR_HEIGHT) * 60
      const newDuration = Math.max(SNAP, snapMinutes(startDuration + deltaMins))
      setResizingId(null)
      resizeData.current = null
      try {
        const res = await fetch(`/api/appointments/${apptId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ durationMinutes: newDuration }),
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
    return () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp) }
  }, [appointments])

  function startResize(e: React.PointerEvent, appt: Appointment) {
    e.preventDefault()
    resizeData.current = { apptId: appt.id, startY: e.clientY, startDuration: appt.durationMinutes, startDate: appt.date }
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
    const colRect = colEl.getBoundingClientRect()
    const y = Math.max(0, e.clientY - colRect.top - offsetY)
    const minutes = yToMinutes(y)
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

  async function createBlock(date: Date, minute: number, artistId: string) {
    const blockDate = new Date(date)
    blockDate.setHours(START_HOUR + Math.floor(minute / 60), minute % 60, 0, 0)
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId,
          service: "Bloqueio",
          status: "blocked",
          value: 0,
          deposit: 0,
          date: blockDate.toISOString(),
          durationMinutes: 60,
        }),
      })
      if (!res.ok) throw new Error()
      load()
      toast.success("Horário bloqueado")
    } catch {
      toast.error("Erro ao bloquear horário")
    }
  }

  function openNew(date: Date, minute: number, artistId?: string) {
    if (blockMode && artistId) {
      createBlock(date, minute, artistId)
      return
    }
    const d = new Date(date)
    d.setHours(START_HOUR + Math.floor(minute / 60), minute % 60, 0, 0)
    setSelected(null)
    setDefaultDate(d)
    setSheetOpen(true)
  }

  function openEdit(a: Appointment) {
    if (a.status === "blocked") return
    setSelected(a)
    setSheetOpen(true)
  }

  function handleHover(appt: Appointment | null, rect?: DOMRect) {
    if (!appt || !rect) setHoverState(null)
    else setHoverState({ appt, rect })
  }

  // ── columns for each view ─────────────────────────────────────────────────
  const weekColumns = days.map((day) => ({
    key: day.toISOString(),
    date: day,
    label: format(day, "EEE dd", { locale: ptBR }),
    isToday: isSameDay(day, new Date()),
    appts: appointments.filter((a) => isSameDay(new Date(a.date), day)),
    artistId: undefined as string | undefined,
  }))

  const teamColumns = artists.map((artist) => ({
    key: artist.id,
    date: teamDay,
    label: artist.name,
    isToday: false,
    appts: appointments.filter((a) => a.artistId === artist.id && isSameDay(new Date(a.date), teamDay)),
    artistId: artist.id,
    color: artist.avatarColor,
  }))

  const columns = viewMode === "week" ? weekColumns : teamColumns

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── toolbar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card p-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button onClick={() => setViewMode("week")} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors", viewMode === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              <CalIcon className="h-3.5 w-3.5" /> Semana
            </button>
            <button onClick={() => setViewMode("team")} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l", viewMode === "team" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Users className="h-3.5 w-3.5" /> Equipe
            </button>
          </div>
          {/* Block mode */}
          <button
            onClick={() => setBlockMode((b) => !b)}
            title={blockMode ? "Sair do modo bloqueio" : "Bloquear horário (clique num slot vazio)"}
            className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors", blockMode ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400" : "text-muted-foreground hover:text-foreground")}
          >
            {blockMode ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
            {blockMode ? "Bloqueando" : "Bloquear"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {viewMode === "week" ? (
            <>
              <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium min-w-[160px] text-center">
                {format(weekStart, "dd MMM", { locale: ptBR })} — {format(addDays(weekStart, 6), "dd MMM yyyy", { locale: ptBR })}
              </span>
              <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Hoje</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon" onClick={() => setTeamDay(addDays(teamDay, -1))}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium min-w-[140px] text-center capitalize">
                {format(teamDay, "EEEE, dd/MM", { locale: ptBR })}
              </span>
              <Button variant="outline" size="icon" onClick={() => setTeamDay(addDays(teamDay, 1))}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setTeamDay(new Date())}>Hoje</Button>
            </>
          )}
          {viewMode === "week" && (
            <Select value={artistFilter} onValueChange={setArtistFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Tatuador" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {artists.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" onClick={() => openNew(viewMode === "week" ? new Date() : teamDay, 0)}>
            <Plus className="h-4 w-4" /> Novo
          </Button>
        </div>
      </div>

      {/* ── calendar grid ───────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4"><Skeleton className="h-[600px] w-full" /></div>
        ) : (
          <div className="min-w-[640px]">
            {/* Column headers */}
            <div className="sticky top-0 z-20 flex border-b bg-card" style={{ paddingLeft: 52 }}>
              {columns.map((col) => (
                <div
                  key={col.key}
                  className={cn("flex-1 border-l py-2 text-center text-xs", col.isToday && "text-primary")}
                >
                  {viewMode === "team" ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: (col as any).color ?? "#7c3aed" }} />
                      <span className="font-medium">{col.label}</span>
                    </div>
                  ) : (
                    <>
                      <p className="uppercase text-muted-foreground">{col.label.split(" ")[0].slice(0, 3)}</p>
                      <p className={cn("text-base font-semibold", col.isToday && "text-primary")}>{col.label.split(" ").pop()}</p>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Time rows + columns */}
            <div className="flex">
              {/* Time gutter */}
              <div className="shrink-0" style={{ width: 52 }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="relative pr-2 text-right text-[11px] text-muted-foreground"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <span className="absolute -top-2 right-2">{String(h).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>

              {/* Day / artist columns */}
              {columns.map((col) => (
                <div key={col.key} className="flex-1 min-w-0" onDragEnd={() => setDraggingId(null)}>
                  <CalendarColumn
                    appts={resizingId
                      ? col.appts.map((a) => a.id === resizingId ? { ...a, durationMinutes: Math.round((resizeHeight / HOUR_HEIGHT) * 60) } : a)
                      : col.appts
                    }
                    isToday={col.isToday}
                    isDark={isDark}
                    draggingId={draggingId}
                    onCellClick={(min) => openNew(col.date, min, col.artistId ?? (artists[0]?.id ?? ""))}
                    onDrop={(e, el) => handleDrop(e, el, col.date)}
                    onEdit={openEdit}
                    onDragStart={handleDragStart}
                    onResizeStart={startResize}
                    onHover={handleHover}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hover popover */}
      {hoverState && <ApptPopover appt={hoverState.appt} rect={hoverState.rect} />}

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
