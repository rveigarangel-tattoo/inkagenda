"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { StatusBadge } from "@/components/ui/status-badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ClientForm } from "@/components/forms/client-form"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function ArtistClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id)
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  async function load() {
    try {
      const r = await fetch(`/api/clients/${id}`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (!d?.id) throw new Error()
      setClient(d)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function deleteClient() {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Erro ao excluir cliente"); return }
    toast.success("Cliente excluído")
    router.push("/artist/clients")
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="mb-6 h-24 w-full" />
        <div className="mb-6 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (notFound || !client) {
    return (
      <div className="p-4 md:p-6">
        <Link href="/artist/clients" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <p className="text-center text-sm text-muted-foreground">Cliente não encontrado.</p>
      </div>
    )
  }

  const appointments: any[] = client.appointments ?? []
  const totalSessions = appointments.length
  const totalSpent = appointments
    .filter((a) => a.status === "completed")
    .reduce((s, a) => s + (a.value ?? 0), 0)
  const totalDeposits = appointments.reduce((s, a) => s + (a.deposit ?? 0), 0)

  return (
    <div className="p-4 md:p-6">
      <Link href="/artist/clients" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <AvatarInitials name={client.name} color={client.artist?.avatarColor} size={56} />
              <div>
                <h1 className="text-2xl font-bold">{client.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {client.phone || "—"}{client.email ? ` · ${client.email}` : ""}
                </p>
                {client.birthdate && (
                  <p className="text-sm text-muted-foreground">
                    Nascimento: {formatDate(client.birthdate, "dd/MM/yyyy")}
                  </p>
                )}
                {client.notes && <p className="mt-2 max-w-xl text-sm">{client.notes}</p>}
                {client.healthNotes && (
                  <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                    <span className="font-semibold">Saúde: </span>
                    {client.healthNotes}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </Button>
              <ConfirmDialog
                trigger={<Button variant="destructive" size="icon" className="min-h-[44px] min-w-[44px]"><Trash2 className="h-4 w-4" /></Button>}
                title="Excluir cliente?"
                description="O histórico de agendamentos será mantido, mas sem vínculo ao cliente. Esta ação não pode ser desfeita."
                confirmText="Excluir"
                onConfirm={deleteClient}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          <ClientForm client={client} onSuccess={() => { setEditOpen(false); load() }} />
        </DialogContent>
      </Dialog>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total de sessões</p>
            <p className="mt-2 text-2xl font-bold">{totalSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total gasto</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total de depósitos</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(totalDeposits)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Histórico de agendamentos</CardTitle></CardHeader>
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Nenhum agendamento registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="hidden sm:table-cell">Estilo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(a.date, "dd/MM HH:mm")}</TableCell>
                      <TableCell>{a.service ?? "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{a.style ?? "—"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(a.value ?? 0)}</TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {a.status === "completed" ? (a.paymentMethod || "Não informado") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
