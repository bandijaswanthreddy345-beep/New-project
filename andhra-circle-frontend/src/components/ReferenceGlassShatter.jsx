import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./ReferenceGlassShatter.css";

// 12 Large Crystalline Glass Plates matching the prominent slabs in media_1791887053413.jpg
const LARGE_GLASS_PLATES = [
  {
    id: "plate-top-right",
    width: 96,
    height: 54,
    clip: "polygon(0% 15%, 85% 0%, 100% 80%, 15% 100%)",
    tx: 48,
    ty: -42,
    tz: 450,
    rx: -45,
    ry: 60,
    rz: 30,
    delay: 0.01,
    duration: 0.95,
  },
  {
    id: "plate-top-center",
    width: 86,
    height: 50,
    clip: "polygon(20% 0%, 100% 25%, 75% 100%, 0% 85%)",
    tx: 8,
    ty: -52,
    tz: 380,
    rx: 50,
    ry: -35,
    rz: -20,
    delay: 0.03,
    duration: 0.92,
  },
  {
    id: "plate-top-left",
    width: 88,
    height: 48,
    clip: "polygon(10% 0%, 100% 20%, 85% 100%, 0% 80%)",
    tx: -45,
    ty: -44,
    tz: 420,
    rx: 40,
    ry: -55,
    rz: 25,
    delay: 0.02,
    duration: 0.94,
  },
  {
    id: "plate-far-right",
    width: 94,
    height: 52,
    clip: "polygon(5% 0%, 100% 20%, 90% 100%, 0% 80%)",
    tx: 62,
    ty: -5,
    tz: 600,
    rx: 25,
    ry: 75,
    rz: 15,
    delay: 0.02,
    duration: 1.0,
  },
  {
    id: "plate-far-left",
    width: 92,
    height: 50,
    clip: "polygon(0% 20%, 95% 0%, 100% 80%, 10% 100%)",
    tx: -60,
    ty: 4,
    tz: 580,
    rx: -30,
    ry: -70,
    rz: -15,
    delay: 0.03,
    duration: 0.98,
  },
  {
    id: "plate-bottom-right",
    width: 98,
    height: 54,
    clip: "polygon(0% 25%, 75% 0%, 100% 75%, 20% 100%)",
    tx: 52,
    ty: 42,
    tz: 500,
    rx: 55,
    ry: -45,
    rz: -35,
    delay: 0.04,
    duration: 0.96,
  },
  {
    id: "plate-bottom-center",
    width: 88,
    height: 48,
    clip: "polygon(15% 0%, 100% 15%, 85% 100%, 0% 75%)",
    tx: 6,
    ty: 54,
    tz: 400,
    rx: -60,
    ry: 30,
    rz: 45,
    delay: 0.03,
    duration: 0.94,
  },
  {
    id: "plate-bottom-left",
    width: 94,
    height: 52,
    clip: "polygon(0% 0%, 90% 20%, 100% 100%, 15% 85%)",
    tx: -48,
    ty: 44,
    tz: 480,
    rx: -50,
    ry: 45,
    rz: -30,
    delay: 0.04,
    duration: 0.95,
  },
  {
    id: "plate-center-front-1",
    width: 110,
    height: 64,
    clip: "polygon(5% 10%, 95% 0%, 100% 90%, 0% 100%)",
    tx: 20,
    ty: -12,
    tz: 900, // Massive forward pop toward screen
    rx: 70,
    ry: 95,
    rz: 50,
    delay: 0.01,
    duration: 1.05,
  },
  {
    id: "plate-center-front-2",
    width: 105,
    height: 60,
    clip: "polygon(0% 15%, 100% 0%, 90% 95%, 10% 85%)",
    tx: -18,
    ty: 10,
    tz: 850,
    rx: -65,
    ry: -85,
    rz: -45,
    delay: 0.01,
    duration: 1.02,
  },
  {
    id: "plate-mid-top-right",
    width: 78,
    height: 44,
    clip: "polygon(20% 0%, 100% 35%, 80% 100%, 0% 65%)",
    tx: 34,
    ty: -28,
    tz: 520,
    rx: 35,
    ry: 50,
    rz: -20,
    delay: 0.03,
    duration: 0.9,
  },
  {
    id: "plate-mid-bottom-left",
    width: 76,
    height: 42,
    clip: "polygon(0% 25%, 80% 0%, 100% 75%, 25% 100%)",
    tx: -32,
    ty: 26,
    tz: 500,
    rx: -40,
    ry: -55,
    rz: 25,
    delay: 0.03,
    duration: 0.9,
  },
];

