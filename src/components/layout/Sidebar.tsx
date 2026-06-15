"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, Users, UserCircle, DollarSign, UsersRound, LogOut, Zap } from "lucide-react"
import { signOut } from "next-auth/react"
import { Session } from "next-auth"
import { cn } from "@/lib/utils"

function navItems(role: string) {
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/schedule", label: "Agenda", icon: Calendar },
    { href: "/dashboard/clients", label: "Clientes", icon: Users },
    ...(role === "ADMIN" ? [{ href: "/dashboard/team", label: "Equipe", icon: UsersRound }] : []),
    { href: "/dashboard/finances", label: "Finanças", icon: DollarSign },
    { href: "/dashboard/profile", label: "Perfil", icon: UserCircle },
  ]
}

export function Sidebar({ session }: { session: Session }) {
  const pathname = usePathname()
  const role = (session.user as any).role
  const items = navItems(role)
  const avatarColor = (session.user as any).avatarColor || "#d4a853"
  const initial = session.user?.name?.charAt(0).toUpperCase() || "U"

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#0d0d0d] border-r border-[#1f1f1f] z-40">
      <div className="p-6 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#d4a853]/10 border border-[#d4a853]/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#d4a853]" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">InkAgenda</h1>
            <p className="text-[10px] text-[#444] mt-0.5 uppercase tracking-wider">Studio Management</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map(item => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200", isActive ? "bg-[#d4a853]/10 text-[#d4a853] border border-[#d4a853]/20" : "text-[#666] hover:text-white hover:bg-[#1a1a1a]")}>
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-[#1f1f1f]">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold text-sm shrink-0" style={{ backgroundColor: avatarColor }}>{initial}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{session.user?.name}</p>
            <p className="text-xs text-[#555]">{role === "ADMIN" ? "Administrador" : "Tatuador(a)"}</p>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#666] hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-200">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>
    </aside>
  )
}
