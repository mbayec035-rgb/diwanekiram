/* Bouton à effet magnétique (desktop) avec variantes. */

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes = `button button--${variant} button--${size} ${className}`.trim()

  return (
    <button className={classes} {...rest}>
      {children}
      {icon}
    </button>
  )
}