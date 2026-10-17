import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { trackProductView } from '@/analytics'
import { getProductById } from '@/data/products'
import { formatPrice, renderStars } from '@/lib/utils'
import { useStore } from '@/hooks/use-store'
import { useMountOnce } from '@/hooks/use-mount-once'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { handleAddToCart, logAnalyticsEvent } = useStore()

  const product = id ? getProductById(id) : undefined

  useMountOnce(() => {
    if (!product) return
    const data = trackProductView(product)
    logAnalyticsEvent('prodView', `상품 조회: ${product.name}`, data)
  })

  if (!product) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">{product.name}</h2>
        <Badge variant="secondary">{product.category}</Badge>
        <span className="ml-2 text-amber-500">
          {renderStars(product.rating)} ({product.reviews} 리뷰)
        </span>
      </div>
      <div className="py-4">
        <div className="h-48 bg-stone-100 rounded-lg flex items-center justify-center text-8xl mb-4">
          {product.image}
        </div>
        <p className="text-stone-600 mb-4">{product.description}</p>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-stone-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => handleAddToCart(product)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            장바구니 담기
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              handleAddToCart(product)
              navigate('/cart')
            }}
          >
            바로 구매
          </Button>
        </div>
      </div>
    </div>
  )
}
