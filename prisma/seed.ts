import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import "dotenv/config";

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com'
  const adminPassword = process.env.ADMIN_PASSWORD || '123456'

  // Verifique se o admin já existe
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN'
      }
    })
    console.log(`Admin user created with email: ${adminEmail}`)
  } else {
    console.log(`Admin user with email ${adminEmail} already exists.`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
