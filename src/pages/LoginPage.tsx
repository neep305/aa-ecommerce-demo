import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { trackPageView, trackLogin } from '@/analytics'
import { loginMember } from '@/lib/members'
import { useStore } from '@/hooks/use-store'
import { useMountOnce } from '@/hooks/use-mount-once'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn, UserPlus } from 'lucide-react'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const navigate = useNavigate()
  const { member, refreshMember, logAnalyticsEvent } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useMountOnce(() => {
    const data = trackPageView('로그인', 'ecommerce')
    logAnalyticsEvent('pageView', '로그인 페이지 로드', data)
  })

  // 이미 로그인된 상태면 마이페이지로 이동
  if (member) {
    return <Navigate to="/mypage" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('올바른 이메일 형식을 입력해 주세요.')
      return
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const loggedIn = await loginMember(email.trim(), password)
      refreshMember()

      const data = trackLogin(loggedIn.name, loggedIn.email, loggedIn.guid)
      logAnalyticsEvent('login', `로그인 성공: ${loggedIn.name} (${loggedIn.email})`, data)

      navigate('/mypage')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '로그인에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="w-5 h-5" />
          로그인
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <p className="text-xs text-stone-400">
            SQLite 회원 DB에 저장된 계정 정보로 로그인합니다. 로그인 후 모든 XDM 이벤트의{' '}
            <code className="bg-stone-100 px-1 py-0.5 rounded text-blue-600 font-mono">identityMap</code>에 반영됩니다.
          </p>
          <div>
            <Label htmlFor="login-email">이메일</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label htmlFor="login-password">비밀번호</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs text-stone-500 w-full pt-2 border-t">
            <span>아직 계정이 없으신가요?</span>
            <Link to="/signup" className="text-blue-600 hover:underline font-medium flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" />
              회원가입
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
