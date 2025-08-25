"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { motion } from "framer-motion";

interface Beam {
  id: number;
  x: number;
  duration: number;
}

interface BackgroundMeteorsProps {
  children?: ReactNode;
  variant?: 'fullscreen' | 'navbar';
}

export default function BackgroundMeteors({
  children,
  variant = 'fullscreen',
}: BackgroundMeteorsProps) {
  const [beams, setBeams] = useState<Beam[]>([]);
  const gridSize = 40;
  const totalLines = 35;

  const generateSafeGridPositions = (count: number): number[] => {
    const available: number[] = [];
    for (let i = 0; i < totalLines - 1; i++) {
      available.push(i);
    }

    const selected: number[] = [];
    while (available.length > 0 && selected.length < count) {
      const idx = Math.floor(Math.random() * available.length);
      const value = available[idx];
      selected.push(value);
      available.splice(
        0,
        available.length,
        ...available.filter((v) => Math.abs(v - value) > 1)
      );
    }

    return selected.map((line) => line * gridSize);
  };

  useEffect(() => {
    const generateBeams = () => {
      const count = variant === 'navbar' ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 2) + 3;
      const xPositions = generateSafeGridPositions(count);

      const newBeams: Beam[] = xPositions.map((x) => ({
        id: Math.random(),
        x,
        duration: variant === 'navbar' ? 3 + Math.random() * 1 : 4 + Math.random() * 1.5,
      }));

      setBeams(newBeams);

      const maxDuration = Math.max(...newBeams.map((b) => b.duration));
      setTimeout(generateBeams, (maxDuration - 0.5) * 1000);
    };

    generateBeams();
  }, [variant]);

  const containerClasses = variant === 'navbar' 
    ? "relative w-full bg-black overflow-hidden" 
    : "relative flex h-screen w-full items-center justify-center overflow-hidden bg-black";

  const contentClasses = variant === 'navbar'
    ? "relative z-10"
    : "absolute inset-0 z-10 flex items-center justify-center";

  return (
    <div className={containerClasses}>
      <div
        className="absolute inset-0"
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundImage:
            "linear-gradient(to right, #262626 1px, transparent 1px), linear-gradient(to bottom, #262626 1px, transparent 1px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
      />
      {beams.map((b) => (
        <motion.div
          key={b.id}
          className="absolute top-0"
          style={{ left: b.x, zIndex: 2 }}
          initial={{ y: variant === 'navbar' ? -50 : -150 }}
          animate={{ y: variant === 'navbar' ? "100vh" : "100vh" }}
          transition={{
            duration: b.duration,
            ease: "linear",
          }}
        >
          <div
            className={`rounded-full bg-gradient-to-t from-white/70 via-white/20 to-transparent`}
            style={{ 
              height: variant === 'navbar' ? '40px' : '56px',
              width: '1px',
              margin: "0 auto" 
            }}
          />
        </motion.div>
      ))}

      <div className={contentClasses}>
        {children}
      </div>
    </div>
  );
}