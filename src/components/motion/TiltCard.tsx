/* Conteneur de carte sans effet de mouvement. */

import type { HTMLAttributes, ReactNode } from 'react'

interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  intensity?: number
}

export function TiltCard({ children, className, ...rest }: TiltCardProps) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  )
}
