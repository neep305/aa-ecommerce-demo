import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { trackCheckoutStart, trackPurchase } from '@/analytics'
import { formatPrice } from '@/lib/utils'
import { saveOrder } from '@/lib/orders'
import { useStore } from '@/hooks/use-store'
import { useMountOnce } from '@/hooks/use-mount-once'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CreditCard, UserPlus } from 'lucide-react'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, cartTotal, clearCart, member, logAnalyticsEvent } = useStore()
  // 마운트 시점에만 판단 — 구매 완료 처리 중 clearCart()로 cart가 비워지면서
  // /order-complete로 이동하는 도중 이 페이지가 재렌더링돼도 여기로 다시 리다이렉트되지 않도록 함
  const [wasEmptyOnMount] = useState(() => cart.length === 0)

  useMountOnce(() => {
    if (cart.length === 0) return
    const data = trackCheckoutStart(cart, 1)
    logAnalyticsEvent('scCheckout', '체크아웃 시작', data)
  })

  if (wasEmptyOnMount) {
    return <Navigate to="/cart" replace />
  }

  const handlePurchaseComplete = () => {
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const data = trackPurchase(cart, orderId)
    logAnalyticsEvent('purchase', `구매 완료: ${orderId}`, data)

    saveOrder({
      orderId,
      createdAt: new Date().toISOString(),
      items: cart,
      totalValue: cartTotal,
    })

    const items = cart
    const totalValue = cartTotal
    clearCart()
    navigate('/order-complete', { state: { orderId, items, totalValue } })
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          결제 정보 입력
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-stone-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium mb-3">주문 상품</h4>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.image} {item.name} x{item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between font-bold">
            <span>총 결제금액</span>
            <span className="text-blue-600">{formatPrice(cartTotal)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {member ? (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
              <p className="text-stone-500 text-xs mb-1">가입 정보로 주문합니다 (identityMap 반영)</p>
              <p className="font-medium text-stone-800">{member.name}</p>
              <p className="text-stone-500 font-mono text-xs">{member.email}</p>
            </div>
          ) : (
            <div className="bg-stone-50 border rounded-lg p-3 text-sm flex items-center justify-between gap-3">
              <p className="text-stone-500 text-xs">
                비회원으로 주문합니다 (identityMap 없음)
              </p>
              <Link to="/signup">
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <UserPlus className="w-3.5 h-3.5" />
                  회원가입
                </Button>
              </Link>
            </div>
          )}
          <div>
            <Label>전화번호</Label>
            <Input type="tel" placeholder="010-1234-5678" />
          </div>
          <div>
            <Label>배송 주소</Label>
            <Input placeholder="서울시 강남구..." />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button variant="outline" onClick={() => navigate('/')}>
          쇼핑 계속하기
        </Button>
        <Button className="flex-1" onClick={handlePurchaseComplete}>
          결제 완료하기
        </Button>
      </CardFooter>
    </Card>
  )
}
