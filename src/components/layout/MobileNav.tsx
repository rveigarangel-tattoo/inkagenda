"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, Users, DollarSign, UsersRound } from "lucide-react"
import { Session } from "next-auth"
import { cn } from "@/lib/utils"

export function MobileNav({ session }: { session: Session }) {
  const pathname = usePathname()
  const role = (session.user as any).role
  const items = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/schedule", label: "Agenda", icon: Calendar },
    { href: "/dashboard/clients", label: "Clientes", icon: Users },
    ...(role === "ADMIN" ? [{ href: "/dashboard/team", label: "Equipe", icon: UsersRound }] : []),
    { href: "/dashboard/finances", label: "Finanças", icon: DollarSign },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d0d]/95 backdrop-blur-md border-t border-[#1f1f1f] z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(item => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[52px]", isActive ? "text-[#d4a853]" : "text-[#444]")}>
              <item.icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
