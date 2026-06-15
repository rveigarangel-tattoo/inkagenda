import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const studioId = (session.user as any).studioId
  const sessionRole = (session.user as any).role
  const sessionUserId = (session.user as any).id

  const { searchParams } = new URL(req.url)
  const monthParam = searchParams.get("month") // "2026-06"
  const artistParam = searchParams.get("artistId")

  // Artists always see only their own data — admin can optionally filter to one artist
  const artistFilter: string | undefined =
    sessionRole === "artist" ? sessionUserId : artistParam || undefined

  // Parse selected month; fall back to current month
  const now = new Date()
  let baseDate = now
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number)
    baseDate = new Date(y, m - 1, 1)
  }

  const monthStart = startOfMonth(baseDate)
  const monthEnd = endOfMonth(baseDate)
  const prevStart = startOfMonth(subMonths(baseDate, 1))
  const prevEnd = endOfMonth(subMonths(baseDate, 1))

  const apptBase: any = { studioId }
  if (artistFilter) apptBase.artistId = artistFilter

  const [monthAppts, prevAppts] = await Promise.all([
    prisma.appointment.findMany({
      where: { ...apptBase, date: { gte: monthStart, lte: monthEnd } },
      include: { artist: true, client: true },
    }),
    prisma.appointment.findMany({
      where: { ...apptBase, date: { gte: prevStart, lte: prevEnd } },
    }),
  ])

  const completed = monthAppts.filter((a) => a.status === "completed")
  const revenue = completed.reduce((s, a) => s + a.value, 0)
  const completionRate = monthAppts.length ? (completed.length / monthAppts.length) * 100 : 0
  const avgTicket = completed.length ? revenue / completed.length : 0

  const prevCompleted = prevAppts.filter((a) => a.status === "completed")
  const prevRevenue = prevCompleted.reduce((s, a) => s + a.value, 0)
  const prevAvgTicket = prevCompleted.length ? prevRevenue / prevCompleted.length : 0
  const prevCompletionRate = prevAppts.length ? (prevCompleted.length / prevAppts.length) * 100 : 0

  function pctChange(current: number, prev: number) {
    if (prev === 0) return undefined
    return ((current - prev) / prev) * 100
  }

  // Today's appointments — always real today, but respects artist filter
  const todayAppts = await prisma.appointment.findMany({
    where: { ...apptBase, date: { gte: startOfDay(now), lte: endOfDay(now) }, status: { not: "blocked" } },
    include: { artist: true, client: true },
    orderBy: { date: "asc" },
  })

  // Ranking — scoped to the selected artist if filtered
  const rankingArtists = await prisma.user.findMany({
    where: { studioId, role: "artist", ...(artistFilter ? { id: artistFilter } : {}) },
  })
  const ranking = rankingArtists
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

  // Chart — 6 months ending at selected month, respects artist filter
  const monthly: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(baseDate, i)
    const appts = await prisma.appointment.findMany({
      where: { ...apptBase, status: "completed", date: { gte: startOfMonth(m), lte: endOfMonth(m) } },
    })
    monthly.push({
      month: format(m, "MMM", { locale: ptBR }),
      revenue: appts.reduce((sum, a) => sum + a.value, 0),
    })
  }

  // Artist list for the filter dropdown (admin only)
  const artistsForFilter =
    sessionRole === "admin"
      ? await prisma.user.findMany({
          where: { studioId, role: "artist" },
          select: { id: true, name: true, avatarColor: true },
          orderBy: { name: "asc" },
        })
      : []

  return NextResponse.json({
    isAdmin: sessionRole === "admin",
    artists: artistsForFilter,
    kpis: {
      revenue, appointments: monthAppts.length, completionRate, avgTicket,
      revenueChange: pctChange(revenue, prevRevenue),
      appointmentsChange: pctChange(monthAppts.length, prevAppts.length),
      completionRateChange: pctChange(completionRate, prevCompletionRate),
      avgTicketChange: pctChange(avgTicket, prevAvgTicket),
    },
    todayAppointments: todayAppts,
    ranking,
    monthlyRevenue: monthly,
  })
}
