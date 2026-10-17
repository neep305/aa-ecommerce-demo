import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { trackPageView } from '@/analytics'
import { updateMember } from '@/lib/members'
import { getOrders, type StoredOrder } from '@/lib/orders'
import { formatPrice } from '@/lib/utils'
import { useStore } from '@/hooks/use-store'
import { useMountOnce } from '@/hooks/use-mount-once'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Package, User, UserPlus, LogIn, LogOut, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function MyPage() {
  const navigate = useNavigate()
  const { member, refreshMember, handleLogout, logAnalyticsEvent } = useStore()
  const [orders] = useState<StoredOrder[]>(() => getOrders())
  const [name, setName] = useState(member?.name ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  useMountOnce(() => {
    const data = trackPageView('마이페이지', 'ecommerce')
    logAnalyticsEvent('pageView', '마이페이지 로드', data)
  })

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setSaveError('이름과 이메일을 입력해 주세요.')
      return
    }

    setSaving(true)
    setSaveError('')
    setSaveMessage('')

    try {
      await updateMember({ name: name.trim(), email: email.trim() })
      refreshMember()
      logAnalyticsEvent('identityUpdate', `회원 정보 수정: ${name} (${email})`, { guid: member?.guid, name, email })
      setSaveMessage('회원 정보가 성공적으로 저장되었습니다.')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '회원 정보 수정에 실패했습니다.'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  const onLogoutClick = async () => {
    await handleLogout()
    navigate('/')
  }

  if (!member) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-10 text-center space-y-4">
          <User className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-stone-500 text-sm">
            아직 로그인되지 않았습니다.<br />
            로그인 또는 회원가입 후 identityMap이 실제 회원 정보로 채워집니다.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link to="/login">
              <Button variant="default" className="gap-1.5">
                <LogIn className="w-4 h-4" />
                로그인
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" className="gap-1.5">
                <UserPlus className="w-4 h-4" />
                회원가입
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <User className="w-5 h-5" />
            내 정보 (Identity Context)
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogoutClick}
            className="gap-1.5 text-stone-600 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-stone-500">가입일</Label>
              <p className="font-medium text-stone-800">
                {new Date(member.joinedAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
            {member.guid && (
              <div>
                <Label className="text-xs text-stone-500">회원 고유 식별자 (GUID / Primary Identity)</Label>
                <p className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded mt-0.5 break-all">
                  {member.guid}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-3 pt-3 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="user-name-input" className="text-xs font-semibold text-stone-700">
                  XDM identityMap 이름 (name)
                </Label>
                <Input
                  id="user-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="user-email-input" className="text-xs font-semibold text-stone-700">
                  XDM identityMap 이메일 주소 (email)
                </Label>
                <Input
                  id="user-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>

            {saveError && <p className="text-xs text-red-500 font-medium">{saveError}</p>}
            {saveMessage && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saveMessage}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-stone-400">
                가입 정보 수정 시 SQLite DB 및 모든 XDM 페이로드의 <code className="bg-stone-100 px-1 py-0.5 rounded text-blue-600 font-mono">identityMap</code>에 실시간 반영됩니다.
              </p>
              <Button size="sm" onClick={handleSave} disabled={saving} className="shrink-0">
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Package className="w-5 h-5" />
            주문내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-stone-400 py-8 text-sm">
              아직 주문 내역이 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order, idx) => (
                <div key={order.orderId}>
                  {idx > 0 && <Separator className="mb-3" />}
                  <div className="flex justify-between items-start text-sm mb-1">
                    <span className="font-medium">{order.orderId}</span>
                    <span className="text-stone-400 text-xs">
                      {new Date(order.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-stone-600 text-sm mb-1">
                    {order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                  </p>
                  <p className="text-blue-600 font-bold text-sm">{formatPrice(order.totalValue)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
