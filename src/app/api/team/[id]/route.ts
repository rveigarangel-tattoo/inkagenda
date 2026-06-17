import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function resolveArtist(params: { id: string }, studioId: string) {
  const artist = await prisma.user.findUnique({ where: { id: params.id } })
  if (!artist || artist.studioId !== studioId) return null
  return artist
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const studioId = (session.user as any).studioId
  const adminId = (session.user as any).id

  const artist = await resolveArtist(params, studioId)
  if (!artist) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (artist.id === adminId) return NextResponse.json({ error: "Cannot edit yourself here" }, { status: 400 })

  const body = await req.json()
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      name: body.name ?? artist.name,
      phone: body.phone ?? null,
      commissionPct: body.commissionPct ?? artist.commissionPct,
      avatarColor: body.avatarColor ?? artist.avatarColor,
      isActive: body.isActive ?? artist.isActive,
    },
  })
  const { password: _, ...safe } = updated
  return NextResponse.json(safe)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const studioId = (session.user as any).studioId
  const adminId = (session.user as any).id

  const artist = await resolveArtist(params, studioId)
  if (!artist) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (artist.id === adminId) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })

  await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false },
  })
  return NextResponse.json({ ok: true })
}
