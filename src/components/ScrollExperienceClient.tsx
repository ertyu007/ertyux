"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";

type ExperienceStatus = "idle" | "loading" | "error";
const EXPERIENCE_LOAD_TIMEOUT_MS = 15_000;

function announce3DStatus(status: ExperienceStatus | "active") {
  window.dispatchEvent(
    new CustomEvent("portfolio:3d-status", { detail: status })
  );
}

function LightweightHero({ is3DLoading }: { is3DLoading: boolean }) {
  return (
    <section
      id="home"
      className="lightweight-hero"
      aria-label="Portfolio introduction"
      aria-busy={is3DLoading}
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
  const [experienceStatus, setExperienceStatus] =
    useState<ExperienceStatus>("idle");
  const mountedRef = useRef(true);

  const enable3D = useCallback(async () => {
    if (experienceStatus === "loading" || DesktopExperience) return;

    setExperienceStatus("loading");
    announce3DStatus("loading");
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const experienceModule = await Promise.race([
        import("@/components/ScrollExperience"),
        new Promise<never>((_, reject) => {
          timeoutId = globalThis.setTimeout(() => {
            reject(new Error("3D experience load timed out"));
          }, EXPERIENCE_LOAD_TIMEOUT_MS);
        }),
      ]);

      if (mountedRef.current) {
        setDesktopExperience(() => experienceModule.default);
        setExperienceStatus("idle");
        announce3DStatus("active");
      }
    } catch {
      if (mountedRef.current) {
        setExperienceStatus("error");
        announce3DStatus("error");
      }
    } finally {
      if (timeoutId !== undefined) {
        globalThis.clearTimeout(timeoutId);
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
    const handleEnable3D = () => {
      void enable3D();
    };

    window.addEventListener("portfolio:enable-3d", handleEnable3D);
    return () => {
      window.removeEventListener("portfolio:enable-3d", handleEnable3D);
    };
  }, [enable3D]);

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
    <LightweightHero is3DLoading={experienceStatus === "loading"} />
  );
}
