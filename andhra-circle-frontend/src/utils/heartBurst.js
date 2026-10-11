/**
 * High-Performance 100-Hearts Pop Celebration Engine
 * Spawns 100 floating, glossy, multi-scale 3D hearts and sparkling particles
 * rendered on a full-screen hardware-accelerated canvas.
 */

// Cached SVG Heart Path2D for ultra-fast GPU canvas rendering
const HEART_PATH_SVG =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

let cachedHeartPath = null;
function getHeartPath() {
  if (!cachedHeartPath && typeof Path2D !== "undefined") {
    cachedHeartPath = new Path2D(HEART_PATH_SVG);
  }
  return cachedHeartPath;
}

// Romantic & Vibrant celebratory color palette
const HEART_COLORS = [
  "#e11d48", // Vivid Ruby Red
  "#f43f5e", // Bright Rose Pink
  "#ff2d75", // Neon Poppy Pink
  "#fb7185", // Coral Blush
  "#be123c", // Deep Crimson
  "#ec4899", // Fuchsia Magenta
  "#fda4af", // Soft Peach Rose
  "#fbbf24", // Golden Star Shimmer
  "#f43f5e",
  "#e11d48",
];

class HeartBurstEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animId = null;
    this.dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);
  }

  initCanvas() {
    if (this.canvas || typeof document === "undefined") return;

    this.canvas = document.createElement("canvas");
    this.canvas.id = "hearts-celebration-canvas";
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100vw";
    this.canvas.style.height = "100vh";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "999999";
    this.canvas.style.opacity = "1";

    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d", { alpha: true });

    this.handleResize();
    window.addEventListener("resize", this.handleResize, { passive: true });
  }

  handleResize() {
    if (!this.canvas || !this.ctx) return;
    this.dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /**
   * Spawns exactly 100 popping hearts originating from (originX, originY)
   * in staggered energetic waves.
   */
  burst(originX, originY) {
    this.initCanvas();
    if (!this.ctx) return;

    const totalHearts = 100;
    const now = performance.now();

    for (let i = 0; i < totalHearts; i++) {
      // Stagger in 3 energetic waves for volcanic fountain progression
      let delay = 0;
      if (i >= 35 && i < 70) {
        delay = 40 + Math.random() * 50; // Wave 2
      } else if (i >= 70) {
        delay = 90 + Math.random() * 70; // Wave 3
      }

      // Trajectory angle: mainly upward fountain (-135deg to -45deg) with full spread
      const spreadRatio = (i / totalHearts) * 2 - 1; // -1 to +1
      const angle = -Math.PI / 2 + (spreadRatio * 0.95 + (Math.random() - 0.5) * 0.6);
      const speed = 4 + Math.random() * 9.5;

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - (1.5 + Math.random() * 3); // Strong upward push

      // Heart size tiering: small, medium, large, few giant hero hearts
      let size = 10 + Math.random() * 12; // Default 10-22px
      if (i % 15 === 0) {
        size = 24 + Math.random() * 8; // Hero 24-32px
      } else if (i % 4 === 0) {
        size = 8 + Math.random() * 5; // Sparkle mini 8-13px
      }

      const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
      const isGold = color === "#fbbf24";

      this.particles.push({
        x: originX + (Math.random() - 0.5) * 14,
        y: originY + (Math.random() - 0.5) * 10,
        vx,
        vy,
        gravity: 0.16 + Math.random() * 0.1,
        drag: 0.982,
        size,
        color,
        isGold,
        rotation: (Math.random() - 0.5) * 0.8,
        rotSpeed: (Math.random() - 0.5) * 0.08,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.06 + Math.random() * 0.07,
        wobbleAmp: 0.6 + Math.random() * 1.4,
        scale: 0.1,
        targetScale: 0.85 + Math.random() * 0.45,
        scaleGrowth: 0.12 + Math.random() * 0.08,
        opacity: 1,
        fadeSpeed: 0.012 + Math.random() * 0.011,
        delay,
        createdAt: now,
      });
    }

    if (!this.animId) {
      this.animId = requestAnimationFrame(this.loop);
    }
  }

  loop(timestamp) {
    if (!this.ctx || !this.canvas) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ctx.clearRect(0, 0, w, h);

    const path = getHeartPath();
    let activeCount = 0;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Check delay
      if (timestamp - p.createdAt < p.delay) {
        activeCount++;
        continue;
      }

      // Physics update
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;

      // Gentle wobble drift
      p.wobblePhase += p.wobbleSpeed;
      p.x += Math.sin(p.wobblePhase) * p.wobbleAmp;

      // Rotation
      p.rotation += p.rotSpeed;

      // Elastic pop-in scale
      if (p.scale < p.targetScale) {
        p.scale = Math.min(p.targetScale, p.scale + p.scaleGrowth);
      } else {
        // Slow natural fade & shrinkage
        p.opacity -= p.fadeSpeed;
        p.scale = Math.max(0.2, p.scale - 0.003);
      }

      if (p.opacity <= 0 || p.y > h + 50) {
        continue;
      }

      activeCount++;

      // Render Heart
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));

      const scaleFactor = (p.size / 24) * p.scale;
      this.ctx.scale(scaleFactor, scaleFactor);
      this.ctx.translate(-12, -12); // Center path around (12, 12)

      this.ctx.fillStyle = p.color;

      // Subtle drop shadow for glossy depth
      this.ctx.shadowColor = p.isGold ? "rgba(251, 191, 36, 0.55)" : "rgba(225, 29, 72, 0.4)";
      this.ctx.shadowBlur = 6;
      this.ctx.shadowOffsetY = 2;

      if (path) {
        this.ctx.fill(path);
      } else {
        // Fallback heart drawing if Path2D unavailable
        this.ctx.beginPath();
        this.ctx.moveTo(12, 21.35);
        this.ctx.bezierCurveTo(4, 15, 2, 9, 2, 6);
        this.ctx.bezierCurveTo(2, 3, 4.5, 2, 7.5, 2);
        this.ctx.bezierCurveTo(10, 2, 11.5, 3.5, 12, 5);
        this.ctx.bezierCurveTo(12.5, 3.5, 14, 2, 16.5, 2);
        this.ctx.bezierCurveTo(19.5, 2, 22, 3, 22, 6);
        this.ctx.bezierCurveTo(22, 9, 20, 15, 12, 21.35);
        this.ctx.fill();
      }

      // Glossy 3D specular highlight curve on top-left lobe for larger hearts
      if (p.size >= 14 && p.scale > 0.4) {
        this.ctx.shadowColor = "transparent";
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        this.ctx.beginPath();
        this.ctx.arc(8, 7.2, 2.2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    // Clean up finished particles
    if (this.particles.length > 250) {
      this.particles = this.particles.filter((p) => p.opacity > 0);
    }

    if (activeCount > 0) {
      this.animId = requestAnimationFrame(this.loop);
    } else {
      this.particles = [];
      this.ctx.clearRect(0, 0, w, h);
      this.animId = null;
    }
  }
}

// Global Singleton
const engine = new HeartBurstEngine();

export function trigger100Hearts(originX, originY) {
  try {
    engine.burst(originX, originY);
  } catch (err) {
    console.error("Heart celebration burst error:", err);
  }
}

export default trigger100Hearts;
