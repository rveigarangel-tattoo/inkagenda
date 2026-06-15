"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PAYMENT_METHODS } from "@/lib/utils"

const schema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().min(2, "Descrição obrigatória"),
  category: z.string().optional(),
  amount: z.number().positive("Valor deve ser maior que zero"),
  paymentMethod: z.string().optional(),
  date: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function TransactionForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register, handleSubmit, control, setValue, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "income", amount: 0, description: "", category: "", paymentMethod: "" },
  })
  const type = watch("type")

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/finances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      toast.error("Erro ao registrar transação")
      return
    }
    toast.success("Transação registrada")
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(v) => setValue("type", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Receita</SelectItem>
            <SelectItem value="expense">Despesa</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Descrição *</Label>
        <Input {...register("description")} />
        {formState.errors.description && <p className="text-xs text-red-400">{formState.errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input {...register("category")} placeholder="Materiais, Serviço..." />
        </div>
        <div className="space-y-2">
          <Label>Valor *</Label>
          <CurrencyInput control={control} name="amount" />
          {formState.errors.amount && <p className="text-xs text-red-400">{formState.errors.amount.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Forma de Pagamento</Label>
          <Select onValueChange={(v) => setValue("paymentMethod", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" {...register("date")} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Salvando..." : "Registrar"}
      </Button>
    </form>
  )
}
