"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Users, Wallet, LayoutDashboard, CalendarDays, UserCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const adminNav = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/dashboard/schedule", label: "Agenda", icon: Calendar },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/finances", label: "Financeiro", icon: Wallet },
]
const artistNav = [
  { href: "/artist", label: "Início", icon: LayoutDashboard },
  { href: "/artist/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/artist/clients", label: "Clientes", icon: UserCircle },
  { href: "/artist/earnings", label: "Ganhos", icon: TrendingUp },
]

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname()
  const nav = role === "artist" ? artistNav : adminNav
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card md:hidden">
      {nav.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("flex flex-1 flex-col items-center gap-1 py-2.5 text-xs", active ? "text-primary" : "text-muted-foreground")}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
