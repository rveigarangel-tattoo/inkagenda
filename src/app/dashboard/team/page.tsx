"use client"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Mail, Phone, Percent, CalendarCheck, Palette } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
  phone: z.string().optional(),
  commissionPct: z.coerce.number().min(0).max(100),
  avatarColor: z.string().min(1, "Cor obrigatória"),
})
type FormValues = z.infer<typeof schema>

function TeamForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", phone: "", commissionPct: 30, avatarColor: "#7c3aed" },
  })

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      toast.error("Erro ao criar tatuador")
      return
    }
    toast.success("Tatuador criado")
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input {...register("name")} />
        {formState.errors.name && <p className="text-xs text-red-400">{formState.errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Email *</Label>
        <Input type="email" {...register("email")} />
        {formState.errors.email && <p className="text-xs text-red-400">{formState.errors.email.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Senha</Label>
          <Input type="password" {...register("password")} />
          {formState.errors.password && <p className="text-xs text-red-400">{formState.errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input {...register("phone")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Comissão (%)</Label>
          <Input type="number" step="1" {...register("commissionPct")} />
          {formState.errors.commissionPct && <p className="text-xs text-red-400">{formState.errors.commissionPct.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Cor do Avatar</Label>
          <Input type="color" className="h-10 p-1" {...register("avatarColor")} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  )
}

export default function TeamPage() {
  const [artists, setArtists] = useState<any[] | null>(null)
  const [open, setOpen] = useState(false)

  function load() {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => setArtists(Array.isArray(d) ? d : []))
      .catch(() => setArtists([]))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-sm text-muted-foreground">Gerencie os tatuadores do estúdio</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Tatuador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Tatuador</DialogTitle>
            </DialogHeader>
            <TeamForm
              onSuccess={() => {
                setOpen(false)
                load()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {artists === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : artists.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="Nenhum tatuador cadastrado"
          description="Adicione os artistas do estúdio para gerenciar agendamentos e comissões."
          action={{ label: "Adicionar tatuador", onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <AvatarInitials name={a.name} color={a.avatarColor} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{a.name}</p>
                    <span
                      className={cn(
                        "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        a.isActive
                          ? "bg-green-500/15 text-green-400"
                          : "bg-gray-500/15 text-gray-400"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", a.isActive ? "bg-green-400" : "bg-gray-400")} />
                      {a.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {a.email}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {a.phone || "—"}</p>
                  <p className="flex items-center gap-2"><Percent className="h-4 w-4" /> Comissão: {a.commissionPct}%</p>
                  <p className="flex items-center gap-2"><CalendarCheck className="h-4 w-4" /> {a.appointments?.length ?? 0} agendamentos</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
