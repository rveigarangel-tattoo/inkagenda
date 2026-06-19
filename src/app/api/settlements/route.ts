import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function normalizeMethod(m: string | null | undefined) {
  if (!m) return "other"
  const l = m.toLowerCase()
  if (l.includes("pix")) return "pix"
  if (l.includes("dinheiro")) return "cash"
  if (l.includes("cart")) return "card"
  return "other"
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const { searchParams } = new URL(req.url)
  const artistId = searchParams.get("artistId")

  const settlements = await prisma.settlement.findMany({
    where: { studioId, ...(artistId ? { artistId } : {}) },
    include: {
      artist: { select: { id: true, name: true, avatarColor: true, commissionPct: true } },
    },
    orderBy: [{ periodStart: "desc" }],
  })

  return NextResponse.json(settlements)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const role = (session.user as any).role
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { artistId, periodStart, periodEnd } = body
  if (!artistId || !periodStart || !periodEnd) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  const start = new Date(periodStart)
  start.setHours(0, 0, 0, 0)
  const end = new Date(periodEnd)
  end.setHours(23, 59, 59, 999)

  // Block overlap with any existing settlement
  const overlap = await prisma.settlement.findFirst({
    where: {
      studioId,
      artistId,
      periodStart: { lte: end },
      periodEnd: { gte: start },
    },
  })
  if (overlap) {
    return NextResponse.json({ error: "Período já possui um acerto registrado" }, { status: 409 })
  }

  const artist = await prisma.user.findFirst({ where: { id: artistId, studioId } })
  if (!artist) return NextResponse.json({ error: "Tatuador não encontrado" }, { status: 404 })

  const appointments = await prisma.appointment.findMany({
    where: { studioId, artistId, status: "completed", date: { gte: start, lte: end } },
    include: { client: { select: { name: true } } },
    orderBy: { date: "asc" },
  })

  const commissionPct = artist.commissionPct
  const totalGross = appointments.reduce((s, a) => s + a.value, 0)
  const artistAmount = totalGross * (commissionPct / 100)
  const studioAmount = totalGross - artistAmount

  let pixAmount = 0, cashAmount = 0, cardAmount = 0, otherAmount = 0
  for (const a of appointments) {
    const m = normalizeMethod(a.paymentMethod)
    if (m === "pix") pixAmount += a.value
    else if (m === "cash") cashAmount += a.value
    else if (m === "card") cardAmount += a.value
    else otherAmount += a.value
  }

  const settlement = await prisma.settlement.create({
    data: {
      studioId,
      artistId,
      periodStart: start,
      periodEnd: end,
      totalGross,
      artistAmount,
      studioAmount,
      commissionPct,
      pixAmount,
      cashAmount,
      cardAmount,
      otherAmount,
      status: "closed",
      items: {
        create: appointments.map((a) => ({
          appointmentId: a.id,
          clientName: a.client?.name ?? null,
          service: a.service,
          serviceDate: a.date,
          value: a.value,
          paymentMethod: a.paymentMethod ?? null,
          artistAmount: a.value * (commissionPct / 100),
          studioAmount: a.value * (1 - commissionPct / 100),
        })),
      },
    },
    include: {
      items: true,
      artist: { select: { id: true, name: true, avatarColor: true, commissionPct: true } },
    },
  })

  return NextResponse.json(settlement, { status: 201 })
}
