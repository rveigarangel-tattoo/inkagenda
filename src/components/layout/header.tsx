"use client"
import { signOut, useSession } from "next-auth/react"
import { LogOut, Moon, Sun, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { Button } from "@/components/ui/button"
import { CommandPalette } from "@/components/ui/command-palette"

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

  function openPalette() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))
  }

  const user = session?.user
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <img src="/logo.svg" alt="InkFlow" className="h-9 object-contain md:hidden" />
      {/* Cmd+K search button — desktop only */}
      <button
        onClick={openPalette}
        className="hidden items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar...</span>
        <kbd className="ml-4 rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>
      <CommandPalette />
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
