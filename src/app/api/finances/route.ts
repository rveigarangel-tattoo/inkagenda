import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { subMonths, startOfMonth, endOfMonth } from "date-fns"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const artistId = searchParams.get("artistId")
  const where: Record<string, unknown> = {}
  if (session.user.role !== "ADMIN") { where.artistId = (session.user as any).id } else if (artistId) { where.artistId = artistId }

  const now = new Date()
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i)
    const appts = await prisma.appointment.findMany({ where: { ...where, date: { gte: startOfMonth(monthDate), lte: endOfMonth(monthDate) }, status: "COMPLETED" }, select: { price: true } })
    monthlyData.push({ month: monthDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), revenue: appts.reduce((s, a) => s + a.price, 0), count: appts.length })
  }

  const allAppointments = await prisma.appointment.findMany({ where, include: { client: true, artist: { select: { name: true, avatarColor: true } } }, orderBy: { date: "desc" }, take: 50 })
  const completed = allAppointments.filter(a => a.status === "COMPLETED")
  const totalRevenue = completed.reduce((s, a) => s + a.price, 0)

  return NextResponse.json({ monthlyData, appointments: allAppointments, totalRevenue, avgRevenue: completed.length > 0 ? totalRevenue / completed.length : 0, completedCount: completed.length })
}
