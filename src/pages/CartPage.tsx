import { Link, useNavigate } from 'react-router-dom'
import { trackCartView } from '@/analytics'
import { formatPrice } from '@/lib/utils'
import { useStore } from '@/hooks/use-store'
import { useMountOnce } from '@/hooks/use-mount-once'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CreditCard, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'

export function CartPage() {
  const navigate = useNavigate()
  const {
    cart,
    cartCount,
    cartTotal,
    handleRemoveFromCart,
    handleQuantityChange,
    logAnalyticsEvent,
  } = useStore()

  useMountOnce(() => {
    if (cart.length > 0) {
      const data = trackCartView(cart)
      logAnalyticsEvent('scView', `장바구니 조회 (${cart.length}개 상품)`, data)
    }
  })

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">장바구니 ({cartCount})</h2>
      <div className="flex flex-col">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-500 mb-4">장바구니가 비어있습니다</p>
            <Link to="/">
              <Button variant="outline">
                <ShoppingCart className="w-4 h-4 mr-2" />
                쇼핑 계속하기
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[calc(100vh-320px)]">
              <div className="space-y-3 pr-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 p-3 bg-stone-50 rounded-lg">
                    <div className="text-3xl">{item.image}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-stone-600 text-sm">{formatPrice(item.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 ml-auto text-red-500"
                          onClick={() => handleRemoveFromCart(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t pt-4 mt-4 space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>총 금액</span>
                <span className="text-blue-600">{formatPrice(cartTotal)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={() => navigate('/checkout')}>
                <CreditCard className="w-4 h-4 mr-2" />
                결제하기
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
