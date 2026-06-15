import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const artistId = searchParams.get("artistId")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const where: any = {}
  if ((session.user as any).role === "artist") where.artistId = (session.user as any).id
  else if (artistId) where.artistId = artistId
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { client: true, artist: true },
    orderBy: { date: "asc" },
  })
  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const artistId = (session.user as any).role === "artist" ? (session.user as any).id : body.artistId
  const appt = await prisma.appointment.create({
    data: {
      clientId: body.clientId || null,
      artistId,
      service: body.service,
      style: body.style || null,
      value: body.value ?? 0,
      deposit: body.deposit ?? 0,
      date: new Date(body.date),
      durationMinutes: body.durationMinutes ?? 60,
      status: body.status ?? "pending",
      paymentMethod: body.paymentMethod || null,
      notes: body.notes || null,
    },
    include: { client: true, artist: true },
  })
  return NextResponse.json(appt, { status: 201 })
}
