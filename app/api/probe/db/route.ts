import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || ''
    
    // Extract host and db name (mask credentials)
    const match = dbUrl.match(/postgresql:\/\/[^@]+@([^\/\?]+)\/([^\?]+)/)
    const host = match ? match[1] : 'unknown'
    const dbName = match ? match[2] : 'unknown'
    
    // Create checksum
    const checksum = createHash('sha256').update(dbUrl).digest('hex').substring(0, 10)
    
    return NextResponse.json({
      host,
      dbName,
      checksum,
      envVarPresent: !!process.env.DATABASE_URL
    })
  } catch (error) {
    console.error('DB probe error:', error)
    return NextResponse.json({ 
      error: 'Failed to probe database',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}