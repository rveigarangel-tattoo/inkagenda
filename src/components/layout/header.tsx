"use client"
import { signOut, useSession } from "next-auth/react"
import { LogOut, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { Button } from "@/components/ui/button"

export function Header() {
  const { data: session } = useSession()
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setDark(isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
  }

  const user = session?.user
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <span className="text-lg font-bold md:hidden">InkFlow</span>
      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        {user && (
          <div className="flex items-center gap-2">
            <AvatarInitials name={user.name ?? "?"} color={(user as any).avatarColor} size={36} />
            <div className="hidden text-sm sm:block">
              <p className="font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{(user as any).role}</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Sair">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
