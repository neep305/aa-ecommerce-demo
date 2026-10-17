import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByGuid,
  verifyPassword,
  updateUser,
} from './db'

// 요청 바디(JSON) 비동기 파싱 헬퍼
function parseRequestBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      if (!body.trim()) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('유효하지 않은 JSON 데이터입니다.'))
      }
    })
    req.on('error', reject)
  })
}

// JSON 응답 헬퍼
function sendJson(res: ServerResponse, statusCode: number, data: Record<string, unknown>) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * /api/auth 라우팅 핸들러 미들웨어
 */
export async function authApiMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) {
  const rawUrl = req.url || ''
  const [urlPath, queryString] = rawUrl.split('?')
  const pathname = urlPath.replace(/\/+$/, '') || '/'

  // /api/auth 로 시작하지 않는 요청은 다음 미들웨어로 전달
  if (!pathname.startsWith('/api/auth')) {
    return next()
  }

  console.log(`[AUTH API] ${req.method} ${pathname}`)

  try {
    // 0-1. 이메일 중복 확인: GET /api/auth/check-email?email=...
    if (pathname === '/api/auth/check-email' && req.method === 'GET') {
      const searchParams = new URLSearchParams(queryString || '')
      const email = searchParams.get('email')

      if (!email || !EMAIL_PATTERN.test(email.trim())) {
        return sendJson(res, 400, { error: '유효한 이메일 주소를 입력해 주세요.' })
      }

      const existing = findUserByEmail(email.trim())
      return sendJson(res, 200, {
        isAvailable: !existing,
        message: existing ? '이미 사용 중인 이메일 주소입니다.' : '사용 가능한 이메일 주소입니다.',
      })
    }

    // 0-2. 현재 사용자 정보 조회/동기화: GET /api/auth/me?email=...&guid=...
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const searchParams = new URLSearchParams(queryString || '')
      const email = searchParams.get('email')
      const guid = searchParams.get('guid')

      let user = null
      if (guid && guid.trim()) {
        user = findUserByGuid(guid.trim())
      }
      if (!user && email && email.trim()) {
        const found = findUserByEmail(email.trim())
        if (found) {
          user = {
            id: found.id,
            guid: found.guid,
            name: found.name,
            email: found.email,
            createdAt: found.createdAt,
          }
        }
      }

      if (!user) {
        return sendJson(res, 404, { error: '사용자를 찾을 수 없습니다.' })
      }

      return sendJson(res, 200, {
        success: true,
        user: {
          id: user.id,
          guid: user.guid,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      })
    }

    // 1. 회원가입: POST /api/auth/signup
    if (pathname === '/api/auth/signup' && req.method === 'POST') {
      const body = await parseRequestBody(req)
      const { name, email, password } = body as { name?: string; email?: string; password?: string }

      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendJson(res, 400, { error: '이름을 입력해 주세요.' })
      }
      if (!email || typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
        return sendJson(res, 400, { error: '유효한 이메일 주소를 입력해 주세요.' })
      }
      if (!password || typeof password !== 'string' || password.length < 4) {
        return sendJson(res, 400, { error: '비밀번호는 최소 4자 이상이어야 합니다.' })
      }

      // 동일 이메일 중복 체크
      const normalizedEmail = email.trim().toLowerCase()
      const existing = findUserByEmail(normalizedEmail)
      if (existing) {
        return sendJson(res, 409, { error: '이미 등록된 이메일 주소입니다. 다른 이메일을 사용해 주세요.' })
      }

      try {
        const user = createUser(name.trim(), normalizedEmail, password)
        return sendJson(res, 201, {
          success: true,
          message: '회원가입이 완료되었습니다.',
          user: {
            id: user.id,
            guid: user.guid,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          },
        })
      } catch (dbErr: unknown) {
        const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr)
        if (errMsg.includes('UNIQUE constraint failed') || errMsg.includes('SQLITE_CONSTRAINT')) {
          return sendJson(res, 409, { error: '이미 등록된 이메일 주소입니다. 다른 이메일을 사용해 주세요.' })
        }
        throw dbErr
      }
    }

    // 2. 로그인: POST /api/auth/login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseRequestBody(req)
      const { email, password } = body as { email?: string; password?: string }

      if (!email || typeof email !== 'string' || !email.trim()) {
        return sendJson(res, 400, { error: '이메일을 입력해 주세요.' })
      }
      if (!password || typeof password !== 'string') {
        return sendJson(res, 400, { error: '비밀번호를 입력해 주세요.' })
      }

      const userWithPwd = findUserByEmail(email.trim().toLowerCase())
      if (!userWithPwd) {
        return sendJson(res, 401, { error: '등록되지 않은 이메일이거나 비밀번호가 올바르지 않습니다.' })
      }

      const isValid = verifyPassword(password, userWithPwd.passwordHash)
      if (!isValid) {
        return sendJson(res, 401, { error: '등록되지 않은 이메일이거나 비밀번호가 올바르지 않습니다.' })
      }

      return sendJson(res, 200, {
        success: true,
        message: '로그인 성공',
        user: {
          id: userWithPwd.id,
          guid: userWithPwd.guid,
          name: userWithPwd.name,
          email: userWithPwd.email,
          createdAt: userWithPwd.createdAt,
        },
      })
    }

    // 3. 로그아웃: POST /api/auth/logout
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      return sendJson(res, 200, { success: true, message: '로그아웃 되었습니다.' })
    }

    // 4. 프로필 정보 수정: PATCH /api/auth/profile
    if (pathname === '/api/auth/profile' && req.method === 'PATCH') {
      const body = await parseRequestBody(req)
      const { id, guid, name, email } = body as { id?: number; guid?: string; name?: string; email?: string }

      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendJson(res, 400, { error: '이름을 입력해 주세요.' })
      }
      if (!email || typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
        return sendJson(res, 400, { error: '유효한 이메일 주소를 입력해 주세요.' })
      }

      let targetUser = null
      if (id && typeof id === 'number') {
        targetUser = findUserById(id)
      } else if (guid && typeof guid === 'string') {
        targetUser = findUserByGuid(guid.trim())
      }

      if (!targetUser) {
        return sendJson(res, 404, { error: '사용자를 찾을 수 없습니다.' })
      }

      const normalizedEmail = email.trim().toLowerCase()
      // 이메일 중복 체크 (본인 이외에 같은 이메일을 쓰는 다른 계정이 있는지)
      const existing = findUserByEmail(normalizedEmail)
      if (existing && existing.id !== targetUser.id) {
        return sendJson(res, 409, { error: '이미 다른 사용자가 사용 중인 이메일입니다.' })
      }

      const updated = updateUser(targetUser.id, name.trim(), normalizedEmail)
      if (!updated) {
        return sendJson(res, 404, { error: '사용자 정보 수정에 실패했습니다.' })
      }

      return sendJson(res, 200, {
        success: true,
        message: '회원 정보가 성공적으로 수정되었습니다.',
        user: updated,
      })
    }

    // 일치하는 auth 라우트가 없는 경우 404 JSON 응답
    return sendJson(res, 404, { error: '존재하지 않는 인증 API 경로입니다.' })
  } catch (error) {
    console.error('[AUTH API ERROR]', error)
    return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Internal Server Error' })
  }
}
