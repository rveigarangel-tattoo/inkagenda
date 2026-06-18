"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClientForm } from "@/components/forms/client-form"

export default function ArtistClientsPage() {
  const [clients, setClients] = useState<any[] | null>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  const fetchData = useCallback(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients).catch(() => setClients([]))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = useMemo(() => {
    if (!clients) return []
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) => c.name?.toLowerCase().includes(q))
  }, [clients, query])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meus Clientes</h1>
          <p className="text-sm text-muted-foreground">Clientes atendidos por você</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!clients ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Nenhum cliente encontrado.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/artist/clients/${c.id}`} className="block">
              <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.99]">
                <CardContent className="flex items-center gap-3 p-4">
                  <AvatarInitials name={c.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    {c.phone && (
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </p>
                    )}
                    {c.email && (
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {c.email}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-primary">
                      {c.appointments?.length ?? 0} sessões
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <ClientForm onSuccess={() => { setOpen(false); fetchData() }} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
