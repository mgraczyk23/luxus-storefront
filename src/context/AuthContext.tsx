'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  authSignIn, authRegister, createCustomerProfile, getCustomer,
  updateCustomer, type LxsCustomer,
} from '@/lib/auth'

const TOKEN_KEY = "lxs_auth_token"

type AuthCtx = {
  customer:        LxsCustomer | null
  token:           string | null
  isLoading:       boolean
  isLoggedIn:      boolean
  signIn:          (email: string, password: string) => Promise<void>
  signOut:         () => void
  register:        (first: string, last: string, email: string, password: string) => Promise<void>
  updateProfile:   (data: { first_name?: string; last_name?: string; phone?: string }) => Promise<void>
  refreshCustomer: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,     setToken]     = useState<string | null>(null)
  const [customer,  setCustomer]  = useState<LxsCustomer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const klaviyoIdentify = (c: LxsCustomer) => {
    const kq = (window as { _learnq?: unknown[] })._learnq
    if (!Array.isArray(kq)) return
    kq.push(['identify', {
      $email: c.email,
      $first_name: c.first_name ?? undefined,
      $last_name: c.last_name ?? undefined,
    }])
  }

  const loadCustomer = useCallback(async (t: string) => {
    const c = await getCustomer(t)
    if (c) {
      setCustomer(c)
      klaviyoIdentify(c)
    } else {
      // Token expired or invalid — clear it
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setCustomer(null)
    }
  }, [])

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) {
      setToken(stored)
      loadCustomer(stored).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [loadCustomer])

  const signIn = async (email: string, password: string) => {
    const t = await authSignIn(email, password)
    localStorage.setItem(TOKEN_KEY, t)
    setToken(t)
    const c = await getCustomer(t)
    setCustomer(c)
    if (c) klaviyoIdentify(c)
  }

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setCustomer(null)
  }

  const register = async (first: string, last: string, email: string, password: string) => {
    const regToken = await authRegister(email, password)
    await createCustomerProfile(regToken, first, last, email)
    // Sign in to get a proper session token
    await signIn(email, password)
  }

  const updateProfile = async (data: { first_name?: string; last_name?: string; phone?: string }) => {
    if (!token) throw new Error("Not logged in")
    const updated = await updateCustomer(token, data)
    setCustomer(updated)
  }

  const refreshCustomer = async () => {
    if (token) await loadCustomer(token)
  }

  return (
    <AuthContext.Provider value={{
      customer, token, isLoading,
      isLoggedIn: !!customer,
      signIn, signOut, register, updateProfile, refreshCustomer,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
