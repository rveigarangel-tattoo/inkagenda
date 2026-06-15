import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const appt = await prisma.appointment.findFirst({
    where: { id: params.id, studioId },
    include: { client: true, artist: true },
  })
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(appt)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const body = await req.json()
  const data: any = {}
  for (const k of ["clientId", "artistId", "service", "style", "status", "paymentMethod", "notes"]) {
    if (body[k] !== undefined) data[k] = body[k] || null
  }
  if (body.value !== undefined) data.value = body.value
  if (body.deposit !== undefined) data.deposit = body.deposit
  if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes
  if (body.date !== undefined) data.date = new Date(body.date)

  const existing = await prisma.appointment.findFirst({ where: { id: params.id, studioId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const appt = await prisma.appointment.update({
    where: { id: params.id },
    data,
    include: { client: true, artist: true },
  })

  if (body.status === "completed" && existing.status !== "completed") {
    const tx = await prisma.transaction.findFirst({ where: { appointmentId: appt.id } })
    if (!tx) {
      await prisma.transaction.create({
        data: {
          studioId,
          appointmentId: appt.id,
          artistId: appt.artistId,
          type: "income",
          category: "Serviço",
          description: `Pagamento - ${appt.service}`,
          amount: appt.value,
          paymentMethod: appt.paymentMethod,
          date: new Date(),
        },
      })
    }
  }
  return NextResponse.json(appt)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const existing = await prisma.appointment.findFirst({ where: { id: params.id, studioId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.transaction.deleteMany({ where: { appointmentId: params.id } })
  await prisma.appointment.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
