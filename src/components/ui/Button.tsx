/* Bouton à effet magnétique (desktop) avec variantes. */

import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  magnetic?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  magnetic = true,
  className = '',
  children,
  onPointerMove,
  onPointerLeave,
  ...rest
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement | null>(null)
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const spring = { stiffness: 300, damping: 20, mass: 0.4 }
  const mx = useSpring(x, spring)
  const my = useSpring(y, spring)

  const handleMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(event)
    if (!magnetic || reduced) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * 14)
    y.set(((event.clientY - rect.top) / rect.height - 0.5) * 10)
  }

  const handleLeave = (event: React.PointerEvent<HTMLButtonElement>) => {
    onPointerLeave?.(event)
    x.set(0)
    y.set(0)
  }

  const classes = `button button--${variant} button--${size} ${className}`.trim()

  if (reduced || !magnetic) {
    return (
      <button ref={ref} className={classes} onPointerMove={handleMove} onPointerLeave={handleLeave} {...rest}>
        {children}
        {icon}
      </button>
    )
  }

  return (
    <motion.button
      ref={ref}
      className={classes}
      style={{ x: mx, y: my }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      whileTap={{ scale: 0.97 }}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {children}
      {icon}
    </motion.button>
  )
}