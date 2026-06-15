"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard, Calendar, Users, Wallet, Palette, Settings,
  Search, UserPlus, CalendarPlus, ArrowRight,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navegar" },
  { label: "Agenda", href: "/dashboard/schedule", icon: Calendar, group: "Navegar" },
  { label: "Clientes", href: "/dashboard/clients", icon: Users, group: "Navegar" },
  { label: "Financeiro", href: "/dashboard/finances", icon: Wallet, group: "Navegar" },
  { label: "Tatuadores", href: "/dashboard/team", icon: Palette, group: "Navegar" },
  { label: "Configurações", href: "/dashboard/settings", icon: Settings, group: "Navegar" },
]

interface Client { id: string; name: string; phone?: string }

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Search clients
  useEffect(() => {
    if (!open || !query.trim()) { setClients([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/clients?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setClients(Array.isArray(data) ? data.slice(0, 4) : [])
      } catch { setClients([]) }
    }, 200)
    return () => clearTimeout(t)
  }, [query, open])

  const filtered = query
    ? NAV_ITEMS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : NAV_ITEMS

  const allItems: Array<{ label: string; sublabel?: string; href: string; icon: any; group: string }> = [
    ...filtered,
    ...clients.map((c) => ({
      label: c.name,
      sublabel: c.phone ?? undefined,
      href: `/dashboard/clients/${c.id}`,
      icon: Users,
      group: "Clientes",
    })),
  ]

  function handleSelect(href: string) {
    router.push(href)
    setOpen(false)
    setQuery("")
  }

  // Keyboard navigation
  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, allItems.length - 1)) }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
      if (e.key === "Enter" && allItems[activeIndex]) handleSelect(allItems[activeIndex].href)
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, activeIndex, allItems])

  const groups = Array.from(new Set(allItems.map((i) => i.group)))

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery("") }}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-lg">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar páginas, clientes..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {allItems.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum resultado para "{query}"</p>
          ) : (
            groups.map((group) => {
              const items = allItems.filter((i) => i.group === group)
              const groupStartIndex = allItems.findIndex((i) => i.group === group)
              return (
                <div key={group}>
                  <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                  {items.map((item, relIndex) => {
                    const absIndex = groupStartIndex + relIndex
                    const isActive = absIndex === activeIndex
                    return (
                      <button
                        key={item.href + item.label}
                        onClick={() => handleSelect(item.href)}
                        onMouseEnter={() => setActiveIndex(absIndex)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                          isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.label}</span>
                          {item.sublabel && (
                            <span className="block truncate text-xs text-muted-foreground">{item.sublabel}</span>
                          )}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t px-4 py-2 text-[11px] text-muted-foreground">
          <span><kbd className="rounded border border-border bg-muted px-1 py-0.5">↑↓</kbd> navegar</span>
          <span><kbd className="rounded border border-border bg-muted px-1 py-0.5">↵</kbd> abrir</span>
          <span><kbd className="rounded border border-border bg-muted px-1 py-0.5">Esc</kbd> fechar</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
