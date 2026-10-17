import { useOutletContext } from 'react-router-dom'
import type { Product, CartItem } from '@/data/products'
import type { Member } from '@/lib/members'

export interface StoreContextValue {
  cart: CartItem[]
  cartCount: number
  cartTotal: number
  searchTerm: string
  member: Member | null
  refreshMember: () => void
  handleSearch: (term: string) => void
  handleAddToCart: (product: Product, quantity?: number) => void
  handleRemoveFromCart: (productId: string) => void
  handleQuantityChange: (productId: string, delta: number) => void
  handlePromoClick: (promoName: string, position: string) => void
  handleLogout: () => Promise<void>
  clearCart: () => void
  logAnalyticsEvent: (eventType: string, details: string, rawData: Record<string, unknown>) => void
}

export function useStore(): StoreContextValue {
  return useOutletContext<StoreContextValue>()
}
