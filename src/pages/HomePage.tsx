import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { trackPageView } from '@/analytics'
import { products } from '@/data/products'
import { formatPrice } from '@/lib/utils'
import { useStore } from '@/hooks/use-store'
import { useMountOnce } from '@/hooks/use-mount-once'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Tag, Eye } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()
  const { searchTerm, handleAddToCart, handlePromoClick, logAnalyticsEvent } = useStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useMountOnce(() => {
    const data = trackPageView('홈페이지', 'ecommerce')
    logAnalyticsEvent('pageView', '홈페이지 로드', data)
  })

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...new Set(products.map(p => p.category))]

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat)
    const data = trackPageView(cat === 'all' ? '전체상품' : cat, 'ecommerce')
    logAnalyticsEvent('pageView', `카테고리: ${cat === 'all' ? '전체' : cat}`, data)
  }

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`)
  }

  const handlePromoBannerClick = () => {
    handlePromoClick('신년 세일', 'hero_banner')
  }

  return (
    <>
      {/* Promo Banner */}
      <Link
        to="/event"
        className="block bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-lg mb-6 cursor-pointer hover:opacity-90 transition"
        onClick={handlePromoBannerClick}
      >
        <div className="flex items-center gap-3">
          <Tag className="w-6 h-6" />
          <div>
            <p className="font-bold text-lg">🎉 신년 특별 세일! 최대 30% 할인</p>
            <p className="text-sm opacity-90">지금 바로 확인하세요</p>
          </div>
        </div>
      </Link>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategorySelect(cat)}
          >
            {cat === 'all' ? '전체' : cat}
          </Button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition group">
            <CardHeader className="p-0">
              <div
                className="h-40 bg-stone-100 flex items-center justify-center text-6xl cursor-pointer relative"
                onClick={() => handleProductClick(product.id)}
              >
                {product.image}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-70 transition" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <CardTitle
                className="text-base mb-1 cursor-pointer hover:text-blue-600"
                onClick={() => handleProductClick(product.id)}
              >
                {product.name}
              </CardTitle>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-blue-600">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-stone-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                className="w-full"
                onClick={() => handleAddToCart(product)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                장바구니 담기
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-stone-500">
          <p>검색 결과가 없습니다</p>
        </div>
      )}
    </>
  )
}
