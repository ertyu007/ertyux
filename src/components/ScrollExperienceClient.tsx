"use client";

import { useEffect, useState, type ComponentType } from "react";

function LightweightHero() {
  return (
    <section
      id="home"
      className="lightweight-hero"
      aria-label="Portfolio introduction"
    >
      <div className="lightweight-hero__glow" aria-hidden="true" />

      <div className="container lightweight-hero__content">
        <div className="section-tag hero-availability">
          <span className="lightweight-hero__status" aria-hidden="true" />
          Available for selected projects
        </div>

        <h1>
          <span>STUDENT</span>
          <span className="text-gradient">CREATOR</span>
        </h1>

        <p className="hero-description">
          คิดให้เป็น ทำให้ใช้งานได้จริง ใส่ใจทุกงาน
          ตั้งแต่เว็บไซต์ ระบบข้อมูล ไปจนถึงคอนเทนต์วิดีโอ
        </p>

        <div className="hero-actions">
          <a href="#projects" className="btn-primary">
            <span>Explore projects</span>
            <span aria-hidden="true">↗</span>
          </a>

          <a href="#contact" className="btn-outline">
            Start a conversation
          </a>
        </div>
      </div>

      <div className="lightweight-hero__scroll" aria-hidden="true">
        <span>SCROLL TO EXPLORE</span>
        <span>↓</span>
      </div>
    </section>
  );
}

export default function ScrollExperienceClient() {
  const [DesktopExperience, setDesktopExperience] =
    useState<ComponentType | null>(null);

  useEffect(() => {
    const supportsDesktopExperience = window.matchMedia(
      "(min-width: 769px) and (hover: hover) and (pointer: fine)"
    ).matches;

    if (!supportsDesktopExperience) return;

    let cancelled = false;

    void import("@/components/ScrollExperience").then((module) => {
      if (!cancelled) {
        setDesktopExperience(() => module.default);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return DesktopExperience ? <DesktopExperience /> : <LightweightHero />;
}
