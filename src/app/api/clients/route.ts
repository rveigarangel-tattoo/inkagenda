import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim()
  const where: any = { studioId }
  if ((session.user as any).role === "artist") where.artistId = (session.user as any).id
  if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }]
  const clients = await prisma.client.findMany({
    where,
    include: { appointments: true, artist: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const body = await req.json()
  const artistId = (session.user as any).role === "artist" ? (session.user as any).id : body.artistId || null
  const client = await prisma.client.create({
    data: {
      studioId,
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      birthdate: body.birthdate ? new Date(body.birthdate) : null,
      notes: body.notes || null,
      healthNotes: body.healthNotes || null,
      artistId,
    },
  })
  return NextResponse.json(client, { status: 201 })
}
