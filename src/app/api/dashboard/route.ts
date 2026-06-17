import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { startOfDay, endOfDay, startOfMonth, endOfMonth, addDays, addMonths, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const studioId = (session.user as any).studioId
  const sessionRole = (session.user as any).role
  const sessionUserId = (session.user as any).id

  const { searchParams } = new URL(req.url)
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")
  const artistParam = searchParams.get("artistId")

  const artistFilter: string | undefined =
    sessionRole === "artist" ? sessionUserId : artistParam || undefined

  const now = new Date()
  const rangeStart = startOfDay(fromParam ? parseLocalDate(fromParam) : addDays(now, -6))
  const rangeEnd = endOfDay(toParam ? parseLocalDate(toParam) : now)

  // Comparison period: same number of days immediately before rangeStart
  const durationDays =
    Math.round((startOfDay(rangeEnd).getTime() - startOfDay(rangeStart).getTime()) / 86_400_000) + 1
  const prevEnd = endOfDay(addDays(rangeStart, -1))
  const prevStart = startOfDay(addDays(rangeStart, -durationDays))

  const apptBase: any = { studioId }
  if (artistFilter) apptBase.artistId = artistFilter

  const [rangeAppts, prevAppts] = await Promise.all([
    prisma.appointment.findMany({
      where: { ...apptBase, date: { gte: rangeStart, lte: rangeEnd } },
      include: { artist: true, client: true },
    }),
    prisma.appointment.findMany({
      where: { ...apptBase, date: { gte: prevStart, lte: prevEnd } },
    }),
  ])

  const completed = rangeAppts.filter((a) => a.status === "completed")
  const revenue = completed.reduce((s, a) => s + a.value, 0)
  const activeAppts = rangeAppts.filter((a) => a.status !== "blocked")
  const completionRate = activeAppts.length ? (completed.length / activeAppts.length) * 100 : 0
  const avgTicket = completed.length ? revenue / completed.length : 0

  const prevCompleted = prevAppts.filter((a) => a.status === "completed")
  const prevRevenue = prevCompleted.reduce((s, a) => s + a.value, 0)
  const prevAvgTicket = prevCompleted.length ? prevRevenue / prevCompleted.length : 0
  const prevActive = prevAppts.filter((a) => a.status !== "blocked")
  const prevCompletionRate = prevActive.length ? (prevCompleted.length / prevActive.length) * 100 : 0

  function pctChange(current: number, prev: number) {
    if (prev === 0) return undefined
    return ((current - prev) / prev) * 100
  }

  // Today's appointments — always real today, respects artist filter
  const todayAppts = await prisma.appointment.findMany({
    where: { ...apptBase, date: { gte: startOfDay(now), lte: endOfDay(now) }, status: { not: "blocked" } },
    include: { artist: true, client: true },
    orderBy: { date: "asc" },
  })

  // Chart: daily bars for ≤31 days, monthly bars for longer ranges
  const monthly: { month: string; revenue: number }[] = []

  if (durationDays <= 31) {
    let day = rangeStart
    while (day <= rangeEnd) {
      const ds = startOfDay(day)
      const de = endOfDay(day)
      const dayRevenue = completed
        .filter((a) => { const d = new Date(a.date); return d >= ds && d <= de })
        .reduce((s, a) => s + a.value, 0)
      monthly.push({ month: format(day, "dd/MM"), revenue: dayRevenue })
      day = addDays(day, 1)
    }
  } else {
    let cur = startOfMonth(rangeStart)
    while (cur <= rangeEnd) {
      const mEnd = endOfMonth(cur)
      const monthRevenue = completed
        .filter((a) => { const d = new Date(a.date); return d >= cur && d <= mEnd })
        .reduce((s, a) => s + a.value, 0)
      const rawLabel = format(cur, "MMM/yy", { locale: ptBR })
      monthly.push({
        month: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1),
        revenue: monthRevenue,
      })
      cur = addMonths(cur, 1)
    }
  }

  // Ranking
  const rankingArtists = await prisma.user.findMany({
    where: {
      studioId,
      OR: [{ role: "artist" }, { isArtist: true }],
      ...(artistFilter ? { id: artistFilter } : {}),
    },
  })
  const ranking = rankingArtists
    .map((a) => {
      const appts = completed.filter((x) => x.artistId === a.id)
      const rev = appts.reduce((s, x) => s + x.value, 0)
      return {
        id: a.id,
        name: a.name,
        avatarColor: a.avatarColor,
        appointments: rangeAppts.filter((x) => x.artistId === a.id).length,
        revenue: rev,
        commission: rev * (a.commissionPct / 100),
      }
    })
    .sort((x, y) => y.revenue - x.revenue)

  const artistsForFilter =
    sessionRole === "admin"
      ? await prisma.user.findMany({
          where: { studioId, OR: [{ role: "artist" }, { isArtist: true }] },
          select: { id: true, name: true, avatarColor: true, role: true, isArtist: true },
          orderBy: { name: "asc" },
        })
      : []

  return NextResponse.json({
    isAdmin: sessionRole === "admin",
    artists: artistsForFilter,
    kpis: {
      revenue,
      appointments: activeAppts.length,
      completionRate,
      avgTicket,
      revenueChange: pctChange(revenue, prevRevenue),
      appointmentsChange: pctChange(activeAppts.length, prevActive.length),
      completionRateChange: pctChange(completionRate, prevCompletionRate),
      avgTicketChange: pctChange(avgTicket, prevAvgTicket),
    },
    todayAppointments: todayAppts,
    ranking,
    monthlyRevenue: monthly,
  })
}
