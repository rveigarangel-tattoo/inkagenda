import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { ARTIST_PALETTE } from "@/lib/utils"

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const invite = await prisma.invite.findUnique({
    where: { token: params.token },
    include: { studio: true },
  })
  if (!invite) return NextResponse.json({ error: "Convite inválido" }, { status: 404 })
  if (invite.usedAt) return NextResponse.json({ error: "Convite já utilizado" }, { status: 410 })
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Convite expirado" }, { status: 410 })

  return NextResponse.json({
    name: invite.name,
    email: invite.email,
    phone: invite.phone,
    role: invite.role,
    studioName: invite.studio.name,
    commissionPct: invite.commissionPct,
    avatarColor: invite.avatarColor,
  })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const invite = await prisma.invite.findUnique({
    where: { token: params.token },
    include: { studio: true },
  })
  if (!invite) return NextResponse.json({ error: "Convite inválido" }, { status: 404 })
  if (invite.usedAt) return NextResponse.json({ error: "Convite já utilizado" }, { status: 410 })
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Convite expirado" }, { status: 410 })

  const body = await req.json()
  const { name, email, phone, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 })

  const count = await prisma.user.count({ where: { studioId: invite.studioId, role: invite.role } })
  const hashed = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      studioId: invite.studioId,
      name: name || invite.name,
      email,
      phone: phone || invite.phone || null,
      password: hashed,
      role: invite.role,
      commissionPct: invite.commissionPct,
      avatarColor: invite.avatarColor || ARTIST_PALETTE[count % ARTIST_PALETTE.length],
    },
  })

  await prisma.invite.update({
    where: { token: params.token },
    data: { usedAt: new Date() },
  })

  return NextResponse.json({ ok: true, email })
}
