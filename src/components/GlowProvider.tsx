"use client";

import { useEffect } from "react";

export default function GlowProvider() {
  useEffect(() => {
    let currentCard: HTMLElement | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const card = target.closest<HTMLElement>(
        ".glass-card, .neu-card, .glow-card, [data-glow-card], .admin-project, .admin-summary article"
      );

      if (card) {
        if (currentCard && currentCard !== card) {
          // Reset previous card
          currentCard.style.setProperty("--tilt-x", "0deg");
          currentCard.style.setProperty("--tilt-y", "0deg");
          currentCard.style.setProperty("--tilt-scale", "1");
        }

        currentCard = card;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);

        // Calculate 3D tilt based on cursor position
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltY = ((x - centerX) / centerX) * 5; // max 5 deg tilt
        const tiltX = ((centerY - y) / centerY) * 5;

        card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
        card.style.setProperty("--tilt-scale", "1.015");
      } else if (currentCard) {
        // Reset tilt when leaving
        currentCard.style.setProperty("--tilt-x", "0deg");
        currentCard.style.setProperty("--tilt-y", "0deg");
        currentCard.style.setProperty("--tilt-scale", "1");
        currentCard = null;
      }
    };

    const handleMouseLeave = () => {
      if (currentCard) {
        currentCard.style.setProperty("--tilt-x", "0deg");
        currentCard.style.setProperty("--tilt-y", "0deg");
        currentCard.style.setProperty("--tilt-scale", "1");
        currentCard = null;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return null;
}
