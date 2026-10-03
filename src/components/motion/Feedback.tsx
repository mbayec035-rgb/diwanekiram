/* Valeurs immédiates, fondu de page et barre de progression. */

import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

export function CountUpText({
  value,
  suffix = '',
  className,
}: {
  value: number
  suffix?: string
  className?: string
}) {
  return (
    <span className={className}>
      {value.toLocaleString('fr-FR')}
      {suffix}
    </span>
  )
}

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <div key={location.pathname} className="page page-route">{children}</div>
}

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0
      if (ref.current) ref.current.style.transform = `scaleX(${progress})`
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return <div ref={ref} className="scroll-progress" aria-hidden="true" />
}