// 60 Medium Sharp Triangular Glass Shards dispersing in 360 degrees across entire page
const MEDIUM_SHARDS = Array.from({ length: 60 }).map((_, i) => {
  const angle = (i / 60) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;

  // Viewport-relative distances to reach all four corners & edges of the entire screen
  const distVw = 34 + Math.random() * 42; // 34vw to 76vw
  const distVh = 30 + Math.random() * 42; // 30vh to 72vh

  const targetX = (Math.cos(angle) * distVw).toFixed(2);
  const targetY = (Math.sin(angle) * distVh + (Math.random() * 6)).toFixed(2);
  const targetZ = Math.round(180 + Math.random() * 850); // 3D forward pop

  const rotX = Math.round((Math.random() - 0.5) * 1080);
  const rotY = Math.round((Math.random() - 0.5) * 1080);
  const rotZ = Math.round((Math.random() - 0.5) * 720);

  const width = Math.round(18 + Math.random() * 34);
  const height = Math.round(14 + Math.random() * 30);

  const clipOptions = [
    "polygon(50% 0%, 100% 100%, 0% 100%)",
    "polygon(0% 0%, 100% 30%, 60% 100%, 10% 80%)",
    "polygon(25% 0%, 100% 50%, 75% 100%, 0% 60%)",
    "polygon(0% 40%, 65% 0%, 100% 100%)",
    "polygon(10% 0%, 90% 15%, 100% 85%, 25% 100%, 0% 60%)",
    "polygon(35% 0%, 100% 75%, 0% 100%)",
    "polygon(0% 10%, 80% 0%, 100% 85%, 20% 100%)",
  ];
  const clip = clipOptions[i % clipOptions.length];

  return {
    id: `med-${i}`,
    width,
    height,
    clip,
    targetX,
    targetY,
    targetZ,
    rotX,
    rotY,
    rotZ,
    delay: (Math.random() * 0.08).toFixed(3),
    duration: (0.8 + Math.random() * 0.32).toFixed(2),
  };
});

// 55 Small Splinters & Prismatic Gems scattering outward
const SMALL_SPLINTERS = Array.from({ length: 55 }).map((_, i) => {
  const angle = (i / 55) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
  const distVw = 38 + Math.random() * 38;
  const distVh = 34 + Math.random() * 38;

  return {
    id: `splinter-${i}`,
    width: Math.round(9 + Math.random() * 14),
    height: Math.round(7 + Math.random() * 12),
    targetX: (Math.cos(angle) * distVw).toFixed(2),
    targetY: (Math.sin(angle) * distVh).toFixed(2),
    targetZ: Math.round(150 + Math.random() * 700),
    rotZ: Math.round((Math.random() - 0.5) * 900),
    delay: (Math.random() * 0.07).toFixed(3),
    duration: (0.75 + Math.random() * 0.3).toFixed(2),
  };
});

// 24 Radial Cyan Laser Light Rays / Streaks shooting from center
const LIGHT_RAYS = Array.from({ length: 24 }).map((_, i) => {
  const angle = (i / 24) * 360 + (Math.random() - 0.5) * 10;
  const length = Math.round(340 + Math.random() * 380);
  const width = (1.8 + Math.random() * 2.2).toFixed(1);
  return {
    id: `ray-${i}`,
    angle,
    length,
    width,
    delay: (Math.random() * 0.04).toFixed(3),
    duration: (0.7 + Math.random() * 0.28).toFixed(2),
  };
});

