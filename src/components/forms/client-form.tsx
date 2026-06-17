"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Client } from "@/types"

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  birthdate: z.string().optional(),
  notes: z.string().optional(),
  healthNotes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function ClientForm({ client, onSuccess }: { client?: Client; onSuccess?: () => void }) {
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name ?? "",
      phone: client?.phone ?? "",
      email: client?.email ?? "",
      birthdate: client?.birthdate ? client.birthdate.slice(0, 10) : "",
      notes: client?.notes ?? "",
      healthNotes: client?.healthNotes ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    const res = await fetch(client ? `/api/clients/${client.id}` : "/api/clients", {
      method: client ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      toast.error("Erro ao salvar cliente")
      return
    }
    toast.success(client ? "Cliente atualizado" : "Cliente criado")
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input {...register("name")} />
        {formState.errors.name && <p className="text-xs text-red-600 dark:text-red-400">{formState.errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...register("email")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Data de Nascimento</Label>
        <Input type="date" {...register("birthdate")} />
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea {...register("notes")} />
      </div>
      <div className="space-y-2">
        <Label>Notas de Saúde</Label>
        <Textarea {...register("healthNotes")} />
      </div>
      <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  )
}
