import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { trackPageView, trackSignUp } from '@/analytics'
import { signUpMember, checkEmailAvailable } from '@/lib/members'
import { useStore } from '@/hooks/use-store'
import { useMountOnce } from '@/hooks/use-mount-once'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignUpPage() {
  const navigate = useNavigate()
  const { member, refreshMember, logAnalyticsEvent } = useStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<{ isChecking: boolean; message: string; isError: boolean }>({
    isChecking: false,
    message: '',
    isError: false,
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useMountOnce(() => {
    const data = trackPageView('회원가입', 'ecommerce')
    logAnalyticsEvent('pageView', '회원가입 페이지 로드', data)
  })

  // 이미 가입/로그인된 상태면 마이페이지로 이동
  if (member) {
    return <Navigate to="/mypage" replace />
  }

  // 이메일 입력창 focus out 시 중복 체크
  const handleEmailBlur = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setEmailStatus({ isChecking: false, message: '', isError: false })
      return
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailStatus({ isChecking: false, message: '올바른 이메일 형식을 입력해 주세요.', isError: true })
      return
    }

    setEmailStatus({ isChecking: true, message: '이메일 확인 중...', isError: false })
    const result = await checkEmailAvailable(trimmed)

    if (!result.isAvailable) {
      setEmailStatus({
        isChecking: false,
        message: result.message || '이미 등록된 이메일 주소입니다.',
        isError: true,
      })
    } else {
      setEmailStatus({
        isChecking: false,
        message: '사용 가능한 이메일 주소입니다.',
        isError: false,
      })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('이름을 입력해 주세요.')
      return
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('올바른 이메일 형식을 입력해 주세요.')
      return
    }
    if (emailStatus.isError) {
      setError(emailStatus.message || '이메일을 다시 확인해 주세요.')
      return
    }
    if (!password || password.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.')
      return
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const created = await signUpMember(name.trim(), email.trim(), password)
      refreshMember()

      const data = trackSignUp(created.name, created.email, created.guid)
      logAnalyticsEvent('signUp', `회원가입 완료: ${created.name} (${created.email})`, data)

      navigate('/mypage')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '회원가입에 실패했습니다.'
      setError(msg)
      if (msg.includes('이미 등록된') || msg.includes('사용 중인')) {
        setEmailStatus({ isChecking: false, message: msg, isError: true })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          회원가입
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <p className="text-xs text-stone-400">
            가입한 계정 정보는 SQLite DB에 안전하게 저장되며, 이후 모든 XDM 이벤트의{' '}
            <code className="bg-stone-100 px-1 py-0.5 rounded text-blue-600 font-mono">identityMap</code>에 반영됩니다.
          </p>
          <div>
            <Label htmlFor="signup-name">이름</Label>
            <Input
              id="signup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
              required
            />
          </div>
          <div>
            <Label htmlFor="signup-email">이메일</Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailStatus.message) {
                  setEmailStatus({ isChecking: false, message: '', isError: false })
                }
              }}
              onBlur={handleEmailBlur}
              placeholder="example@domain.com"
              autoComplete="email"
              required
              className={emailStatus.isError ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {emailStatus.message && (
              <div
                className={`flex items-center gap-1 text-xs mt-1.5 ${
                  emailStatus.isError ? 'text-red-500 font-medium' : 'text-emerald-600 font-medium'
                }`}
              >
                {emailStatus.isError ? (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{emailStatus.message}</span>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="signup-password">비밀번호 (4자 이상)</Label>
            <Input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <Label htmlFor="signup-confirm-password">비밀번호 확인</Label>
            <Input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 재입력"
              autoComplete="new-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading || emailStatus.isError}>
            {loading ? '가입 처리 중...' : '가입하기'}
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs text-stone-500 w-full pt-2 border-t">
            <span>이미 계정이 있으신가요?</span>
            <Link to="/login" className="text-blue-600 hover:underline font-medium flex items-center gap-1">
              <LogIn className="w-3.5 h-3.5" />
              로그인
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
