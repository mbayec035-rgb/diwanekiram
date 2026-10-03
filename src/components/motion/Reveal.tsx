/* Conteneurs de mise en page sans animation. */

import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  once?: boolean
}

export function Reveal({ children, delay = 0, y = 26, className, once = true }: RevealProps) {
  void delay
  void y
  void once
  return <div className={className}>{children}</div>
}

interface StaggerProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'ul' | 'section'
}

export function Stagger({ children, className, as = 'div' }: StaggerProps) {
  if (as === 'ul') return <ul className={className}>{children}</ul>
  if (as === 'section') return <section className={className}>{children}</section>
  return <div className={className}>{children}</div>
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <li className={className}>{children}</li>
}
