/* Carte à inclinaison 3D + lumière suivant le curseur (sans re-render). */

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'

const MAX_TILT = 7
const MAX_LIFT = 6

interface TiltCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  intensity?: number
}

export function TiltCard({ children, intensity = 1, className, style, ...rest }: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotion()

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const hover = useMotionValue(0)

  const spring = { stiffness: 220, damping: 22, mass: 0.6 }
  const rotateX = useSpring(useTransform(py, [0, 1], [MAX_TILT, -MAX_TILT]), spring)
  const rotateY = useSpring(useTransform(px, [0, 1], [-MAX_TILT, MAX_TILT]), spring)
  const translateZ = useSpring(useTransform(hover, [0, 1], [0, MAX_LIFT]), spring)
  const tiltX = useTransform(rotateX, (value) => value * intensity)
  const tiltY = useTransform(rotateY, (value) => value * intensity)
  const glowX = useTransform(px, (value) => `${value * 100}%`)
  const glowY = useTransform(py, (value) => `${value * 100}%`)

  const glow = useMotionTemplate`radial-gradient(420px circle at ${glowX} ${glowY}, var(--sheen), transparent 62%)`

  if (reduced) {
    return (
      <div
        className={className}
        style={style as React.CSSProperties}
        {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...style,
        rotateX: tiltX,
        rotateY: tiltY,
        z: translateZ,
        transformStyle: 'preserve-3d',
      }}
      onPointerMove={(event) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        px.set((event.clientX - rect.left) / rect.width)
        py.set((event.clientY - rect.top) / rect.height)
      }}
      onPointerEnter={() => hover.set(1)}
      onPointerLeave={() => {
        px.set(0.5)
        py.set(0.5)
        hover.set(0)
      }}
      {...rest}
    >
      <motion.span className="tilt-glow" style={{ backgroundImage: glow }} aria-hidden="true" />
      {children}
    </motion.div>
  )
}
