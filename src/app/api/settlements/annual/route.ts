import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()))

  const periodStart_gte = new Date(year, 0, 1)
  const periodStart_lte = new Date(year, 11, 31, 23, 59, 59, 999)

  const settlements = await prisma.settlement.findMany({
    where: {
      studioId,
      status: { in: ["closed", "paid"] },
      periodStart: { gte: periodStart_gte, lte: periodStart_lte },
    },
    include: {
      artist: { select: { id: true, name: true, avatarColor: true } },
      _count: { select: { items: true } },
    },
    orderBy: { periodStart: "asc" },
  })

  // Group by artist → month
  const artistMap = new Map<string, {
    id: string; name: string; avatarColor: string
    months: Record<number, { totalGross: number; artistAmount: number; studioAmount: number; sessionsCount: number; settlementCount: number }>
    annual: { totalGross: number; artistAmount: number; studioAmount: number; sessionsCount: number; settlementCount: number }
  }>()

  for (const s of settlements) {
    const month = new Date(s.periodStart).getMonth() + 1 // 1–12
    const adj = s.adjustmentAmount ?? 0

    if (!artistMap.has(s.artistId)) {
      artistMap.set(s.artistId, {
        id: s.artist.id,
        name: s.artist.name,
        avatarColor: s.artist.avatarColor,
        months: {},
        annual: { totalGross: 0, artistAmount: 0, studioAmount: 0, sessionsCount: 0, settlementCount: 0 },
      })
    }

    const entry = artistMap.get(s.artistId)!

    if (!entry.months[month]) {
      entry.months[month] = { totalGross: 0, artistAmount: 0, studioAmount: 0, sessionsCount: 0, settlementCount: 0 }
    }

    entry.months[month].totalGross     += s.totalGross
    entry.months[month].artistAmount   += s.artistAmount + adj
    entry.months[month].studioAmount   += s.studioAmount
    entry.months[month].sessionsCount  += s._count.items
    entry.months[month].settlementCount += 1

    entry.annual.totalGross     += s.totalGross
    entry.annual.artistAmount   += s.artistAmount + adj
    entry.annual.studioAmount   += s.studioAmount
    entry.annual.sessionsCount  += s._count.items
    entry.annual.settlementCount += 1
  }

  // Monthly totals across all artists
  const monthlyTotals: Record<number, { totalGross: number; artistAmount: number; studioAmount: number; sessionsCount: number }> = {}
  const annualTotal = { totalGross: 0, artistAmount: 0, studioAmount: 0, sessionsCount: 0 }

  for (const entry of Array.from(artistMap.values())) {
    for (const [m, cellData] of Object.entries(entry.months)) {
      const month = Number(m)
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = { totalGross: 0, artistAmount: 0, studioAmount: 0, sessionsCount: 0 }
      }
      monthlyTotals[month].totalGross    += cellData.totalGross
      monthlyTotals[month].artistAmount  += cellData.artistAmount
      monthlyTotals[month].studioAmount  += cellData.studioAmount
      monthlyTotals[month].sessionsCount += cellData.sessionsCount
    }
    annualTotal.totalGross    += entry.annual.totalGross
    annualTotal.artistAmount  += entry.annual.artistAmount
    annualTotal.studioAmount  += entry.annual.studioAmount
    annualTotal.sessionsCount += entry.annual.sessionsCount
  }

  // Available years (years that have at least one settlement for this studio)
  const allSettlements = await prisma.settlement.findMany({
    where: { studioId, status: { in: ["closed", "paid"] } },
    select: { periodStart: true },
    distinct: ["periodStart"],
    orderBy: { periodStart: "asc" },
  })
  const yearsSet = new Set<number>()
  yearsSet.add(new Date().getFullYear()) // always include current year
  for (const s of allSettlements) {
    yearsSet.add(new Date(s.periodStart).getFullYear())
  }
  const availableYears = Array.from(yearsSet).sort((a, b) => b - a)

  return NextResponse.json({
    year,
    availableYears,
    artists: Array.from(artistMap.values()),
    monthlyTotals,
    annualTotal,
  })
}
