import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Temporary one-time endpoint — remove after use
export async function POST(req: NextRequest) {
  const { email, username, password, secret } = await req.json()
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!email || !username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.update({
    where: { email },
    data: { username, password: hashed },
    select: { id: true, name: true, email: true, username: true, role: true },
  })
  return NextResponse.json({ ok: true, user })
}
