'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'

export const DARK = {
  bg:          "#0a0a0a",
  bgSurface:   "#161616",
  bgCard:      "#1c1c1c",
  bgCardHover: "#242424",
  border:      "#2a2a2a",
  borderHover: "#3a3a3a",
  gold:        "#c09530",
  goldLight:   "#d4aa4a",
  goldDark:    "#8e6e1e",
  text:        "#ededed",
  textMuted:   "#9a9a9a",
  textDim:     "#606060",
  overlay:     "rgba(12,11,10,0.88)",
} as const

export const LIGHT = {
  bg:          "#ffffff",
  bgSurface:   "#f3f3f5",
  bgCard:      "#ffffff",
  bgCardHover: "#fafafa",
  border:      "#e4e4e6",
  borderHover: "#c8c8cc",
  gold:        "#7e5e10",
  goldLight:   "#9a7218",
  goldDark:    "#c09530",
  text:        "#1a1a1a",
  textMuted:   "#525258",
  textDim:     "#707076",
  overlay:     "rgba(255,255,255,0.92)",
} as const

export type Theme = {
  bg: string; bgSurface: string; bgCard: string; bgCardHover: string
  border: string; borderHover: string
  gold: string; goldLight: string; goldDark: string
  text: string; textMuted: string; textDim: string
  overlay: string
}

type ThemeContextType = {
  isDark: boolean
  setIsDark: (v: boolean) => void
  toggle: () => void
  t: Theme
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  setIsDark: () => {},
  toggle: () => {},
  t: LIGHT,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.style.background = LIGHT.bg
    document.body.style.color = LIGHT.text
    document.documentElement.setAttribute('data-theme', 'light')
  }, [])

  return (
    <ThemeContext.Provider value={{ isDark: false, setIsDark: () => {}, toggle: () => {}, t: LIGHT }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
