"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

const COLORS = ["#a01828", "#1e2e5c", "#d4a73a", "#f8f0e0", "#ffffff"];

export function ConfettiBurst() {
  useEffect(() => {
    // Volley inicial
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        window.clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
        particleCount,
        origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() - 0.2 },
        colors: COLORS,
      });
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
        particleCount,
        origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() - 0.2 },
        colors: COLORS,
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
