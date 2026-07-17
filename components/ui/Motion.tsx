'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, animate } from 'motion/react'

/**
 * ชุด motion primitives ของแอป (Motion library — spring physics)
 * - Reveal: เข้าฉากแบบสปริง + หน่วงเป็นลำดับ (staggered entrance)
 * - CountUp: ตัวเลขวิ่งจาก 0 → ค่าจริง (นับแบบ ease-out)
 * - Tilt: การ์ดเอียง 3D ตามเมาส์ + จุดแสงตามพอยน์เตอร์
 * ทุกตัวเคารพ prefers-reduced-motion
 */

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y, scale: 0.985, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.9, delay }}
    >
      {children}
    </motion.div>
  )
}

export function CountUp({ value, duration = 1.1, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : 0)
  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, duration, delay, reduced])
  return <>{display.toLocaleString()}</>
}

export function Tilt({ children, className, max = 7 }: { children: React.ReactNode; className?: string; max?: number }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 220, damping: 18 })
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 220, damping: 18 })
  // จุดแสงเรืองตามตำแหน่งพอยน์เตอร์ (spotlight) — ประกาศก่อน early-return (กติกา hooks)
  const glow = useTransform(
    [px, py] as const,
    ([x, y]) => `radial-gradient(220px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(79,70,229,0.10), transparent 65%)`
  )

  function onMove(e: React.PointerEvent) {
    const el = ref.current
    if (!el || reduced) return
    const r = el.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  function onLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      ref={ref}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 700 }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      {children}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glow }}
      />
    </motion.div>
  )
}
