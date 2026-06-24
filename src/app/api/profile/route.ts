import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, username: true, role: true, isArtist: true, commissionPct: true, avatarColor: true, phone: true },
  })
  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as any).id
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.phone !== undefined) data.phone = body.phone || null
  if (body.isArtist !== undefined) data.isArtist = Boolean(body.isArtist)
  if (body.commissionPct !== undefined) data.commissionPct = Number(body.commissionPct)
  if (body.avatarColor !== undefined) data.avatarColor = body.avatarColor

  if (body.username !== undefined) {
    const raw = (body.username as string).trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
    if (raw && raw.length < 3) {
      return NextResponse.json({ error: "Username deve ter pelo menos 3 caracteres" }, { status: 400 })
    }
    if (raw) {
      const conflict = await prisma.user.findUnique({ where: { username: raw } })
      if (conflict && conflict.id !== userId) {
        return NextResponse.json({ error: "Username já em uso" }, { status: 409 })
      }
    }
    data.username = raw || null
  }

  if (body.currentPassword && body.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const valid = await bcrypt.compare(body.currentPassword, user!.password)
    if (!valid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    if ((body.newPassword as string).length < 6) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }
    data.password = await bcrypt.hash(body.newPassword, 10)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, username: true, role: true, isArtist: true, commissionPct: true, avatarColor: true, phone: true },
  })
  return NextResponse.json(user)
}
