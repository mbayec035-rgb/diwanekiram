import { useEffect, type RefObject } from "react";

interface Particle {
  x: number;
  y: number;
  warm: boolean;
  alpha: number;
}

const LINK_DISTANCE = 132;
const MAX_PARTICLES = 82;
const MIN_PARTICLES = 26;

export function useConstellation(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled = true,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !enabled) return;

    const root = document.documentElement;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      const styles = getComputedStyle(root);
      const cool =
        styles.getPropertyValue("--particle").trim() || "165, 235, 250";
      const warm =
        styles.getPropertyValue("--particle-soft").trim() || "94, 234, 212";
      const link = cool;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const count = Math.round(
        Math.min(
          MAX_PARTICLES,
          Math.max(MIN_PARTICLES, (width * height) / 22000),
        ),
      );
      const particles: Particle[] = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        warm: Math.random() > 0.72,
        alpha: Math.random() * 0.34 + 0.14,
      }));

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        context.fillStyle = `rgba(${particle.warm ? warm : cool}, ${particle.alpha})`;
        context.beginPath();
        context.arc(
          particle.x,
          particle.y,
          Math.random() * 1.5 + 0.7,
          0,
          Math.PI * 2,
        );
        context.fill();

        for (
          let otherIndex = index + 1;
          otherIndex < particles.length;
          otherIndex += 1
        ) {
          const other = particles[otherIndex];
          const distance = Math.hypot(
            particle.x - other.x,
            particle.y - other.y,
          );
          if (distance >= LINK_DISTANCE) continue;
          context.strokeStyle = `rgba(${link}, ${0.16 * (1 - distance / LINK_DISTANCE)})`;
          context.lineWidth = 0.6;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
      }
    };

    const observer = new MutationObserver(draw);
    draw();
    window.addEventListener("resize", draw);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.removeEventListener("resize", draw);
      observer.disconnect();
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [canvasRef, enabled]);
}
