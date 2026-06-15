import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const artists = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, specialty: true, bio: true, hourlyRate: true, avatarColor: true, createdAt: true, appointments: { select: { price: true, status: true, date: true, clientId: true } } }, orderBy: { name: "asc" } })
  return NextResponse.json(artists)
}
