import { useRef } from "react"
import type { TouchEvent } from "react"

// Minimum horizontal drag distance (px) before a touch gesture counts as a
// swipe rather than a tap or an attempted vertical scroll.
const SWIPE_THRESHOLD = 40

// Plain touch-event swipe detection — no gesture library. Spread the
// returned handlers onto any element to get left/right swipe callbacks.
export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)

  return {
    onTouchStart: (e: TouchEvent) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
    },
    onTouchEnd: (e: TouchEvent) => {
      const sx = startX.current
      const sy = startY.current
      startX.current = null
      startY.current = null
      if (sx === null || sy === null) return

      const dx = e.changedTouches[0].clientX - sx
      const dy = e.changedTouches[0].clientY - sy
      // Ignore short drags and ones that are mostly vertical (a scroll
      // attempt, not a swipe).
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return

      if (dx < 0) onSwipeLeft()
      else onSwipeRight()
    },
  }
}
