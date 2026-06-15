import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month")
  const year = searchParams.get("year")
  const artistId = searchParams.get("artistId")
  const where: Record<string, unknown> = {}
  if (session.user.role !== "ADMIN") { where.artistId = (session.user as any).id } else if (artistId) { where.artistId = artistId }
  if (month && year) { const start = new Date(parseInt(year), parseInt(month)-1, 1); const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59); where.date = { gte: start, lte: end } }
  const appointments = await prisma.appointment.findMany({ where, include: { client: true, artist: { select: { id: true, name: true, avatarColor: true } } }, orderBy: { date: "asc" } })
  return NextResponse.json(appointments)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const { clientId, date, duration, service, description, price, status, artistId } = body
  const finalArtistId = session.user.role === "ADMIN" && artistId ? artistId : (session.user as any).id
  const appointment = await prisma.appointment.create({ data: { clientId, date: new Date(date), duration: parseInt(duration), service, description, price: parseFloat(price), status: status || "SCHEDULED", artistId: finalArtistId }, include: { client: true, artist: { select: { id: true, name: true, avatarColor: true } } } })
  return NextResponse.json(appointment)
}
