import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.status) data.status = body.status
  if (body.price) data.price = parseFloat(body.price)
  if (body.description !== undefined) data.description = body.description
  if (body.date) data.date = new Date(body.date)
  const appointment = await prisma.appointment.update({ where: { id: params.id }, data, include: { client: true, artist: { select: { id: true, name: true, avatarColor: true } } } })
  return NextResponse.json(appointment)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await prisma.appointment.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
