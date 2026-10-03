/* Suivi du verset courant dans le lecteur (IntersectionObserver). */

import { useCallback, useEffect, useRef, useState } from 'react'

export function useReadingProgress(ids: string[], enabled: boolean) {
  const containerRef = useRef<HTMLElement | null>(null)
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null)

  useEffect(() => {
    if (!enabled || ids.length === 0) return

    const visible = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top)
          else visible.delete(entry.target.id)
        }

        if (visible.size === 0) return
        const [topId] = [...visible.entries()].sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0]
        if (topId) setActiveId(topId)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.01, 1] },
    )

    const container = containerRef.current
    if (!container) return

    for (const id of ids) {
      const element = container.querySelector<HTMLElement>(`[data-verse-id="${CSS.escape(id)}"]`)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [ids, enabled])

  const scrollTo = useCallback((id: string) => {
    const container = containerRef.current
    const element = container?.querySelector<HTMLElement>(`[data-verse-id="${CSS.escape(id)}"]`)
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    element?.scrollIntoView({ behavior, block: 'center' })
    setActiveId(id)
  }, [])

  return { containerRef, activeId, setActiveId, scrollTo }
}