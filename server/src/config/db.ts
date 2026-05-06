import { PrismaClient } from '@prisma/client/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// Handle the pg Pool import for ESM
const { Pool } = pg

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ?? 
  new PrismaClient({ 
    adapter,
    // Add this to see what's happening during the fix
    log: ['query', 'error', 'warn'], 
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}