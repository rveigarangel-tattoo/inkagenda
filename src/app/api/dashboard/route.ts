import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const where: Record<string, unknown> = {}
  if (session.user.role !== "ADMIN") where.artistId = (session.user as any).id

  const now = new Date()
  const [todayCount, weekAppts, totalClients, pendingCount, upcomingAppts] = await Promise.all([
    prisma.appointment.count({ where: { ...where, date: { gte: startOfDay(now), lte: endOfDay(now) } } }),
    prisma.appointment.findMany({ where: { ...where, date: { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) }, status: { in: ["COMPLETED", "IN_PROGRESS"] } }, select: { price: true } }),
    prisma.client.count(),
    prisma.appointment.count({ where: { ...where, status: "SCHEDULED" } }),
    prisma.appointment.findMany({ where: { ...where, date: { gte: startOfDay(now) }, status: { notIn: ["CANCELLED", "COMPLETED"] } }, include: { client: true, artist: { select: { name: true, avatarColor: true } } }, orderBy: { date: "asc" }, take: 8 }),
  ])

  return NextResponse.json({ todayAppointments: todayCount, weekRevenue: weekAppts.reduce((s, a) => s + a.price, 0), totalClients, pendingConfirmations: pendingCount, upcomingAppointments: upcomingAppts })
}
