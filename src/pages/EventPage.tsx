import { Link } from 'react-router-dom'
import { trackPageView } from '@/analytics'
import { products } from '@/data/products'
import { formatPrice } from '@/lib/utils'
import { useStore } from '@/hooks/use-store'
import { useMountOnce } from '@/hooks/use-mount-once'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tag } from 'lucide-react'

export function EventPage() {
  const { handlePromoClick, logAnalyticsEvent } = useStore()

  useMountOnce(() => {
    const data = trackPageView('이벤트페이지', 'ecommerce')
    logAnalyticsEvent('pageView', '이벤트 페이지 로드', data)
  })

  const saleProducts = products.filter(p => p.originalPrice)

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-8 rounded-lg mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="w-8 h-8" />
          <h1 className="text-2xl font-bold">🎉 신년 특별 세일! 최대 30% 할인</h1>
        </div>
        <p className="opacity-90">기간 한정 특가 상품을 지금 만나보세요.</p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => handlePromoClick('신년 세일', 'event_page_cta')}
        >
          할인 상품 보기
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {saleProducts.map(product => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition">
            <CardHeader className="p-0">
              <Link
                to={`/product/${product.id}`}
                className="h-40 bg-stone-100 flex items-center justify-center text-6xl"
              >
                {product.image}
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <CardTitle className="text-base mb-1">
                <Link to={`/product/${product.id}`} className="hover:text-blue-600">
                  {product.name}
                </Link>
              </CardTitle>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-blue-600">{formatPrice(product.price)}</span>
                <span className="text-sm text-stone-400 line-through">
                  {formatPrice(product.originalPrice!)}
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Link to={`/product/${product.id}`} className="w-full">
                <Button className="w-full">자세히 보기</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  )
}
