import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const artistId = (session.user as any).id
  const me = await prisma.user.findUnique({ where: { id: artistId } })
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const monthAppts = await prisma.appointment.findMany({
    where: { artistId, date: { gte: monthStart, lte: monthEnd } },
    include: { client: true },
    orderBy: { date: "asc" },
  })
  const completed = monthAppts.filter((a) => a.status === "completed")
  const revenue = completed.reduce((s, a) => s + a.value, 0)
  const commissionPct = me?.commissionPct ?? 50
  const earnings = revenue * (commissionPct / 100)

  const todayAppts = await prisma.appointment.findMany({
    where: { artistId, status: { not: "blocked" }, date: { gte: startOfDay(now), lte: endOfDay(now) } },
    include: { client: true },
    orderBy: { date: "asc" },
  })

  const clientsCount = await prisma.client.count({ where: { artistId } })

  return NextResponse.json({
    kpis: {
      revenue,
      earnings,
      commissionPct,
      appointments: monthAppts.length,
      completed: completed.length,
      clients: clientsCount,
    },
    todayAppointments: todayAppts,
    upcoming: monthAppts.filter((a) => a.date >= now && a.status !== "cancelled" && a.status !== "blocked").slice(0, 8),
  })
}
