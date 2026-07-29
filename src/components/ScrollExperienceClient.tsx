"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";

type ExperienceStatus = "idle" | "loading" | "error";

function LightweightHero({
  experienceStatus,
  onEnable3D,
}: {
  experienceStatus: ExperienceStatus;
  onEnable3D: () => void;
}) {
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

          <button
            type="button"
            className="btn-outline mobile-3d-trigger"
            onClick={onEnable3D}
            disabled={experienceStatus === "loading"}
            aria-describedby={
              experienceStatus === "error" ? "mobile-3d-status" : undefined
            }
          >
            {experienceStatus === "loading"
              ? "กำลังเปิด 3D..."
              : experienceStatus === "error"
                ? "ลองเปิด 3D อีกครั้ง"
                : "เปิดโหมด 3D"}
          </button>
        </div>

        <p
          id="mobile-3d-status"
          className="mobile-3d-status"
          role="status"
          aria-live="polite"
        >
          {experienceStatus === "error"
            ? "โหลดโหมด 3D ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง"
            : ""}
        </p>
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
  const [experienceStatus, setExperienceStatus] =
    useState<ExperienceStatus>("idle");
  const mountedRef = useRef(true);

  const enable3D = useCallback(async () => {
    if (experienceStatus === "loading" || DesktopExperience) return;

    setExperienceStatus("loading");

    try {
      const experienceModule = await import("@/components/ScrollExperience");

      if (mountedRef.current) {
        setDesktopExperience(() => experienceModule.default);
        setExperienceStatus("idle");
      }
    } catch {
      if (mountedRef.current) {
        setExperienceStatus("error");
      }
    }
  }, [DesktopExperience, experienceStatus]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const supportsDesktopExperience = window.matchMedia(
      "(min-width: 769px) and (hover: hover) and (pointer: fine)"
    ).matches;

    const timerId = supportsDesktopExperience
      ? window.setTimeout(() => void enable3D(), 0)
      : undefined;

    return () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
    };
  }, [enable3D]);

  return DesktopExperience ? (
    <DesktopExperience />
  ) : (
    <LightweightHero
      experienceStatus={experienceStatus}
      onEnable3D={() => void enable3D()}
    />
  );
}
