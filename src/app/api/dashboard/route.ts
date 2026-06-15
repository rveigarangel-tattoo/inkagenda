import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const monthAppts = await prisma.appointment.findMany({
    where: { date: { gte: monthStart, lte: monthEnd } },
    include: { artist: true, client: true },
  })

  const completed = monthAppts.filter((a) => a.status === "completed")
  const revenue = completed.reduce((s, a) => s + a.value, 0)
  const completionRate = monthAppts.length ? (completed.length / monthAppts.length) * 100 : 0
  const avgTicket = completed.length ? revenue / completed.length : 0

  const todayAppts = await prisma.appointment.findMany({
    where: { date: { gte: startOfDay(now), lte: endOfDay(now) } },
    include: { artist: true, client: true },
    orderBy: { date: "asc" },
  })

  // artist ranking (this month)
  const artists = await prisma.user.findMany({ where: { role: "artist" } })
  const ranking = artists
    .map((a) => {
      const appts = completed.filter((x) => x.artistId === a.id)
      const rev = appts.reduce((s, x) => s + x.value, 0)
      return {
        id: a.id,
        name: a.name,
        avatarColor: a.avatarColor,
        appointments: monthAppts.filter((x) => x.artistId === a.id).length,
        revenue: rev,
        commission: rev * (a.commissionPct / 100),
      }
    })
    .sort((x, y) => y.revenue - x.revenue)

  // 6-month revenue
  const monthly: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(now, i)
    const s = startOfMonth(m)
    const e = endOfMonth(m)
    const appts = await prisma.appointment.findMany({
      where: { status: "completed", date: { gte: s, lte: e } },
    })
    monthly.push({
      month: format(m, "MMM", { locale: ptBR }),
      revenue: appts.reduce((sum, a) => sum + a.value, 0),
    })
  }

  return NextResponse.json({
    kpis: { revenue, appointments: monthAppts.length, completionRate, avgTicket },
    todayAppointments: todayAppts,
    ranking,
    monthlyRevenue: monthly,
  })
}
