import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId

  const settlement = await prisma.settlement.findFirst({
    where: { id: params.id, studioId },
    include: {
      artist: { select: { id: true, name: true, avatarColor: true, commissionPct: true, email: true } },
      items: { orderBy: { serviceDate: "asc" } },
    },
  })

  if (!settlement) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(settlement)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const role = (session.user as any).role
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const existing = await prisma.settlement.findFirst({ where: { id: params.id, studioId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { status, notes } = body

  const data: any = {}

  if (status !== undefined) {
    // Paid settlements can only be reopened (status = "closed")
    if (existing.status === "paid" && status !== "closed") {
      return NextResponse.json({ error: "Acerto pago. Use 'Reabrir' para desfazer." }, { status: 409 })
    }
    data.status = status
    if (status === "paid") data.paidAt = new Date()
    if (status === "closed") data.paidAt = null
  }

  if (notes !== undefined) data.notes = notes ?? null

  const settlement = await prisma.settlement.update({
    where: { id: params.id },
    data,
    include: {
      artist: { select: { id: true, name: true, avatarColor: true, commissionPct: true, email: true } },
      items: { orderBy: { serviceDate: "asc" } },
    },
  })

  return NextResponse.json(settlement)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const role = (session.user as any).role
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const existing = await prisma.settlement.findFirst({ where: { id: params.id, studioId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.status === "paid") {
    return NextResponse.json({ error: "Acerto pago não pode ser excluído" }, { status: 409 })
  }

  await prisma.settlement.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
