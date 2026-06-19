"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Users, Wallet, LayoutDashboard, CalendarDays, UserCircle, TrendingUp, MoreHorizontal, Settings, UserCheck, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const adminNav = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/dashboard/schedule", label: "Agenda", icon: Calendar },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/finances", label: "Finanças", icon: Wallet },
]

const adminMore = [
  { href: "/dashboard/team", label: "Tatuadores", icon: UserCheck },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
]

const artistNav = [
  { href: "/artist", label: "Início", icon: LayoutDashboard },
  { href: "/artist/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/artist/clients", label: "Clientes", icon: UserCircle },
  { href: "/artist/earnings", label: "Ganhos", icon: TrendingUp },
]

const artistMore = [
  { href: "/artist/settings", label: "Configurações", icon: Settings },
]

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const isArtist = role === "artist"
  const nav = isArtist ? artistNav : adminNav
  const moreItems = isArtist ? artistMore : adminMore
  const isMoreActive = moreItems.some((i) => pathname.startsWith(i.href))

  return (
    <>
      {/* More drawer */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-16 left-0 right-0 rounded-t-2xl border-t bg-card p-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Menu</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    pathname.startsWith(item.href)
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/50 text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/artist" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs"
            >
              <span className={cn(
                "absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full transition-all duration-200",
                active ? "w-8 bg-primary" : "w-0 bg-transparent"
              )} />
              <item.icon className={cn("h-5 w-5 transition-colors", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("transition-colors", active ? "text-primary font-medium" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* "Mais" button */}
        {(
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs"
          >
            <span className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full transition-all duration-200",
              (isMoreActive || moreOpen) ? "w-8 bg-primary" : "w-0 bg-transparent"
            )} />
            <MoreHorizontal className={cn("h-5 w-5 transition-colors", (isMoreActive || moreOpen) ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("transition-colors", (isMoreActive || moreOpen) ? "text-primary font-medium" : "text-muted-foreground")}>
              Mais
            </span>
          </button>
        )}
      </nav>
    </>
  )
}
