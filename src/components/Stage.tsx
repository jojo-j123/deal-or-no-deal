import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ThemeConfig } from '../engine/types.ts';

interface StageProps {
  theme: ThemeConfig;
  children: ReactNode;
  /** Shakes the whole stage for a beat. */
  shake?: boolean;
  burst?: 'none' | 'big' | 'win';
  confetti?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

/**
 * The room the game is played in: lighting rig, floor reflection, atmosphere.
 * Everything here is decorative and `aria-hidden`.
 */
export function Stage({
  theme,
  children,
  shake = false,
  burst = 'none',
  confetti = false,
  reducedMotion = false,
  className = '',
}: StageProps) {
  return (
    <div
      className={`stage ${shake ? 'is-shaking' : ''} ${className}`}
      data-burst={burst}
    >
      <div className="stage__bg" aria-hidden="true">
        <div className="stage__gradient" />
        {theme.background.type === 'image' && theme.background.image ? (
          <div className="stage__image" />
        ) : null}
        {theme.effects.spotlight && !reducedMotion ? (
          <>
            <div className="stage__spot stage__spot--a" />
            <div className="stage__spot stage__spot--b" />
          </>
        ) : null}
        <div className="stage__floor" />
        <div className="stage__vignette" />
        {theme.effects.scanlines ? <div className="stage__scanlines" /> : null}
        {theme.effects.grain ? <div className="stage__grain" /> : null}
      </div>

      {theme.effects.particles && !reducedMotion ? (
        <ParticleField accent={theme.colors.primary} confetti={confetti} secondary={theme.colors.secondary} />
      ) : null}

      <div className="stage__content">{children}</div>
    </div>
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  spin: number;
  angle: number;
  confetti: boolean;
}

/**
 * Two effects on one canvas: slow ambient dust that sells the depth of the
 * room, and a confetti burst for wins.
 */
function ParticleField({
  accent,
  secondary,
  confetti,
}: {
  accent: string;
  secondary: string;
  confetti: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const burstRef = useRef(false);

  useEffect(() => {
    if (confetti) burstRef.current = true;
  }, [confetti]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const dustCount = width < 720 ? 18 : 42;
    const makeDust = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.14,
      vy: -0.05 - Math.random() * 0.16,
      size: 0.7 + Math.random() * 1.8,
      life: 0,
      maxLife: Infinity,
      color: Math.random() > 0.5 ? accent : secondary,
      spin: 0,
      angle: 0,
      confetti: false,
    });
    particles.current = Array.from({ length: dustCount }, makeDust);

    const spawnConfetti = () => {
      const colors = [accent, secondary, '#ffffff'];
      for (let i = 0; i < 130; i++) {
        particles.current.push({
          x: width / 2 + (Math.random() - 0.5) * width * 0.5,
          y: height * 0.55,
          vx: (Math.random() - 0.5) * 9,
          vy: -6 - Math.random() * 9,
          size: 4 + Math.random() * 7,
          life: 0,
          maxLife: 150 + Math.random() * 90,
          color: colors[i % colors.length],
          spin: (Math.random() - 0.5) * 0.4,
          angle: Math.random() * Math.PI,
          confetti: true,
        });
      }
    };

    const render = () => {
      frame = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      if (burstRef.current) {
        burstRef.current = false;
        spawnConfetti();
      }

      const next: Particle[] = [];
      for (const p of particles.current) {
        p.life += 1;
        if (p.confetti) {
          p.vy += 0.22;
          p.vx *= 0.992;
          p.angle += p.spin;
        } else if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        p.x += p.vx;
        p.y += p.vy;

        if (p.confetti && (p.life > p.maxLife || p.y > height + 40)) continue;
        next.push(p);

        const fade = p.confetti ? Math.max(0, 1 - p.life / p.maxLife) : 0.22;
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        if (p.confetti) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      particles.current = next;
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [accent, secondary]);

  return <canvas ref={canvasRef} className="stage__particles" aria-hidden="true" />;
}
