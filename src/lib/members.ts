const MEMBER_KEY = "aa-demo-member"

export interface Member {
  id?: number
  guid?: string
  name: string
  email: string
  joinedAt: string
}

export interface AuthApiResponse {
  success?: boolean
  error?: string
  message?: string
  user?: {
    id: number
    guid: string
    name: string
    email: string
    createdAt: string
  }
}

// 안전한 JSON 파싱 헬퍼
async function safeParseJson(response: Response): Promise<AuthApiResponse> {
  const text = await response.text()
  if (!text || !text.trim()) {
    return {}
  }
  try {
    return JSON.parse(text) as AuthApiResponse
  } catch {
    return { error: `서버 응답 오류 (HTTP ${response.status})` }
  }
}

let isSyncing = false

/**
 * 로컬 스토리지에 guid가 누락된 경우 서버에서 자동 동기화 (Auto-healing)
 */
export async function syncMemberSession(): Promise<Member | null> {
  const member = getMember()
  if (!member || member.guid || isSyncing) return member

  isSyncing = true
  try {
    const query = member.email ? `email=${encodeURIComponent(member.email)}` : ''
    if (!query) return member

    const response = await fetch(`/api/auth/me?${query}`)
    const data = await safeParseJson(response)

    if (response.ok && data.user && data.user.guid) {
      const updated: Member = {
        ...member,
        id: data.user.id,
        guid: data.user.guid,
        name: data.user.name || member.name,
        email: data.user.email || member.email,
      }
      localStorage.setItem(MEMBER_KEY, JSON.stringify(updated))
      return updated
    }
  } catch {
    // ignore
  } finally {
    isSyncing = false
  }

  return member
}

/**
 * 현재 로컬에 저장된 로그인된 회원 정보 조회 (동기)
 */
export function getMember(): Member | null {
  try {
    const raw = localStorage.getItem(MEMBER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.name === "string" && typeof parsed.email === "string") {
      const member = parsed as Member
      // guid가 누락된 구 세션인 경우 백그라운드 자동 동기화 트리거
      if (!member.guid && typeof window !== 'undefined') {
        void syncMemberSession()
      }
      return member
    }
    return null
  } catch {
    return null
  }
}

/**
 * 이메일 중복 여부 확인
 */
export async function checkEmailAvailable(email: string): Promise<{ isAvailable: boolean; message: string }> {
  try {
    const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email.trim())}`)
    const data = await safeParseJson(response) as { isAvailable?: boolean; message?: string; error?: string }
    if (!response.ok) {
      return { isAvailable: false, message: data.error || '이메일 확인 실패' }
    }
    return {
      isAvailable: Boolean(data.isAvailable),
      message: data.message || (data.isAvailable ? '사용 가능한 이메일입니다.' : '이미 등록된 이메일입니다.'),
    }
  } catch {
    return { isAvailable: true, message: '' }
  }
}

/**
 * 회원가입 (SQLite 백엔드 API 연동)
 */
export async function signUpMember(name: string, email: string, password: string): Promise<Member> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })

  const data = await safeParseJson(response)

  if (!response.ok || !data.user) {
    throw new Error(data.error || `회원가입에 실패했습니다. (HTTP ${response.status})`)
  }

  const member: Member = {
    id: data.user.id,
    guid: data.user.guid,
    name: data.user.name,
    email: data.user.email,
    joinedAt: data.user.createdAt || new Date().toISOString(),
  }

  try {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member))
  } catch {
    // ignore
  }

  return member
}

/**
 * 로그인 (SQLite 백엔드 API 연동)
 */
export async function loginMember(email: string, password: string): Promise<Member> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await safeParseJson(response)

  if (!response.ok || !data.user) {
    throw new Error(data.error || `로그인에 실패했습니다. (HTTP ${response.status})`)
  }

  const member: Member = {
    id: data.user.id,
    guid: data.user.guid,
    name: data.user.name,
    email: data.user.email,
    joinedAt: data.user.createdAt || new Date().toISOString(),
  }

  try {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member))
  } catch {
    // ignore
  }

  return member
}

/**
 * 회원 정보 수정 (SQLite 백엔드 API 연동)
 */
export async function updateMember(patch: { name: string; email: string }): Promise<Member> {
  const current = getMember()
  if (!current) {
    throw new Error('로그인된 회원 정보가 없습니다.')
  }

  const response = await fetch('/api/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: current.id,
      guid: current.guid,
      name: patch.name,
      email: patch.email,
    }),
  })

  const data = await safeParseJson(response)

  if (!response.ok || !data.user) {
    throw new Error(data.error || `회원 정보 수정에 실패했습니다. (HTTP ${response.status})`)
  }

  const updated: Member = {
    id: data.user.id,
    guid: data.user.guid || current.guid,
    name: data.user.name,
    email: data.user.email,
    joinedAt: current.joinedAt,
  }

  try {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }

  return updated
}

/**
 * 로그아웃
 */
export async function logoutMember(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // ignore network error on logout
  } finally {
    clearMember()
  }
}

/**
 * 로컬 회원 세션 캐시 제거
 */
export function clearMember(): void {
  try {
    localStorage.removeItem(MEMBER_KEY)
  } catch {
    // ignore
  }
}
