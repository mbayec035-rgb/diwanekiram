/* Fond ambiant : constellation de particules, aurores, trame et grain. */

import { useRef } from 'react'
import { useConstellation } from '../../hooks/useConstellation'

export function Ambience() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useConstellation(canvasRef)

  return (
    <div className="ambient-layer" aria-hidden="true">
      <div className="ambient-aurora" />
      <div className="ambient-aurora" />
      <div className="ambient-aurora" />
      <div className="ambient-pattern" />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      <div className="ambient-grain" />
      <div className="ambient-vignette" />
    </div>
  )
}
