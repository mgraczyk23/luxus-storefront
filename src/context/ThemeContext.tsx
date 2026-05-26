'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'

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
  t: Theme
}

const ThemeContext = createContext<ThemeContextType>({
  t: LIGHT,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.style.background = LIGHT.bg
    document.body.style.color = LIGHT.text
    document.documentElement.setAttribute('data-theme', 'light')
  }, [])

  return (
    <ThemeContext.Provider value={{ t: LIGHT }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
