"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard, Calendar, Users, Wallet, Palette, Settings,
  CalendarDays, UserCircle, TrendingUp, ChevronLeft, Syringe,
} from "lucide-react"
import { cn } from "@/lib/utils"

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/schedule", label: "Agenda", icon: Calendar },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/finances", label: "Financeiro", icon: Wallet },
  { href: "/dashboard/team", label: "Tatuadores", icon: Palette },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
]

const artistNav = [
  { href: "/artist", label: "Início", icon: LayoutDashboard },
  { href: "/artist/agenda", label: "Minha Agenda", icon: CalendarDays },
  { href: "/artist/clients", label: "Meus Clientes", icon: UserCircle },
  { href: "/artist/earnings", label: "Meus Ganhos", icon: TrendingUp },
]

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isArtist = role === "artist"
  const nav = isArtist ? artistNav : adminNav

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-card transition-all duration-200 shrink-0",
        collapsed ? "w-[60px]" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b", collapsed ? "justify-center px-0" : "gap-2 px-4")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Syringe className="h-5 w-5" />
        </div>
        {!collapsed && <span className="text-lg font-bold">InkFlow</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/artist" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? "Expandir" : undefined}
        className={cn(
          "flex items-center border-t py-3 text-sm text-muted-foreground hover:text-foreground transition-colors",
          collapsed ? "justify-center px-0" : "gap-2 px-3"
        )}
      >
        <ChevronLeft className={cn("h-5 w-5 shrink-0 transition-transform duration-200", collapsed && "rotate-180")} />
        {!collapsed && <span>Recolher</span>}
      </button>
    </aside>
  )
}
