import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { CartItem } from '@/data/products'
import { formatPrice } from '@/lib/utils'
import { getMostRecentOrder } from '@/lib/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CheckCircle2, Package } from 'lucide-react'

interface OrderCompleteState {
  orderId: string
  items: CartItem[]
  totalValue: number
}

export function OrderCompletePage() {
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state as OrderCompleteState | null
  const fallback = state ? null : getMostRecentOrder()

  const orderId = state?.orderId ?? fallback?.orderId
  const totalValue = state?.totalValue ?? fallback?.totalValue

  if (!orderId) {
    return <Navigate to="/" replace />
  }

  return (
    <Card className="max-w-2xl mx-auto text-center">
      <CardContent className="py-12">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">주문이 완료되었습니다!</h2>
        <p className="text-stone-500 mb-4">주문번호: {orderId}</p>
        {totalValue !== undefined && (
          <p className="text-stone-600 mb-4">결제금액: {formatPrice(totalValue)}</p>
        )}
        <div className="bg-stone-50 p-4 rounded-lg inline-block">
          <Package className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="text-sm text-stone-600">
            주문하신 상품은 2-3일 내에 배송될 예정입니다.
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button onClick={() => navigate('/')}>
          쇼핑 계속하기
        </Button>
      </CardFooter>
    </Card>
  )
}
