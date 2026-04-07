/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.VISUAL.GALAXY
TAG: UI.GALAXY.CANVAS.ENGINE
WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
*/
import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  flickerSpeed: number;
  flickerPhase: number;
  color: string;
  colorShift: boolean; // does this star shift colors?
}

interface Streak {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

const STAR_COLORS = [
  '#ffffff',   // white
  '#aaccff',   // baby blue
  '#ffd700',   // cardinal gold
  '#ff6b6b',   // cardinal red
  '#7c8cf7',   // royal blue
  '#88ddff',   // sky blue
  '#ffaa44',   // warm orange
  '#ff88cc',   // pink
];

const SOLID_COLORS = [
  '#ffffff',
  '#aaccff',
  '#7c8cf7',
  '#ffd700',
];

const STREAK_COLORS = [
  '#00ccff',
  '#ffd700',
  '#ff6b6b',
  '#88ffaa',
  '#ff88cc',
  '#7c8cf7',
  '#ffffff',
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    // Generate stars
    const STAR_COUNT = Math.floor((w * h) / 800); // dense field
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const colorShift = Math.random() < 0.3; // 30% shift colors
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.8 + 0.3,
        baseAlpha: Math.random() * 0.6 + 0.2,
        alpha: 0,
        flickerSpeed: Math.random() * 3 + 1,
        flickerPhase: Math.random() * Math.PI * 2,
        color: colorShift ? randomPick(STAR_COLORS) : randomPick(SOLID_COLORS),
        colorShift,
      });
    }

    // Streaking stars pool
    const MAX_STREAKS = 8;
    const streaks: Streak[] = [];

    function spawnStreak() {
      if (streaks.length >= MAX_STREAKS) return;
      const angle = Math.random() * Math.PI * 2;
      streaks.push({
        x: Math.random() * w,
        y: Math.random() * h,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 3 + 1.5,
        angle,
        alpha: 0,
        color: randomPick(STREAK_COLORS),
        life: 0,
        maxLife: Math.random() * 120 + 60,
      });
    }

    let frameId: number;
    let time = 0;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      // Deep space gradient
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, '#070d1c');
      grad.addColorStop(0.5, '#040810');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle nebula glow
      ctx.save();
      ctx.globalAlpha = 0.06;
      const neb1 = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.4);
      neb1.addColorStop(0, '#4466ff');
      neb1.addColorStop(1, 'transparent');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, w, h);

      const neb2 = ctx.createRadialGradient(w * 0.7, h * 0.6, 0, w * 0.7, h * 0.6, w * 0.35);
      neb2.addColorStop(0, '#ffaa33');
      neb2.addColorStop(1, 'transparent');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Draw stars
      time += 0.016;
      for (const s of stars) {
        // Flickering alpha
        s.alpha = s.baseAlpha + Math.sin(time * s.flickerSpeed + s.flickerPhase) * 0.35;
        s.alpha = Math.max(0.05, Math.min(1, s.alpha));

        // Color shifting
        if (s.colorShift && Math.random() < 0.002) {
          s.color = randomPick(STAR_COLORS);
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.fill();

        // Glow on brighter stars
        if (s.size > 1.2 && s.alpha > 0.5) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.alpha * 0.15;
          ctx.fill();
        }
      }

      // Spawn streaks randomly
      if (Math.random() < 0.02) spawnStreak();

      // Draw streaks
      ctx.globalAlpha = 1;
      for (let i = streaks.length - 1; i >= 0; i--) {
        const st = streaks[i];
        st.life++;
        st.x += Math.cos(st.angle) * st.speed;
        st.y += Math.sin(st.angle) * st.speed;

        // Fade in/out
        const progress = st.life / st.maxLife;
        st.alpha = progress < 0.2 ? progress / 0.2 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        st.alpha = Math.max(0, Math.min(1, st.alpha)) * 0.7;

        // Blink color
        if (Math.random() < 0.05) {
          st.color = randomPick(STREAK_COLORS);
        }

        const tailX = st.x - Math.cos(st.angle) * st.length;
        const tailY = st.y - Math.sin(st.angle) * st.length;

        const lineGrad = ctx.createLinearGradient(tailX, tailY, st.x, st.y);
        lineGrad.addColorStop(0, 'transparent');
        lineGrad.addColorStop(1, st.color);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(st.x, st.y);
        ctx.strokeStyle = lineGrad;
        ctx.globalAlpha = st.alpha;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Head glow
        ctx.beginPath();
        ctx.arc(st.x, st.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = st.color;
        ctx.globalAlpha = st.alpha * 0.8;
        ctx.fill();

        if (st.life >= st.maxLife || st.x < -100 || st.x > w + 100 || st.y < -100 || st.y > h + 100) {
          streaks.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
      frameId = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