export default function ReferenceGlassShatter({
  onComplete,
}) {
  const [phase, setPhase] = useState("shattering"); // "shattering" -> "open"

  useEffect(() => {
    // Phase 1: Dispersal active
    const openTimer = setTimeout(() => {
      setPhase("open");
    }, 650);

    // Phase 2: Complete dispersal and navigate to notes
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1100);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return createPortal(
    <div className={`ref-vortex-overlay ${phase === "open" ? "is-opening" : ""}`}>

      {/* 1. Deep Cosmic Void Backdrop Covering Entire Screen */}
      <div className="ref-vortex-backdrop" />

      {/* 2. Expanding Cyan Shockwave Rings across Entire Screen */}
      <div className="ref-vortex-shockwave ref-vortex-sw1" />
      <div className="ref-vortex-shockwave ref-vortex-sw2" />

      {/* 3. Radial Electric Cyan Light Rays Shooting to Screen Edges */}
      <div className="ref-vortex-rays-cluster">
        {LIGHT_RAYS.map((ray) => (
          <div
            key={ray.id}
            className="ref-vortex-ray"
            style={{
              width: `${ray.length}px`,
              height: `${ray.width}px`,
              transform: `rotate(${ray.angle}deg)`,
              animationDelay: `${ray.delay}s`,
              animationDuration: `${ray.duration}s`,
            }}
          />
        ))}
      </div>

      {/* =========================================================
          4. ONLY GLASS PIECES DISPERSING ACROSS THE ENTIRE SCREEN
          (No branch card rendered - only crystalline glass pieces!)
          ========================================================= */}
      <div className="ref-vortex-shards-emitter">

        {/* 4A. Large Crystalline Glass Plates (Prominent Slabs) */}
        {LARGE_GLASS_PLATES.map((plate) => (
          <div
            key={plate.id}
            className="ref-plate-shard"
            style={{
              width: `${plate.width}px`,
              height: `${plate.height}px`,
              clipPath: plate.clip,
              "--tx": `${plate.tx}vw`,
              "--ty": `${plate.ty}vh`,
              "--tz": `${plate.tz}px`,
              "--rx": `${plate.rx}deg`,
              "--ry": `${plate.ry}deg`,
              "--rz": `${plate.rz}deg`,
              animationDelay: `${plate.delay}s`,
              animationDuration: `${plate.duration}s`,
            }}
          >
            {/* Glass Facet, Specular Highlights & Internal Reflections */}
            <div className="ref-plate-glass-core" />
            <div className="ref-plate-cyan-bevel" />
          </div>
        ))}

        {/* 4B. Medium Sharp Triangular Shards (60 pieces) */}
        {MEDIUM_SHARDS.map((shard) => (
          <div
            key={shard.id}
            className="ref-med-shard"
            style={{
              width: `${shard.width}px`,
              height: `${shard.height}px`,
              clipPath: shard.clip,
              "--tx": `${shard.targetX}vw`,
              "--ty": `${shard.targetY}vh`,
              "--tz": `${shard.targetZ}px`,
              "--rx": `${shard.rotX}deg`,
              "--ry": `${shard.rotY}deg`,
              "--rz": `${shard.rotZ}deg`,
              animationDelay: `${shard.delay}s`,
              animationDuration: `${shard.duration}s`,
            }}
          >
            <div className="ref-med-glass-core" />
          </div>
        ))}

        {/* 4C. Small Splinters & Prismatic Gems (55 pieces) */}
        {SMALL_SPLINTERS.map((spl) => (
          <div
            key={spl.id}
            className="ref-splinter-shard"
            style={{
              width: `${spl.width}px`,
              height: `${spl.height}px`,
              "--tx": `${spl.targetX}vw`,
              "--ty": `${spl.targetY}vh`,
              "--tz": `${spl.targetZ}px`,
              "--rz": `${spl.rotZ}deg`,
              animationDelay: `${spl.delay}s`,
              animationDuration: `${spl.duration}s`,
            }}
          />
        ))}

      </div>

    </div>,
    document.body
  );
}
