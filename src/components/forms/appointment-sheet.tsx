"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { Trash2, UserPlus, ChevronLeft, Check, CheckCircle2, XCircle, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CurrencyInput } from "@/components/ui/currency-input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { PAYMENT_METHODS, TATTOO_STYLES, STATUS_LABELS, cn } from "@/lib/utils"
import type { Appointment, Client, User } from "@/types"

const schema = z.object({
  artistId: z.string().min(1, "Selecione um tatuador"),
  service: z.string().min(1, "Serviço obrigatório"),
  style: z.string().optional(),
  date: z.string().min(1, "Data obrigatória"),
  time: z.string().min(1, "Horário obrigatório"),
  durationMinutes: z.coerce.number().min(15),
  value: z.number().min(0),
  deposit: z.number().min(0),
  paymentMethod: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  appointment?: Appointment | null
  defaultDate?: Date
  isAdmin?: boolean
  onSaved?: () => void
}

export function AppointmentSheet({ open, onOpenChange, appointment, defaultDate, isAdmin = true, onSaved }: Props) {
  const { data: session } = useSession()

  // ── client state (handled outside RHF) ──────────────────────────────────
  const [clients, setClients] = useState<Client[]>([])
  const [clientName, setClientName] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [clientError, setClientError] = useState("")
  const [clientMode, setClientMode] = useState<"search" | "register">("search")
  const [regPhone, setRegPhone] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [registering, setRegistering] = useState(false)
  const [quickSaving, setQuickSaving] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── artist state ─────────────────────────────────────────────────────────
  const [artists, setArtists] = useState<User[]>([])

  const { register, handleSubmit, control, setValue, watch, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      artistId: "", service: "Tatuagem", style: "", date: "", time: "",
      durationMinutes: 60, value: 0, deposit: 0, paymentMethod: "", status: "pending", notes: "",
    },
  })

  // close suggestions on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  // fetch lists on open
  useEffect(() => {
    if (!open) {
      setClientMode("search")
      setRegPhone("")
      setRegEmail("")
      setClientError("")
      return
    }
    fetch("/api/clients").then((r) => r.json()).then(setClients).catch(() => {})
    if (isAdmin) fetch("/api/team").then((r) => r.json()).then(setArtists).catch(() => {})
  }, [open, isAdmin])

  // reset form values when appointment changes
  useEffect(() => {
    if (!open) return
    if (appointment) {
      const d = new Date(appointment.date)
      reset({
        artistId: appointment.artistId ?? "",
        service: appointment.service,
        style: appointment.style ?? "",
        date: format(d, "yyyy-MM-dd"),
        time: format(d, "HH:mm"),
        durationMinutes: appointment.durationMinutes,
        value: appointment.value,
        deposit: appointment.deposit,
        paymentMethod: appointment.paymentMethod ?? "",
        status: appointment.status,
        notes: appointment.notes ?? "",
      })
      setClientName(appointment.client?.name ?? "")
      setSelectedClientId(appointment.clientId ?? null)
    } else {
      const d = defaultDate ?? new Date()
      const myId = (session?.user as any)?.id ?? ""
      reset({
        artistId: isAdmin ? "" : myId, service: "Tatuagem", style: "",
        date: format(d, "yyyy-MM-dd"), time: format(d, "HH:mm"),
        durationMinutes: 60, value: 0, deposit: 0, paymentMethod: "", status: "pending", notes: "",
      })
      setClientName("")
      setSelectedClientId(null)
    }
  }, [appointment, defaultDate, open, reset])

  // autocomplete suggestions
  const suggestions = clientName.trim().length > 0
    ? clients.filter((c) => c.name.toLowerCase().includes(clientName.toLowerCase())).slice(0, 6)
    : []

  function selectSuggestion(c: Client) {
    setClientName(c.name)
    setSelectedClientId(c.id)
    setShowSuggestions(false)
    setClientError("")
  }

  // register client inline then auto-select
  async function registerClient() {
    if (!clientName.trim()) { setClientError("Nome obrigatório"); return }
    setRegistering(true)
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName.trim(),
          phone: regPhone.trim() || undefined,
          email: regEmail.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      const created: Client = await res.json()
      setClients((prev) => [created, ...prev])
      setSelectedClientId(created.id)
      setClientError("")
      setClientMode("search")
      setRegPhone("")
      setRegEmail("")
      toast.success("Cliente cadastrado e selecionado")
    } catch {
      toast.error("Erro ao cadastrar cliente")
    } finally {
      setRegistering(false)
    }
  }

  async function onSubmit(values: FormValues) {
    if (!clientName.trim()) {
      setClientError("Informe o nome do cliente")
      return
    }
    setClientError("")

    let resolvedClientId = selectedClientId

    // name typed but no existing client picked → create on the fly
    if (!resolvedClientId) {
      try {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: clientName.trim() }),
        })
        if (!res.ok) throw new Error()
        const created: Client = await res.json()
        setClients((prev) => [created, ...prev])
        setSelectedClientId(created.id)
        resolvedClientId = created.id
      } catch {
        toast.error("Erro ao criar cliente")
        return
      }
    }

    const dateTime = new Date(`${values.date}T${values.time}:00`)
    const payload = {
      clientId: resolvedClientId,
      artistId: values.artistId,
      service: values.service,
      style: values.style,
      date: dateTime.toISOString(),
      durationMinutes: values.durationMinutes,
      value: values.value,
      deposit: values.deposit,
      paymentMethod: values.paymentMethod,
      status: values.status,
      notes: values.notes,
    }
    const res = await fetch(appointment ? `/api/appointments/${appointment.id}` : "/api/appointments", {
      method: appointment ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      toast.error("Erro ao salvar agendamento")
      return
    }
    toast.success(appointment ? "Agendamento atualizado" : "Agendamento criado")
    onOpenChange(false)
    onSaved?.()
  }

  async function quickStatus(newStatus: string) {
    if (!appointment) return
    setQuickSaving(true)
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      const labels: Record<string, string> = {
        completed: "Tattoo concluída!",
        cancelled: "Agendamento cancelado",
        confirmed: "Agendamento confirmado",
        pending: "Agendamento reaberto",
        no_show: "Marcado como no-show",
      }
      toast.success(labels[newStatus] ?? "Status atualizado")
      onOpenChange(false)
      onSaved?.()
    } catch {
      toast.error("Erro ao atualizar status")
    } finally {
      setQuickSaving(false)
    }
  }

  async function onDelete() {
    if (!appointment) return
    const res = await fetch(`/api/appointments/${appointment.id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Erro ao excluir"); return }
    toast.success("Agendamento excluído")
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {appointment ? "Editar Agendamento" : "Novo Agendamento"}
            {appointment && <StatusBadge status={appointment.status} />}
          </SheetTitle>
          {appointment?.clientId && (
            <Link
              href={`${isAdmin ? "/dashboard" : "/artist"}/clients/${appointment.clientId}`}
              className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline w-fit"
              onClick={() => onOpenChange(false)}
            >
              Ver perfil do cliente →
            </Link>
          )}
        </SheetHeader>

        {/* ── Quick status actions (edit only) ── */}
        {appointment && appointment.status !== "blocked" && (
          <div className="flex gap-2 pb-1">
            {appointment.status === "completed" ? (
              <>
                <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Concluída
                </div>
                <Button type="button" size="sm" variant="outline" disabled={quickSaving} onClick={() => quickStatus("confirmed")}>
                  Reabrir
                </Button>
              </>
            ) : appointment.status === "cancelled" || appointment.status === "no_show" ? (
              <>
                <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {appointment.status === "cancelled" ? "Cancelada" : "No-show"}
                </div>
                <Button type="button" size="sm" variant="outline" disabled={quickSaving} onClick={() => quickStatus("pending")}>
                  Reabrir
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 border-green-500/30 text-green-700 hover:bg-green-500/10 dark:text-green-400"
                  disabled={quickSaving}
                  onClick={() => quickStatus("completed")}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Concluir
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                  disabled={quickSaving}
                  onClick={() => quickStatus("cancelled")}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" /> Cancelar
                </Button>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ── Cliente ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cliente *</Label>
              {clientMode === "search" ? (
                <button
                  type="button"
                  onClick={() => { setClientMode("register"); setShowSuggestions(false) }}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <UserPlus className="h-3 w-3" /> Cadastrar cliente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setClientMode("search"); setRegPhone(""); setRegEmail("") }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-3 w-3" /> Voltar
                </button>
              )}
            </div>

            {clientMode === "search" ? (
              <div className="relative">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    placeholder="Nome do cliente..."
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value)
                      setSelectedClientId(null)
                      setShowSuggestions(true)
                      setClientError("")
                    }}
                    onFocus={() => clientName.trim() && setShowSuggestions(true)}
                    className={cn(clientError && "border-red-500")}
                  />
                  {selectedClientId && (
                    <Check className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                  )}
                </div>

                {/* suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border bg-card shadow-lg"
                  >
                    {suggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); selectSuggestion(c) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.name}</p>
                          {c.phone && <p className="truncate text-xs text-muted-foreground">{c.phone}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {clientName.trim() && !selectedClientId && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Novo cliente será criado com este nome ao salvar.
                  </p>
                )}
                {selectedClientId && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    Cliente existente selecionado.
                  </p>
                )}
                {clientError && <p className="text-xs text-red-600 dark:text-red-400">{clientError}</p>}
              </div>
            ) : (
              /* ── Cadastrar cliente inline ── */
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome *</Label>
                  <Input
                    autoFocus
                    placeholder="Nome completo"
                    value={clientName}
                    onChange={(e) => { setClientName(e.target.value); setClientError("") }}
                  />
                  {clientError && <p className="text-xs text-red-600 dark:text-red-400">{clientError}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefone</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={!clientName.trim() || registering}
                  onClick={registerClient}
                >
                  {registering ? "Cadastrando..." : "Cadastrar e selecionar"}
                </Button>
              </div>
            )}
          </div>

          {/* ── Tatuador (admin only) ── */}
          {isAdmin && (
            <div className="space-y-2">
              <Label>Tatuador *</Label>
              <Select value={watch("artistId")} onValueChange={(v) => setValue("artistId", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o tatuador" /></SelectTrigger>
                <SelectContent>
                  {artists.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {formState.errors.artistId && <p className="text-xs text-red-600 dark:text-red-400">{formState.errors.artistId.message}</p>}
            </div>
          )}

          {/* ── Serviço + Estilo ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Serviço *</Label>
              <Input {...register("service")} />
              {formState.errors.service && <p className="text-xs text-red-600 dark:text-red-400">{formState.errors.service.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Estilo</Label>
              <Select value={watch("style")} onValueChange={(v) => setValue("style", v)}>
                <SelectTrigger><SelectValue placeholder="Estilo" /></SelectTrigger>
                <SelectContent>
                  {TATTOO_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Data + Hora + Duração ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" {...register("date")} />
            </div>
            <div className="space-y-2">
              <Label>Hora *</Label>
              <Input type="time" {...register("time")} />
            </div>
            <div className="space-y-2">
              <Label>Duração (min)</Label>
              <Input type="number" step={15} {...register("durationMinutes")} />
            </div>
          </div>

          {/* ── Valor + Depósito ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor</Label>
              <CurrencyInput control={control} name="value" />
            </div>
            <div className="space-y-2">
              <Label>Sinal/Depósito</Label>
              <CurrencyInput control={control} name="deposit" />
            </div>
          </div>

          {/* ── Pagamento + Status ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Pagamento</Label>
              <Select value={watch("paymentMethod")} onValueChange={(v) => setValue("paymentMethod", v)}>
                <SelectTrigger><SelectValue placeholder="Forma" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Notas ── */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea {...register("notes")} />
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
            {appointment && (
              <ConfirmDialog
                trigger={<Button type="button" variant="destructive" size="icon" className="min-h-[44px] min-w-[44px]"><Trash2 className="h-4 w-4" /></Button>}
                title="Excluir agendamento?"
                description="Esta ação não pode ser desfeita."
                confirmText="Excluir"
                onConfirm={onDelete}
              />
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
