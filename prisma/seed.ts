import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import "dotenv/config";
import { YT_CATEGORIES } from './seedData/ytCategories';
import { YT_SEED_CHANNELS } from './seedData/ytChannels';

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // ── Seed Admin User ──────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com'
  const adminPassword = process.env.ADMIN_PASSWORD || '123456'

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
    console.log(`✅ Admin user created with email: ${adminEmail}`)
  } else {
    console.log(`ℹ️  Admin user with email ${adminEmail} already exists.`)
  }

  // ── Seed YouTube Analytics Categories ────────────────────
  console.log('\n🎯 Seeding YouTube Analytics categories...')
  
  for (const cat of YT_CATEGORIES) {
    await prisma.ytCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color, icon: cat.icon },
      create: { name: cat.name, slug: cat.slug, color: cat.color, icon: cat.icon },
    })
  }
  console.log(`✅ ${YT_CATEGORIES.length} categories seeded.`)

  // ── Seed YouTube Analytics Channels (Mock Data) ──────────
  console.log('\n📺 Seeding YouTube Analytics channels...')
  
  // Buscar categorias do banco para mapear slugs → IDs
  const categories = await prisma.ytCategory.findMany()
  const catMap = new Map(categories.map(c => [c.slug, c.id]))

  let channelsCreated = 0
  let channelsSkipped = 0

  for (const ch of YT_SEED_CHANNELS) {
    const categoryId = catMap.get(ch.category)
    if (!categoryId) {
      console.warn(`⚠️  Category "${ch.category}" not found for ${ch.handle}`)
      continue
    }

    // Gerar um youtubeChannelId fictício baseado no handle
    const mockChannelId = `UC${Buffer.from(ch.handle).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 22)}`
    
    const existing = await prisma.ytChannel.findUnique({
      where: { youtubeChannelId: mockChannelId }
    })

    if (existing) {
      channelsSkipped++
      continue
    }

    // Gerar dados mock realistas
    const baseSubscribers = Math.floor(Math.random() * 20000000) + 100000
    const baseTotalViews = BigInt(Math.floor(Math.random() * 5000000000) + 10000000)
    const totalVideos = Math.floor(Math.random() * 2000) + 50
    const viewsShorts = BigInt(Math.floor(Number(baseTotalViews) * (Math.random() * 0.4 + 0.1)))
    const viewsLongs = baseTotalViews - viewsShorts
    const weeklyGrowth = parseFloat((Math.random() * 10 - 2).toFixed(2))
    const monthlyGrowth = parseFloat((Math.random() * 30 - 5).toFixed(2))

    await prisma.ytChannel.create({
      data: {
        youtubeChannelId: mockChannelId,
        name: ch.handle.replace('@', ''),
        handle: ch.handle,
        customUrl: `https://youtube.com/${ch.handle}`,
        categoryId,
        subscribers: BigInt(baseSubscribers),
        totalViews: baseTotalViews,
        totalVideos,
        viewsShorts,
        viewsLongs,
        viewsLives: BigInt(Math.floor(Number(baseTotalViews) * 0.05)),
        weeklyGrowth,
        monthlyGrowth,
        avgViewsPerVideo: Math.floor(Number(baseTotalViews) / totalVideos),
        avgViewsPerShort: Math.floor(Number(viewsShorts) / Math.max(totalVideos * 0.3, 1)),
        uploadsThisWeek: Math.floor(Math.random() * 7),
        uploadsThisMonth: Math.floor(Math.random() * 25) + 2,
        subsGainedWeek: Math.floor(Math.random() * 50000) - 5000,
        subsGainedMonth: Math.floor(Math.random() * 200000) - 20000,
        livesPerMonth: Math.floor(Math.random() * 8),
        lastVideoAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
        rankPosition: 0,
        thumbnailUrl: null,
        country: 'BR',
      },
    })
    channelsCreated++
  }

  console.log(`✅ ${channelsCreated} channels created, ${channelsSkipped} skipped (already exist).`)

  // ── Recalculate Rankings ─────────────────────────────────
  console.log('\n🏆 Recalculating rankings...')
  const allChannels = await prisma.ytChannel.findMany({
    where: { isActive: true },
    orderBy: { totalViews: 'desc' },
    select: { id: true },
  })

  for (let i = 0; i < allChannels.length; i++) {
    await prisma.ytChannel.update({
      where: { id: allChannels[i].id },
      data: { rankPosition: i + 1 },
    })
  }
  console.log(`✅ Rankings calculated for ${allChannels.length} channels.`)

  // ── Create initial snapshots ─────────────────────────────
  console.log('\n📸 Creating initial snapshots...')
  const channelsForSnapshot = await prisma.ytChannel.findMany({
    where: { isActive: true },
    select: { id: true, subscribers: true, totalViews: true, totalVideos: true, viewsShorts: true, viewsLongs: true },
  })

  for (const ch of channelsForSnapshot) {
    const existingSnapshot = await prisma.ytChannelSnapshot.findFirst({
      where: { channelId: ch.id },
    })
    if (!existingSnapshot) {
      await prisma.ytChannelSnapshot.create({
        data: {
          channelId: ch.id,
          subscribers: ch.subscribers,
          totalViews: ch.totalViews,
          totalVideos: ch.totalVideos,
          viewsShorts: ch.viewsShorts,
          viewsLongs: ch.viewsLongs,
        },
      })
    }
  }
  console.log(`✅ Initial snapshots created.`)

  console.log('\n🎉 Seed completed successfully!')
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
