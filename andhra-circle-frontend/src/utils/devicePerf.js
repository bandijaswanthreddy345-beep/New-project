/**
 * Device Performance Utilities
 * Detects low-power devices, slow network conditions, or reduced-motion preferences
 * to gracefully disable heavy WebGL/canvas animations or unneeded re-renders.
 */

export function isLowPowerDevice() {
  if (typeof window === "undefined") return false;

  // 1. User prefers reduced motion
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }

  // 2. Mobile screen (< 768px width)
  if (window.innerWidth < 768) {
    return true;
  }

  // 3. Low CPU core count (typical budget phones have 2-4 cores reported)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return true;
  }

  // 4. Low device memory (<= 4 GB)
  if (navigator.deviceMemory && navigator.deviceMemory <= 4) {
    return true;
  }

  return false;
}

export function isReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

