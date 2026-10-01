/* Révélation au scroll, avec décalage en cascade. */

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  once?: boolean
}

export function Reveal({ children, delay = 0, y = 26, className, once = true }: RevealProps) {
  const reduced = useReducedMotion()

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, margin: '-12% 0px -8% 0px' }}
      transition={{ duration: 0.62, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
}

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

interface StaggerProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'ul' | 'section'
}

export function Stagger({ children, className, as = 'div' }: StaggerProps) {
  const reduced = useReducedMotion()

  if (reduced) {
    if (as === 'ul') return <ul className={className}>{children}</ul>
    if (as === 'section') return <section className={className}>{children}</section>
    return <div className={className}>{children}</div>
  }

  const shared = {
    className,
    variants: staggerParent,
    initial: 'hidden',
    whileInView: 'visible',
    viewport: { once: true, margin: '-8% 0px' },
  } as const

  if (as === 'ul') return <motion.ul {...shared}>{children}</motion.ul>
  if (as === 'section') return <motion.section {...shared}>{children}</motion.section>
  return <motion.div {...shared}>{children}</motion.div>
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  if (reduced) return <li className={className}>{children}</li>

  return (
    <motion.li className={className} variants={staggerChild}>
      {children}
    </motion.li>
  )
}
