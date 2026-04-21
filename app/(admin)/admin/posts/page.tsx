import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import PostsTable from "@/components/PostsTable"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export const dynamic = "force-dynamic"

export default async function PostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Notícias</h1>
      <PostsTable initialData={posts} />
    </div>
  )
}
