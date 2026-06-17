"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CurrencyInput } from "@/components/ui/currency-input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { PAYMENT_METHODS, TATTOO_STYLES, STATUS_LABELS } from "@/lib/utils"
import type { Appointment, Client, User } from "@/types"

const schema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
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
  const [clients, setClients] = useState<Client[]>([])
  const [artists, setArtists] = useState<User[]>([])
  const [clientSearch, setClientSearch] = useState("")

  const { register, handleSubmit, control, setValue, watch, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: "", artistId: "", service: "Tatuagem", style: "", date: "", time: "",
      durationMinutes: 60, value: 0, deposit: 0, paymentMethod: "", status: "pending", notes: "",
    },
  })

  useEffect(() => {
    if (!open) return
    fetch("/api/clients").then((r) => r.json()).then(setClients).catch(() => {})
    if (isAdmin) fetch("/api/team").then((r) => r.json()).then(setArtists).catch(() => {})
  }, [open, isAdmin])

  useEffect(() => {
    if (!open) return
    if (appointment) {
      const d = new Date(appointment.date)
      reset({
        clientId: appointment.clientId,
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
    } else {
      const d = defaultDate ?? new Date()
      const myId = (session?.user as any)?.id ?? ""
      reset({
        clientId: "", artistId: isAdmin ? "" : myId, service: "Tatuagem", style: "",
        date: format(d, "yyyy-MM-dd"), time: format(d, "HH:mm"),
        durationMinutes: 60, value: 0, deposit: 0, paymentMethod: "", status: "pending", notes: "",
      })
    }
  }, [appointment, defaultDate, open, reset])

  async function onSubmit(values: FormValues) {
    const dateTime = new Date(`${values.date}T${values.time}:00`)
    const payload = {
      clientId: values.clientId,
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

  async function onDelete() {
    if (!appointment) return
    const res = await fetch(`/api/appointments/${appointment.id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error("Erro ao excluir")
      return
    }
    toast.success("Agendamento excluído")
    onOpenChange(false)
    onSaved?.()
  }

  const clientId = watch("clientId")
  const filteredClients = clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Input placeholder="Buscar cliente..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
            <Select value={clientId} onValueChange={(v) => setValue("clientId", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {filteredClients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {formState.errors.clientId && <p className="text-xs text-red-600 dark:text-red-400">{formState.errors.clientId.message}</p>}
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Serviço *</Label>
              <Input {...register("service")} />
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea {...register("notes")} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
            {appointment && (
              <ConfirmDialog
                trigger={<Button type="button" variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>}
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
