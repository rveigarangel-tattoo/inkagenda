import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import bcrypt from "bcryptjs"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ARTIST_PALETTE } from "@/lib/utils"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const artists = await prisma.user.findMany({
    where: { studioId, OR: [{ role: "artist" }, { isArtist: true }] },
    include: { appointments: true },
    orderBy: { name: "asc" },
  })
  const safe = artists.map(({ password, ...a }) => a)
  return NextResponse.json(safe)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const studioId = (session.user as any).studioId
  const body = await req.json()
  const count = await prisma.user.count({ where: { studioId, role: "artist" } })
  const password = await bcrypt.hash(body.password || "Artist@123", 10)
  const artist = await prisma.user.create({
    data: {
      studioId,
      name: body.name,
      email: body.email,
      password,
      role: "artist",
      phone: body.phone || null,
      commissionPct: body.commissionPct ?? 50,
      avatarColor: body.avatarColor || ARTIST_PALETTE[count % ARTIST_PALETTE.length],
    },
  })
  const { password: _p, ...safe } = artist
  return NextResponse.json(safe, { status: 201 })
}
