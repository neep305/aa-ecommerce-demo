import type { CartItem } from "@/data/products"

const ORDERS_KEY = "aa-demo-orders"
const MAX_ORDERS = 50

export interface StoredOrder {
  orderId: string
  createdAt: string
  items: CartItem[]
  totalValue: number
}

export function getOrders(): StoredOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveOrder(order: StoredOrder): void {
  try {
    const orders = [order, ...getOrders()].slice(0, MAX_ORDERS)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  } catch {
    // localStorage 접근 불가(프라이빗 브라우징 등) — 데모 흐름은 계속 진행
  }
}

export function getMostRecentOrder(): StoredOrder | null {
  return getOrders()[0] ?? null
}
