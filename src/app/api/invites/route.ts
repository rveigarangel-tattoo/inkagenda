import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const studioId = (session.user as any).studioId
  const invites = await prisma.invite.findMany({
    where: { studioId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(invites)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const studioId = (session.user as any).studioId
  const body = await req.json()

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invite = await prisma.invite.create({
    data: {
      studioId,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      role: body.role || "artist",
      commissionPct: body.commissionPct ?? 50,
      avatarColor: body.avatarColor || "#7c3aed",
      expiresAt,
    },
  })

  return NextResponse.json(invite, { status: 201 })
}
