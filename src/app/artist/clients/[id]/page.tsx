"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function ArtistClientDetailPage() {
  const params = useParams()
  const id = String(params.id)
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((d) => { if (!d?.id) throw new Error(); setClient(d) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

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
        </CardContent>
      </Card>

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Estilo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{formatDate(a.date, "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell>{a.service ?? "—"}</TableCell>
                    <TableCell>{a.style ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(a.value ?? 0)}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
