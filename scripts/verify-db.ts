import { createHash } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

function parseDbUrl(url: string) {
  try {
    const match = url.match(/postgresql:\/\/[^@]+@([^\/\?]+)/)
    return match ? match[1] : 'unknown'
  } catch {
    return 'parse-error'
  }
}

function hashUrl(url: string) {
  return createHash('sha256').update(url).digest('hex').substring(0, 10)
}

// Check production env
const prodEnvPath = path.join(process.cwd(), '.env.prod')
if (fs.existsSync(prodEnvPath)) {
  const prodEnv = fs.readFileSync(prodEnvPath, 'utf-8')
  const prodDbMatch = prodEnv.match(/DATABASE_URL=(.+)/)
  if (prodDbMatch) {
    const prodUrl = prodDbMatch[1]
    console.log(`PROD DB host: ${parseDbUrl(prodUrl)} | hash: ${hashUrl(prodUrl)}`)
  } else {
    console.log('PROD DB: not found in .env.prod')
  }
}

// Check local env
const localEnvPath = path.join(process.cwd(), '.env')
if (fs.existsSync(localEnvPath)) {
  const localEnv = fs.readFileSync(localEnvPath, 'utf-8')
  const localDbMatch = localEnv.match(/DATABASE_URL=(.+)/)
  if (localDbMatch) {
    const localUrl = localDbMatch[1]
    console.log(`LOCAL DB host: ${parseDbUrl(localUrl)} | hash: ${hashUrl(localUrl)}`)
  } else {
    console.log('LOCAL DB: not found in .env')
  }
}

// Check if they match
const prodEnv = fs.existsSync(prodEnvPath) ? fs.readFileSync(prodEnvPath, 'utf-8') : ''
const localEnv = fs.existsSync(localEnvPath) ? fs.readFileSync(localEnvPath, 'utf-8') : ''
const prodDbMatch = prodEnv.match(/DATABASE_URL=(.+)/)
const localDbMatch = localEnv.match(/DATABASE_URL=(.+)/)

if (prodDbMatch && localDbMatch) {
  const same = prodDbMatch[1] === localDbMatch[1]
  console.log(`\n${same ? '✅' : '⚠️'} Databases ${same ? 'MATCH' : 'DO NOT MATCH'}`)
  if (!same) {
    console.log('Scripts have been using LOCAL database, not PRODUCTION!')
  }
}