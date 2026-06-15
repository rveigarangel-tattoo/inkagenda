import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { Header } from "@/components/layout/Header"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar session={session} />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Header session={session} />
        <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-8">{children}</main>
      </div>
      <MobileNav session={session} />
    </div>
  )
}
