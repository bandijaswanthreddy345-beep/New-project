import { useEffect, useRef } from "react";
import "./HeroBackgroundMotion.css";

/**
 * HeroBackgroundMotion
 *
 * Renders the emerald/gold half-sun panoramic image as the Hero background
 * with ultra-subtle layered ambient motion:
 *
 * 1. Base photographic layer (the image itself, with micro-parallax)
 * 2. Golden sun breathing glow (8s cycle)
 * 3. Atmospheric emerald/gold diffusion (22s cycle)
 * 4. Horizon light soft sweep (14s cycle)
 * 5. Water reflection shimmer (lower 38% only)
 * 6. Desktop mouse parallax (max 2-4px, 0 React re-renders)
 * 7. Optical scrim for perfect text contrast
 *
 * Respects prefers-reduced-motion and disables parallax on touch devices.
 */
function HeroBackgroundMotion({ heroRef }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none) or (pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || prefersReducedMotion) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = null;

    const handleMouseMove = (e) => {
      const hero = heroRef?.current;
      if (!hero) return;

      const rect = hero.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      targetX = Math.max(-1, Math.min(1, normX));
      targetY = Math.max(-1, Math.min(1, normY));
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const updatePhysics = () => {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;

      if (containerRef.current) {
        containerRef.current.style.setProperty("--mouse-x", currentX.toFixed(4));
        containerRef.current.style.setProperty("--mouse-y", currentY.toFixed(4));
      }

      rafId = requestAnimationFrame(updatePhysics);
    };

    const heroElement = heroRef?.current;
    if (heroElement) {
      heroElement.addEventListener("mousemove", handleMouseMove, { passive: true });
      heroElement.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    }

    rafId = requestAnimationFrame(updatePhysics);

    return () => {
      if (heroElement) {
        heroElement.removeEventListener("mousemove", handleMouseMove);
        heroElement.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [heroRef]);

  return (
    <div ref={containerRef} className="hero-motion-bg" aria-hidden="true">

      {/* Base Photographic Layer — the emerald/gold half-sun image */}
      <div className="hero-motion-base">
        <img
          src="/hero-bg.png"
          alt=""
          className="hero-motion-img"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Golden Sun Breathing Glow */}
      <div className="hero-motion-sun-glow" />

      {/* Atmospheric Emerald/Gold Diffusion */}
      <div className="hero-motion-atmosphere" />

      {/* Horizon Light Soft Sweep */}
      <div className="hero-motion-horizon">
        <div className="hero-motion-horizon-beam" />
      </div>

      {/* Water Reflection Shimmer (lower 38% only) */}
      <div className="hero-motion-water">
        <div className="hero-water-shimmer-plate">
          <div className="hero-water-ripple-layer hero-water-ripple-1" />
          <div className="hero-water-ripple-layer hero-water-ripple-2" />
          <div className="hero-water-pillar-glow" />
        </div>
      </div>

      {/* Optical Scrim — ensures perfect text & chatbot readability */}
      <div className="hero-motion-scrim" />
    </div>
  );
}

export default HeroBackgroundMotion;
