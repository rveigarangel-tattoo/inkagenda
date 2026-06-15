"use client"
import { usePathname } from "next/navigation"
import { Session } from "next-auth"
import Link from "next/link"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/schedule": "Agenda",
  "/dashboard/clients": "Clientes",
  "/dashboard/team": "Equipe",
  "/dashboard/finances": "Finanças",
  "/dashboard/profile": "Perfil",
}

export function Header({ session }: { session: Session }) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] || "InkAgenda"
  const avatarColor = (session.user as any).avatarColor || "#d4a853"
  const initial = session.user?.name?.charAt(0).toUpperCase() || "U"

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
      <h2 className="font-bold text-white text-lg">{title}</h2>
      <Link href="/dashboard/profile" className="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold text-sm hover:opacity-80 transition-opacity" style={{ backgroundColor: avatarColor }}>
        {initial}
      </Link>
    </header>
  )
}
