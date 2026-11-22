import {useEffect, useRef} from 'react';
import {PLAYER_STAGE_COLORS} from '../../utils/stageAudio';

const CONFETTI_COLORS = [...PLAYER_STAGE_COLORS, '#fde047', '#ffffff'];

export function ConfettiBurst({intense = false}: {intense?: boolean}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = intense ? 95 : 42;
    const particles = Array.from({length: count}, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height * 0.6,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      vx: (Math.random() - 0.5) * (intense ? 3.6 : 2.2),
      vy: 2.2 + Math.random() * (intense ? 4.2 : 2.6),
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.14,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      alpha: 0.75 + Math.random() * 0.25,
    }));

    let rafId = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;
        if (p.y > canvas.height + 20) {
          if (intense) {
            p.y = -15;
            p.x = Math.random() * canvas.width;
          } else {
            continue;
          }
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [intense]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-20"
      aria-hidden="true"
    />
  );
}
