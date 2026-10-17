import { useState } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import {
  initAdobeDataLayer,
  trackAddToCart,
  trackRemoveFromCart,
  trackPromoClick,
  trackInternalSearch,
  trackLogout,
  onLaunchReady,
  verifyLaunchSetup,
} from '@/analytics'
import { getMember, logoutMember } from '@/lib/members'
import { products } from '@/data/products'
import type { Product, CartItem } from '@/data/products'
import { useMountOnce } from '@/hooks/use-mount-once'
import type { StoreContextValue } from '@/hooks/use-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ImplementationGuidePanel } from '@/components/ImplementationGuidePanel'
import { ShoppingCart, Search, User, UserPlus, LogIn, LogOut } from 'lucide-react'

interface AnalyticsEvent {
  timestamp: string
  eventType: string
  details: string
  rawData: Record<string, unknown>
}

export function Layout() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [member, setMember] = useState(() => getMember())
  const [analyticsLog, setAnalyticsLog] = useState<AnalyticsEvent[]>([])

  const refreshMember = () => setMember(getMember())

  const logAnalyticsEvent = (eventType: string, details: string, rawData: Record<string, unknown>) => {
    setAnalyticsLog(prev => [{
      timestamp: new Date().toLocaleTimeString('ko-KR'),
      eventType,
      details,
      rawData
    }, ...prev].slice(0, 50))
  }

  // ACDL 초기화 + Launch 로드 후 연동 상태 검증 (console only — UI 변경 없음)
  useMountOnce(() => {
    initAdobeDataLayer()
  })
  useMountOnce(() => {
    onLaunchReady(() => {
      void verifyLaunchSetup()
    })
  })

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (window.location.pathname !== '/') {
      navigate('/')
    }
    if (term.trim()) {
      const results = products.filter(p =>
        p.name.toLowerCase().includes(term.toLowerCase()) ||
        p.category.toLowerCase().includes(term.toLowerCase())
      )
      const data = trackInternalSearch(term, results.length)
      logAnalyticsEvent('internalSearch', `검색어: "${term}" (${results.length}건)`, data)
    }
  }

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { ...product, quantity }]
    })
    const data = trackAddToCart(product, quantity)
    logAnalyticsEvent('scAdd', `장바구니 추가: ${product.name} x${quantity}`, data)
  }

  const handleRemoveFromCart = (productId: string) => {
    const item = cart.find(i => i.id === productId)
    if (item) {
      setCart(prev => prev.filter(i => i.id !== productId))
      const data = trackRemoveFromCart(item, item.quantity)
      logAnalyticsEvent('scRemove', `장바구니 삭제: ${item.name}`, data)
    }
  }

  const handleQuantityChange = (productId: string, delta: number) => {
    const item = cart.find(i => i.id === productId)
    if (!item) return
 
    if (item.quantity + delta <= 0) {
      handleRemoveFromCart(productId)
    } else {
      setCart(prev => prev.map(i =>
        i.id === productId ? { ...i, quantity: i.quantity + delta } : i
      ))
      if (delta > 0) {
        const data = trackAddToCart(item, delta)
        logAnalyticsEvent('scAdd', `수량 증가: ${item.name} +${delta}`, data)
      } else {
        const data = trackRemoveFromCart(item, Math.abs(delta))
        logAnalyticsEvent('scRemove', `수량 감소: ${item.name} ${delta}`, data)
      }
    }
  }

  const handlePromoClick = (promoName: string, position: string) => {
    const data = trackPromoClick(promoName, position)
    logAnalyticsEvent('promoClick', `프로모션 클릭: ${promoName}`, data)
  }

  const handleLogout = async () => {
    await logoutMember()
    refreshMember()
    const data = trackLogout()
    logAnalyticsEvent('logout', '로그아웃 완료 (비회원 전환)', data)
    navigate('/')
  }

  const clearCart = () => setCart([])

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const storeValue: StoreContextValue = {
    cart,
    cartCount,
    cartTotal,
    searchTerm,
    member,
    refreshMember,
    handleSearch,
    handleAddToCart,
    handleRemoveFromCart,
    handleQuantityChange,
    handlePromoClick,
    handleLogout,
    clearCart,
    logAnalyticsEvent,
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="text-xl font-bold text-stone-800 cursor-pointer shrink-0">
              🛍️ AA Demo Store
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="상품 검색..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-9 text-xs"
                />
              </div>
            </div>

            {/* 가입/로그인 여부에 따른 identityMap 상태 표시 */}
            <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-md border text-xs shrink-0">
              <span className="font-semibold text-stone-600 hidden md:inline shrink-0">identityMap:</span>
              {member ? (
                <Link
                  to="/mypage"
                  className="flex items-center gap-1.5 hover:underline"
                  title={member.guid ? `GUID (Primary): ${member.guid}\nEmail: ${member.email}` : "XDM identityMap에 반영되는 가입 정보 — 마이페이지에서 수정"}
                >
                  <User className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span className="font-medium text-stone-700">{member.name}</span>
                  <span className="text-stone-400 font-mono hidden lg:inline">({member.email})</span>
                </Link>
              ) : (
                <span className="text-stone-400">비회원 (identityMap 없음)</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!member ? (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="gap-1.5" title="로그인">
                      <LogIn className="w-4 h-4" />
                      <span className="hidden sm:inline">로그인</span>
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="gap-1.5" title="회원가입">
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">회원가입</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {/* My Page Button */}
                  <Link to="/mypage">
                    <Button variant="outline" size="icon" title="마이페이지">
                      <User className="w-5 h-5" />
                    </Button>
                  </Link>

                  {/* Logout Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-1 text-stone-600 hover:text-stone-900"
                    title="로그아웃"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </Button>
                </>
              )}

              {/* Cart Button */}
              <Link to="/cart">
                <Button variant="outline" className="relative" title="장바구니">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <main className="flex-1">
            <Outlet context={storeValue} />
          </main>

          {/* Analytics Log Panel */}
          <aside className="hidden xl:block w-96 shrink-0">
            <Card className="sticky top-20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  📊 Adobe 태깅 이벤트 로그
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="log">
                  <TabsList className="w-full">
                    <TabsTrigger value="log" className="flex-1 text-xs">이벤트 로그</TabsTrigger>
                    <TabsTrigger value="code" className="flex-1 text-xs">구현 코드</TabsTrigger>
                  </TabsList>
                  <TabsContent value="log">
                    <ScrollArea className="h-[calc(100vh-300px)]">
                      {analyticsLog.length === 0 ? (
                        <p className="text-center text-stone-400 py-8 text-sm">
                          이벤트가 발생하면 여기에 표시됩니다
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {analyticsLog.map((event, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-stone-50 rounded text-xs border-l-2 border-blue-500"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {event.eventType}
                                </Badge>
                                <span className="text-stone-400 text-[10px]">{event.timestamp}</span>
                              </div>
                              <p className="text-stone-700 mb-1">{event.details}</p>
                              <details className="text-stone-500">
                                <summary className="cursor-pointer hover:text-stone-700">데이터 보기</summary>
                                <pre className="mt-1 p-2 bg-stone-900 text-stone-100 rounded font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-words overflow-x-auto">
                                  {JSON.stringify(event.rawData, null, 2)}
                                </pre>
                              </details>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="code">
                    <ImplementationGuidePanel />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
