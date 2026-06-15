"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { subMonths, startOfMonth, endOfMonth } from "date-fns"
import { Plus, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { EmptyState } from "@/components/ui/empty-state"
import { Sparkline } from "@/components/ui/sparkline"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ClientForm } from "@/components/forms/client-form"

function clientSparkline(appointments: { date: string }[]): number[] {
  const now = new Date()
  return [2, 1, 0].map((offset) => {
    const s = startOfMonth(subMonths(now, offset))
    const e = endOfMonth(subMonths(now, offset))
    return appointments.filter((a) => {
      const d = new Date(a.date)
      return d >= s && d <= e
    }).length
  })
}

function ClientsTableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-6 w-14 sm:block" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  async function load(q: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(query), 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie os clientes do estúdio</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
            <ClientForm onSuccess={() => { setOpen(false); load(query) }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar clientes..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <ClientsTableSkeleton />
          ) : clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title={query ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              description={query ? `Sem resultados para "${query}". Tente outro nome ou telefone.` : "Adicione o primeiro cliente do estúdio para começar."}
              action={!query ? { label: "Adicionar primeiro cliente", onClick: () => setOpen(true) } : undefined}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  {/* hide on mobile */}
                  <TableHead className="hidden sm:table-cell">Contato</TableHead>
                  <TableHead className="hidden md:table-cell">Tatuador</TableHead>
                  <TableHead className="text-right">Sessões</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Últimos 3 meses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => {
                  const spark = clientSparkline(c.appointments ?? [])
                  return (
                    <TableRow key={c.id} className="cursor-pointer">
                      <TableCell>
                        <Link href={`/dashboard/clients/${c.id}`} className="flex items-center gap-2.5">
                          <AvatarInitials name={c.name} color={c.artist?.avatarColor ?? "#7c3aed"} size={34} />
                          <div className="min-w-0">
                            <p className="truncate font-medium hover:text-primary">{c.name}</p>
                            {/* phone visible on mobile since Contato column is hidden */}
                            <p className="truncate text-xs text-muted-foreground sm:hidden">{c.phone || c.email || "—"}</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Link href={`/dashboard/clients/${c.id}`} className="block">
                          <span className="block text-sm">{c.phone || "—"}</span>
                          <span className="block text-xs text-muted-foreground">{c.email || ""}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Link href={`/dashboard/clients/${c.id}`} className="flex items-center gap-2">
                          {c.artist ? (
                            <>
                              <AvatarInitials name={c.artist.name} color={c.artist.avatarColor} size={26} />
                              <span className="text-sm">{c.artist.name}</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/clients/${c.id}`} className="block font-medium">
                          {c.appointments?.length ?? 0}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Link href={`/dashboard/clients/${c.id}`} className="flex items-center justify-end">
                          <Sparkline data={spark} />
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
