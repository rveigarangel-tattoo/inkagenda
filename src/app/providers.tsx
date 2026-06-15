"use client"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </SessionProvider>
  )
}
