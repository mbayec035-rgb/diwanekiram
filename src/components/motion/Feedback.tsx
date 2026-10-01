/* Chiffre animé au scroll + transition de page + barre de progression. */

import { AnimatePresence, motion, useReducedMotion, useScroll } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useCountUp } from '../../hooks/useMisc'

export function CountUpText({
  value,
  suffix = '',
  className,
}: {
  value: number
  suffix?: string
  className?: string
}) {
  const [ref, current] = useCountUp(value)
  return (
    <span ref={ref} className={className}>
      {current.toLocaleString('fr-FR')}
      {suffix}
    </span>
  )
}

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const reduced = useReducedMotion()

  if (reduced) return <div className="page">{children}</div>

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="page"
        initial={{ opacity: 0, y: 14, filter: 'blur(7px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()

  return <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
}
