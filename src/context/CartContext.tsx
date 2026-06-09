'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { MappedProduct } from '@/lib/medusa'

const CART_KEY = 'lxs_cart'

export type CartItem = {
  id: string
  handle: string
  title: string
  brand: string | null
  price: number
  thumbnail: string | null
  quantity: number
  variant_id: string | null
}

type CartContextType = {
  cartItems: CartItem[]
  cartCount: number
  addItem: (product: MappedProduct) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  isInCart: (id: string) => boolean
}

const CartContext = createContext<CartContextType | null>(null)

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    setCartItems(readCart())
  }, [])

  const persist = useCallback((items: CartItem[]) => {
    setCartItems(items)
    writeCart(items)
  }, [])

  const addItem = useCallback((product: MappedProduct) => {
    if (!product.price) return
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      const next = existing
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, {
            id: product.id,
            handle: product.handle,
            title: product.title,
            brand: product.brand,
            price: product.price!,
            thumbnail: product.thumbnail,
            quantity: 1,
            variant_id: product.variant_id ?? null,
          }]
      writeCart(next)
      return next
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setCartItems(prev => {
      const next = prev.filter(i => i.id !== id)
      writeCart(next)
      return next
    })
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return
    setCartItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, quantity } : i)
      writeCart(next)
      return next
    })
  }, [])

  const clearCart = useCallback(() => persist([]), [persist])

  const isInCart = useCallback((id: string) => cartItems.some(i => i.id === id), [cartItems])

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ cartItems, cartCount, addItem, removeItem, updateQuantity, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
