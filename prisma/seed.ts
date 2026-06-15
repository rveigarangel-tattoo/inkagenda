import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const ARTIST_COLORS = ["#7c3aed", "#ec4899", "#06b6d4"]

const CLIENT_NAMES = [
  "Mariana Oliveira",
  "Carlos Eduardo Souza",
  "Beatriz Lima",
  "Rafael Almeida",
  "Juliana Ferreira",
  "Lucas Pereira",
  "Camila Rodrigues",
  "Gabriel Santos",
  "Larissa Costa",
  "Thiago Nascimento",
]

const SERVICES = ["Tatuagem", "Retoque", "Sessão Fechamento", "Consulta", "Cobertura"]
const STYLES = ["Realismo", "Blackwork", "Aquarela", "Old School", "Fineline", "Geométrico"]
const STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"]
const PAYMENTS = ["Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito"]
const EXPENSE_CATEGORIES = ["Materiais", "Aluguel", "Energia", "Marketing", "Equipamento", "Limpeza"]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function phone() {
  return `(11) 9${rand(1000, 9999)}-${rand(1000, 9999)}`
}

async function main() {
  console.log("Cleaning database...")
  await prisma.transaction.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.client.deleteMany()
  await prisma.invite.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.studio.deleteMany()

  const studio = await prisma.studio.create({
    data: {
      name: "InkFlow Studio",
      commissionPct: 50,
      plan: "pro",
    },
  })
  console.log("Studio created:", studio.name)

  const adminPassword = await bcrypt.hash("Admin@123", 10)
  const artistPassword = await bcrypt.hash("Artist@123", 10)

  const admin = await prisma.user.create({
    data: {
      studioId: studio.id,
      name: "Studio Admin",
      email: "admin@inkflow.com",
      password: adminPassword,
      role: "admin",
      phone: phone(),
      commissionPct: 0,
      avatarColor: "#7c3aed",
    },
  })

  const artistsData = [
    { name: "João Silva", email: "joao@inkflow.com", style: "Realismo", commissionPct: 60 },
    { name: "Ana Costa", email: "ana@inkflow.com", style: "Blackwork", commissionPct: 50 },
    { name: "Pedro Mendes", email: "pedro@inkflow.com", style: "Aquarela", commissionPct: 55 },
  ]

  const artists = []
  for (let i = 0; i < artistsData.length; i++) {
    const a = artistsData[i]
    const artist = await prisma.user.create({
      data: {
        studioId: studio.id,
        name: a.name,
        email: a.email,
        password: artistPassword,
        role: "artist",
        phone: phone(),
        commissionPct: a.commissionPct,
        avatarColor: ARTIST_COLORS[i],
      },
    })
    artists.push(artist)
  }

  const clients = []
  for (const name of CLIENT_NAMES) {
    const first = name.split(" ")[0].toLowerCase()
    const client = await prisma.client.create({
      data: {
        studioId: studio.id,
        name,
        phone: phone(),
        email: `${first}@email.com`,
        birthdate: new Date(rand(1980, 2003), rand(0, 11), rand(1, 28)),
        artistId: pick(artists).id,
        notes: Math.random() > 0.6 ? "Cliente fiel, prefere sessões longas." : null,
        healthNotes: Math.random() > 0.7 ? "Alérgico a látex." : null,
      },
    })
    clients.push(client)
  }

  const now = new Date()
  const appointments = []
  for (let i = 0; i < 30; i++) {
    const dayOffset = rand(-28, 14)
    const date = new Date(now)
    date.setDate(now.getDate() + dayOffset)
    date.setHours(rand(9, 20), pick([0, 30]), 0, 0)

    let status: string
    if (dayOffset < 0) status = pick(["completed", "completed", "completed", "cancelled", "no_show"])
    else if (dayOffset === 0) status = pick(["confirmed", "pending", "completed"])
    else status = pick(["pending", "confirmed", "confirmed"])

    const value = rand(150, 2500)
    const appt = await prisma.appointment.create({
      data: {
        studioId: studio.id,
        clientId: pick(clients).id,
        artistId: pick(artists).id,
        service: pick(SERVICES),
        style: pick(STYLES),
        value,
        deposit: Math.random() > 0.5 ? Math.round(value * 0.3) : 0,
        date,
        durationMinutes: pick([60, 90, 120, 180, 240]),
        status,
        paymentMethod: status === "completed" ? pick(PAYMENTS) : null,
        notes: Math.random() > 0.7 ? "Trazer referência impressa." : null,
      },
    })
    appointments.push(appt)
  }

  const completed = appointments.filter((a) => a.status === "completed")
  let txCount = 0
  for (const appt of completed) {
    if (txCount >= 12) break
    await prisma.transaction.create({
      data: {
        studioId: studio.id,
        appointmentId: appt.id,
        artistId: appt.artistId,
        type: "income",
        category: "Serviço",
        description: `Pagamento - ${appt.service}`,
        amount: appt.value,
        paymentMethod: appt.paymentMethod ?? pick(PAYMENTS),
        date: appt.date,
      },
    })
    txCount++
  }

  for (let i = txCount; i < 13; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() - rand(0, 28))
    await prisma.transaction.create({
      data: {
        studioId: studio.id,
        artistId: pick(artists).id,
        type: "income",
        category: "Serviço",
        description: "Sessão avulsa",
        amount: rand(200, 1800),
        paymentMethod: pick(PAYMENTS),
        date: d,
      },
    })
  }

  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() - rand(0, 28))
    await prisma.transaction.create({
      data: {
        studioId: studio.id,
        type: "expense",
        category: pick(EXPENSE_CATEGORIES),
        description: `Despesa - ${pick(EXPENSE_CATEGORIES)}`,
        amount: rand(80, 1200),
        paymentMethod: pick(PAYMENTS),
        date: d,
      },
    })
  }

  console.log("Seed complete:", {
    studio: studio.name,
    admin: admin.email,
    artists: artists.length,
    clients: clients.length,
    appointments: appointments.length,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
