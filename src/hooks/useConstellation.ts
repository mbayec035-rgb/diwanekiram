/* =========================================================
   Constellation de particules — canvas 2D, 60 fps.
   Les particules se repoussent sous le curseur et se relient
   lorsqu'elles sont proches. Pause quand l'onglet est masqué.
   ========================================================= */

import { useEffect, type RefObject } from 'react'
import { useReducedMotion } from 'framer-motion'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
  warm: boolean
}

const LINK_DISTANCE = 132
const POINTER_RADIUS = 158
const MAX_PARTICLES = 82
const MIN_PARTICLES = 26

export function useConstellation(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled = true,
) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !enabled || reduced) return

    const context = canvas.getContext('2d')
    if (!context) return

    const root = document.documentElement
    let colors = readColors(root)

    const readTheme = () => {
      colors = readColors(root)
    }

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0
    let running = true

    const pointer = { x: -9999, y: -9999 }

    const spawn = () => {
      const target = Math.round(
        Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, (width * height) / 22000)),
      )
      particles = Array.from({ length: target }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.5 + 0.7,
        alpha: Math.random() * 0.34 + 0.14,
        warm: Math.random() > 0.72,
      }))
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      spawn()
    }

    const draw = () => {
      if (!running) return
      context.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i]
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < -10) particle.x = width + 10
        if (particle.x > width + 10) particle.x = -10
        if (particle.y < -10) particle.y = height + 10
        if (particle.y > height + 10) particle.y = -10

        const dx = pointer.x - particle.x
        const dy = pointer.y - particle.y
        const distance = Math.hypot(dx, dy)

        if (distance < POINTER_RADIUS && distance > 0.01) {
          const push = (POINTER_RADIUS - distance) / POINTER_RADIUS
          particle.x -= (dx / distance) * push * 7
          particle.y -= (dy / distance) * push * 7

          context.strokeStyle = `rgba(${colors.link}, ${0.3 * push})`
          context.lineWidth = 1
          context.beginPath()
          context.moveTo(particle.x, particle.y)
          context.lineTo(pointer.x, pointer.y)
          context.stroke()
        }

        context.fillStyle = `rgba(${particle.warm ? colors.warm : colors.cool}, ${particle.alpha})`
        context.beginPath()
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2)
        context.fill()

        for (let j = i + 1; j < particles.length; j += 1) {
          const other = particles[j]
          const ddx = particle.x - other.x
          const ddy = particle.y - other.y
          const gap = Math.hypot(ddx, ddy)
          if (gap < LINK_DISTANCE) {
            context.strokeStyle = `rgba(${colors.link}, ${0.16 * (1 - gap / LINK_DISTANCE)})`
            context.lineWidth = 0.6
            context.beginPath()
            context.moveTo(particle.x, particle.y)
            context.lineTo(other.x, other.y)
            context.stroke()
          }
        }
      }

      frame = requestAnimationFrame(draw)
    }

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
    }

    const onPointerLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
    }

    const onVisibility = () => {
      running = !document.hidden
      if (running) frame = requestAnimationFrame(draw)
      else cancelAnimationFrame(frame)
    }

    const observer = new MutationObserver(readTheme)

    resize()
    frame = requestAnimationFrame(draw)

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      observer.disconnect()
      context.clearRect(0, 0, width, height)
    }
  }, [canvasRef, enabled, reduced])
}

function readColors(root: HTMLElement) {
  const styles = getComputedStyle(root)
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback
  return {
    cool: read('--particle', '165, 235, 250'),
    warm: read('--particle-soft', '94, 234, 212'),
    link: read('--particle', '165, 235, 250'),
  }
}
