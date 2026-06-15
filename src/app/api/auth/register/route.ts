import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { studioName, name, email, password } = body

  if (!studioName || !name || !email || !password) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)

  const studio = await prisma.studio.create({
    data: { name: studioName, commissionPct: 50 },
  })

  await prisma.user.create({
    data: {
      studioId: studio.id,
      name,
      email,
      password: hashed,
      role: "admin",
      commissionPct: 0,
      avatarColor: "#7c3aed",
    },
  })

  return NextResponse.json({ ok: true, email }, { status: 201 })
}
