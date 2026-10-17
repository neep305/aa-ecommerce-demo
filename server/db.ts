import { createRequire } from 'node:module'
import { scryptSync, randomBytes, timingSafeEqual, randomUUID } from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'

const require = createRequire(import.meta.url)

export interface User {
  id: number
  guid: string
  name: string
  email: string
  createdAt: string
}

export interface UserWithPassword extends User {
  passwordHash: string
}

// DB 파일 디렉토리 초기화
const dataDir = path.resolve(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}
const dbPath = path.join(dataDir, 'users.db')

// Database 어댑터 인터페이스
interface DbAdapter {
  exec(sql: string): void
  get<T>(sql: string, ...params: unknown[]): T | null
  all<T>(sql: string, ...params: unknown[]): T[]
  run(sql: string, ...params: unknown[]): { lastInsertRowid: number | bigint }
}

let dbAdapter: DbAdapter

// 1. Node.js 내장 node:sqlite (Node 22.5+, Node 24+) 우선 시도
try {
  const { DatabaseSync } = require('node:sqlite')
  const syncDb = new DatabaseSync(dbPath)
  syncDb.exec('PRAGMA journal_mode = WAL;')

  dbAdapter = {
    exec(sql: string) {
      syncDb.exec(sql)
    },
    get<T>(sql: string, ...params: unknown[]): T | null {
      const stmt = syncDb.prepare(sql)
      const res = stmt.get(...params) as T | undefined
      return res ?? null
    },
    all<T>(sql: string, ...params: unknown[]): T[] {
      const stmt = syncDb.prepare(sql)
      return stmt.all(...params) as T[]
    },
    run(sql: string, ...params: unknown[]) {
      const stmt = syncDb.prepare(sql)
      return stmt.run(...params)
    },
  }
} catch {
  // 2. better-sqlite3 fallback (Node 20 이하 등)
  const Database = require('better-sqlite3')
  const betterDb = new Database(dbPath)
  betterDb.pragma('journal_mode = WAL')

  dbAdapter = {
    exec(sql: string) {
      betterDb.exec(sql)
    },
    get<T>(sql: string, ...params: unknown[]): T | null {
      const stmt = betterDb.prepare(sql)
      const res = stmt.get(...params) as T | undefined
      return res ?? null
    },
    all<T>(sql: string, ...params: unknown[]): T[] {
      const stmt = betterDb.prepare(sql)
      return stmt.all(...params) as T[]
    },
    run(sql: string, ...params: unknown[]) {
      const stmt = betterDb.prepare(sql)
      return stmt.run(...params)
    },
  }
}

// 사용자 테이블 초기화 (guid 컬럼 포함)
dbAdapter.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// 기존 테이블에 guid 컬럼이 없는 경우를 대비한 자동 마이그레이션
try {
  const tableInfo = dbAdapter.all<{ name: string }>('PRAGMA table_info(users)')
  const hasGuid = tableInfo.some((col) => col.name === 'guid')
  if (!hasGuid) {
    dbAdapter.exec('ALTER TABLE users ADD COLUMN guid TEXT;')
    // 기존 레코드들에 UUID 부여
    const existingUsers = dbAdapter.all<{ id: number }>('SELECT id FROM users WHERE guid IS NULL')
    for (const u of existingUsers) {
      dbAdapter.run('UPDATE users SET guid = ? WHERE id = ?', randomUUID(), u.id)
    }
  }
} catch (e) {
  console.warn('[DB MIGRATION WARNING]', e)
}

// 비밀번호 해싱 (Salt + Scrypt)
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

// 비밀번호 검증 (타이밍 공격 방지 timingSafeEqual)
export function verifyPassword(password: string, combinedHash: string): boolean {
  const [salt, key] = combinedHash.split(':')
  if (!salt || !key) return false
  const keyBuffer = Buffer.from(key, 'hex')
  const derivedKey = scryptSync(password, salt, 64)
  return timingSafeEqual(keyBuffer, derivedKey)
}

// 이메일로 사용자 조회
export function findUserByEmail(email: string): UserWithPassword | null {
  return dbAdapter.get<UserWithPassword>(
    'SELECT id, guid, name, email, password_hash AS passwordHash, created_at AS createdAt FROM users WHERE email = ?',
    email.trim().toLowerCase()
  )
}

// ID로 사용자 조회 (비밀번호 제외)
export function findUserById(id: number): User | null {
  return dbAdapter.get<User>(
    'SELECT id, guid, name, email, created_at AS createdAt FROM users WHERE id = ?',
    id
  )
}

// GUID로 사용자 조회 (비밀번호 제외)
export function findUserByGuid(guid: string): User | null {
  return dbAdapter.get<User>(
    'SELECT id, guid, name, email, created_at AS createdAt FROM users WHERE guid = ?',
    guid.trim()
  )
}

// 사용자 생성 (새로운 UUID 생성 및 저장)
export function createUser(name: string, email: string, password: string): User {
  const guid = randomUUID()
  const passwordHash = hashPassword(password)
  const info = dbAdapter.run(
    'INSERT INTO users (guid, name, email, password_hash) VALUES (?, ?, ?, ?)',
    guid,
    name.trim(),
    email.trim().toLowerCase(),
    passwordHash
  )

  return {
    id: Number(info.lastInsertRowid),
    guid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  }
}

// 사용자 프로필 수정
export function updateUser(id: number, name: string, email: string): User | null {
  dbAdapter.run(
    'UPDATE users SET name = ?, email = ? WHERE id = ?',
    name.trim(),
    email.trim().toLowerCase(),
    id
  )
  return findUserById(id)
}
