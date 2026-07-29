"use client";

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MutableRefObject, RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Sparkles } from "@react-three/drei";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

import MagneticButton from "./MagneticButton";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SCROLL_TRIGGER_ID = "portfolio-scroll-experience";
const BINARY_STREAMS = [
  "01001101 01001011",
  "0011 0101 0101 0001",
  "11001010 00101101",
  "0101 0100 0011 0001",
  "01110111 01100101 01100010",
  "1010 1100 0101 0010",
];

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type SceneQuality = {
  compact: boolean;
  particleCount: number;
  sparkleCount: number;
  dpr: [number, number];
};

type TextStepProps = {
  stepRef: RefObject<HTMLDivElement | null>;
  number: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
};

function useSceneQuality(): SceneQuality {
  const [quality, setQuality] = useState<SceneQuality>({
    compact: false,
    particleCount: 54,
    sparkleCount: 44,
    dpr: [1, 1.5],
  });

  useEffect(() => {
    const updateQuality = () => {
      const compact =
        window.innerWidth < 768 ||
        window.matchMedia("(pointer: coarse)").matches;

      setQuality({
        compact,
        particleCount: compact ? 24 : 54,
        sparkleCount: compact ? 22 : 44,
        dpr: compact ? [1, 1.15] : [1, 1.5],
      });
    };

    updateQuality();
    window.addEventListener("resize", updateQuality);

    return () => {
      window.removeEventListener("resize", updateQuality);
    };
  }, []);

  return quality;
}

function createSeededRandom(seed = 192837) {
  let value = seed % 2147483647;

  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function FloatingParticles({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const random = createSeededRandom(12052026);

    return Array.from({ length: count }, () => ({
      basePosition: new THREE.Vector3(
        (random() - 0.5) * 18,
        (random() - 0.5) * 13,
        (random() - 0.5) * 18
      ),
      speed: random() * 0.22 + 0.08,
      offset: random() * Math.PI * 2,
      scale: random() * 0.055 + 0.018,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const elapsed = clock.elapsedTime;

    particles.forEach((particle, index) => {
      const { basePosition, speed, offset, scale } = particle;

      dummy.position.set(
        basePosition.x + Math.sin(elapsed * speed + offset) * 0.42,
        basePosition.y + Math.cos(elapsed * speed + offset * 1.2) * 0.42,
        basePosition.z + Math.sin(elapsed * speed * 0.7 + offset) * 0.3
      );

      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#5eead4"
        transparent
        opacity={0.58}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

function BinaryField() {
  return (
    <div className="binary-field" aria-hidden="true">
      {BINARY_STREAMS.map((stream, index) => (
        <span
          key={stream}
          className="binary-field__stream"
          style={{
            left: `${12 + (index * 17) % 78}%`,
            top: `${14 + (index * 19) % 70}%`,
            animationDelay: `${index * -1.8}s`,
          }}
        >
          {stream}
        </span>
      ))}
    </div>
  );
}

function World({
  progressRef,
  quality,
}: {
  progressRef: MutableRefObject<number>;
  quality: SceneQuality;
}) {
  const worldRef = useRef<THREE.Group>(null);
  const primaryShapeRef = useRef<THREE.Group>(null);
  const secondaryShapeRef = useRef<THREE.Mesh>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const cursorLightRef = useRef<THREE.PointLight>(null);
  const accentLightRef = useRef<THREE.PointLight>(null);

  const smoothProgressRef = useRef(0);
  const pointerTargetRef = useRef(new THREE.Vector2());
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    smoothProgressRef.current = THREE.MathUtils.damp(
      smoothProgressRef.current,
      progressRef.current,
      5,
      delta
    );

    const progress = smoothProgressRef.current;

    pointerTargetRef.current.set(
      state.pointer.y * 0.14,
      state.pointer.x * 0.16
    );

    if (worldRef.current) {
      worldRef.current.rotation.x = THREE.MathUtils.damp(
        worldRef.current.rotation.x,
        pointerTargetRef.current.x,
        4,
        delta
      );

      worldRef.current.rotation.y = THREE.MathUtils.damp(
        worldRef.current.rotation.y,
        pointerTargetRef.current.y,
        4,
        delta
      );

      worldRef.current.position.y = Math.sin(progress * Math.PI) * 0.35;
    }

    state.camera.position.x =
      Math.sin(progress * Math.PI * 1.15) * 2.5;
    state.camera.position.y =
      Math.sin(progress * Math.PI * 2) * 0.8;
    state.camera.position.z = THREE.MathUtils.lerp(8.5, -8.5, progress);

    cameraTarget.set(
      Math.sin(progress * Math.PI) * 0.5,
      Math.cos(progress * Math.PI * 2) * 0.15,
      THREE.MathUtils.lerp(0, -6, progress)
    );

    state.camera.lookAt(cameraTarget);
    state.camera.rotation.z = Math.sin(progress * Math.PI) * 0.045;

    if (primaryShapeRef.current) {
      primaryShapeRef.current.rotation.x =
        elapsed * 0.32 + progress * Math.PI * 2.2;
      primaryShapeRef.current.rotation.y =
        elapsed * 0.24 + progress * Math.PI * 1.6;

      primaryShapeRef.current.position.set(
        THREE.MathUtils.lerp(3.1, 5.3, progress),
        THREE.MathUtils.lerp(1.4, -1.2, progress),
        THREE.MathUtils.lerp(-1.5, -7, progress)
      );
    }

    if (secondaryShapeRef.current) {
      secondaryShapeRef.current.rotation.x =
        elapsed * 0.22 - progress * Math.PI * 1.7;
      secondaryShapeRef.current.rotation.z =
        elapsed * 0.28 + progress * Math.PI * 2.5;

      secondaryShapeRef.current.position.set(
        THREE.MathUtils.lerp(-3.5, -5.2, progress),
        THREE.MathUtils.lerp(-1.3, 1.1, progress),
        THREE.MathUtils.lerp(-3, -11, progress)
      );
    }

    if (orbRef.current) {
      const pulse =
        1 +
        Math.sin(elapsed * 1.8) * 0.08 +
        Math.sin(progress * Math.PI * 3) * 0.15;

      orbRef.current.scale.setScalar(pulse);
      orbRef.current.position.x = THREE.MathUtils.lerp(1.1, -1.8, progress);
      orbRef.current.position.y = THREE.MathUtils.lerp(-2.2, 1.8, progress);
      orbRef.current.position.z = THREE.MathUtils.lerp(0.5, -5.5, progress);
    }

    if (ringRef.current) {
      ringRef.current.rotation.x = elapsed * 0.18 + progress * Math.PI;
      ringRef.current.rotation.y =
        elapsed * 0.24 + progress * Math.PI * 3;
      ringRef.current.position.z = THREE.MathUtils.lerp(1.5, -7, progress);
    }

    const cursorX = state.pointer.x * 5.5;
    const cursorY = state.pointer.y * 3.4;

    if (cursorLightRef.current) {
      cursorLightRef.current.position.x = THREE.MathUtils.damp(
        cursorLightRef.current.position.x,
        cursorX,
        5,
        delta
      );
      cursorLightRef.current.position.y = THREE.MathUtils.damp(
        cursorLightRef.current.position.y,
        cursorY,
        5,
        delta
      );
    }

    if (accentLightRef.current) {
      accentLightRef.current.position.x = Math.sin(elapsed * 0.38) * 6;
      accentLightRef.current.position.y = Math.cos(elapsed * 0.28) * 4;
      accentLightRef.current.position.z = Math.cos(elapsed * 0.34) * 4;
      accentLightRef.current.color.setHSL(
        (elapsed * 0.025 + progress * 0.16) % 1,
        0.72,
        0.61
      );
    }
  });

  return (
    <group ref={worldRef}>
      <Float speed={1.25} rotationIntensity={0.35} floatIntensity={0.75}>
        <group ref={primaryShapeRef} position={[3.1, 1.4, -1.5]}>
          <RoundedBox
            args={quality.compact ? [1.75, 1.75, 1.75] : [2.15, 2.15, 2.15]}
            radius={0.28}
            smoothness={5}
          >
            <meshStandardMaterial
              color="#1d4ed8"
              emissive="#38bdf8"
              emissiveIntensity={0.42}
              metalness={0.72}
              roughness={0.18}
              transparent
              opacity={0.9}
            />
          </RoundedBox>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(2.18, 2.18, 2.18)]} />
            <lineBasicMaterial color="#8bd7ff" transparent opacity={0.7} />
          </lineSegments>
        </group>
      </Float>

      <Float speed={0.95} rotationIntensity={0.5} floatIntensity={0.65}>
        <mesh ref={secondaryShapeRef} position={[-3.5, -1.3, -3]}>
          <octahedronGeometry args={[1.45, 0]} />
          <meshStandardMaterial
            color="#7dd3fc"
            emissive="#2563eb"
            emissiveIntensity={0.34}
            metalness={0.55}
            roughness={0.24}
            wireframe
          />
        </mesh>
      </Float>

      <Float speed={1.35} rotationIntensity={0.16} floatIntensity={0.6}>
        <mesh ref={orbRef} position={[1.1, -2.2, 0.5]}>
          <sphereGeometry
            args={quality.compact ? [0.7, 20, 20] : [0.78, 32, 32]}
          />
          <meshStandardMaterial
            color="#dbeafe"
            emissive="#ff375f"
            emissiveIntensity={0.14}
            metalness={0.28}
            roughness={0.2}
            transparent
            opacity={0.88}
          />
        </mesh>
      </Float>

      <mesh ref={ringRef} position={[0, 0, 1.5]}>
        <torusGeometry
          args={[2.6, 0.035, 10, quality.compact ? 48 : 80]}
        />
        <meshBasicMaterial
          color="#8dbdff"
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>

      <FloatingParticles count={quality.particleCount} />

      <Sparkles
        count={quality.sparkleCount}
        scale={[15, 10, 18]}
        size={quality.compact ? 1.7 : 2.2}
        speed={0.22}
        opacity={0.35}
        color="#8dbdff"
      />

      <ambientLight intensity={0.7} />
      <pointLight
        ref={cursorLightRef}
        position={[0, 0, 4]}
        color="#0a84ff"
        intensity={1.8}
        distance={13}
      />
      <pointLight
        ref={accentLightRef}
        position={[-4, 3, 2]}
        color="#5e5ce6"
        intensity={1.5}
        distance={18}
      />
      <directionalLight
        position={[7, 8, 5]}
        color="#ffffff"
        intensity={0.95}
      />
    </group>
  );
}

function TextStep({
  stepRef,
  number,
  eyebrow,
  title,
  highlight,
  description,
}: TextStepProps) {
  return (
    <div
      ref={stepRef}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "min(760px, calc(100% - 2rem))",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        visibility: "hidden",
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.65rem",
          marginBottom: "1.35rem",
          padding: "0.55rem 0.9rem",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-full)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)",
        }}
      >
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--cyan)",
          }}
        >
          {number}
        </span>

        <span
          aria-hidden="true"
          style={{
            width: 24,
            height: 1,
            background: "var(--glass-border)",
          }}
        />

        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--fg-dim)",
          }}
        >
          {eyebrow}
        </span>
      </div>

      <h2
        style={{
          margin: 0,
          fontSize: "clamp(2.6rem, 7vw, 5.6rem)",
          lineHeight: 0.98,
          letterSpacing: "-0.055em",
          textWrap: "balance",
        }}
      >
        {title}
        <br />
        <span className="text-gradient">{highlight}</span>
      </h2>

      <p
        style={{
          maxWidth: 580,
          margin: "1.4rem auto 0",
          fontSize: "clamp(1rem, 2vw, 1.18rem)",
          lineHeight: 1.75,
          color: "var(--fg-dim)",
          textWrap: "balance",
        }}
      >
        {description}
      </p>
    </div>
  );
}

export default function ScrollExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const topGlowRef = useRef<HTMLDivElement>(null);
  const bottomGlowRef = useRef<HTMLDivElement>(null);

  const stepOneRef = useRef<HTMLDivElement>(null);
  const stepTwoRef = useRef<HTMLDivElement>(null);
  const stepThreeRef = useRef<HTMLDivElement>(null);

  const progressRef = useRef(0);
  const quality = useSceneQuality();
  const shouldReduceMotion = useReducedMotion() ?? false;

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;

    if (!section || !pin) {
      return;
    }

    ScrollTrigger.getById(SCROLL_TRIGGER_ID)?.kill(true);

    const context = gsap.context(() => {
      const steps = [
        stepOneRef.current,
        stepTwoRef.current,
        stepThreeRef.current,
      ].filter((element): element is HTMLDivElement => Boolean(element));

      gsap.set(steps, {
        autoAlpha: 0,
        x: 0,
        y: shouldReduceMotion ? 0 : 42,
        scale: shouldReduceMotion ? 1 : 0.97,
        filter: shouldReduceMotion ? "none" : "blur(6px)",
      });

      gsap.set(progressBarRef.current, {
        scaleY: 0,
        transformOrigin: "top center",
      });

      gsap.set(heroRef.current, {
        x: 0,
        y: 0,
        scale: 1,
        rotateX: 0,
        transformPerspective: 1200,
        transformOrigin: "50% 50%",
      });

      gsap.set([topGlowRef.current, bottomGlowRef.current], {
        xPercent: 0,
        yPercent: 0,
        scale: 1,
      });

      if (!shouldReduceMotion) {
        gsap.to(scrollHintRef.current, {
          y: -10,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      const timeline = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        scrollTrigger: {
          id: SCROLL_TRIGGER_ID,
          trigger: section,
          pin,
          pinSpacing: true,
          pinReparent: false,
          start: "top top",
          end: () => {
            const compact = window.innerWidth < 768;
            const distance = compact
              ? Math.max(1500, window.innerHeight * 2.1)
              : Math.max(2200, window.innerHeight * 2.6);

            return `+=${Math.round(distance)}`;
          },
          scrub: shouldReduceMotion ? true : 1.15,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          onUpdate: (self) => {
            progressRef.current = self.progress;

            if (progressBarRef.current) {
              gsap.set(progressBarRef.current, {
                scaleY: self.progress,
              });
            }
          },
        },
      });

      timeline.to(
        heroRef.current,
        {
          autoAlpha: 0,
          y: shouldReduceMotion ? 0 : -54,
          x: shouldReduceMotion ? 0 : -12,
          scale: shouldReduceMotion ? 1 : 0.975,
          rotateX: shouldReduceMotion ? 0 : 5,
          filter: shouldReduceMotion ? "none" : "blur(3px)",
          duration: 0.2,
        },
        0
      );

      timeline.to(
        scrollHintRef.current,
        {
          autoAlpha: 0,
        },
        0
      );

      timeline.to(
        topGlowRef.current,
        {
          xPercent: 10,
          yPercent: -8,
          scale: 1.08,
        },
        0
      );

      timeline.to(
        bottomGlowRef.current,
        {
          xPercent: -8,
          yPercent: 10,
          scale: 1.1,
        },
        0
      );

      timeline.to(
        heroRef.current,
        {
          y: shouldReduceMotion ? 0 : -10,
          x: shouldReduceMotion ? 0 : 6,
          rotateX: shouldReduceMotion ? 0 : -3,
          scale: shouldReduceMotion ? 1 : 1.005,
          duration: 0.16,
        },
        0.16
      );

      timeline.fromTo(
        stepOneRef.current,
        {
          autoAlpha: 0,
          x: 0,
          y: shouldReduceMotion ? 0 : 42,
          scale: shouldReduceMotion ? 1 : 0.97,
          filter: shouldReduceMotion ? "none" : "blur(6px)",
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.2,
        },
        0.16
      );

      timeline.to(
        stepOneRef.current,
        {
          autoAlpha: 0,
          y: shouldReduceMotion ? 0 : -34,
          x: shouldReduceMotion ? 0 : -6,
          scale: shouldReduceMotion ? 1 : 1.02,
          filter: shouldReduceMotion ? "none" : "blur(6px)",
          duration: 0.12,
        },
        0.38
      );

      timeline.fromTo(
        stepTwoRef.current,
        {
          autoAlpha: 0,
          x: 0,
          y: shouldReduceMotion ? 0 : 42,
          scale: shouldReduceMotion ? 1 : 0.97,
          filter: shouldReduceMotion ? "none" : "blur(6px)",
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.2,
        },
        0.49
      );

      timeline.to(
        stepTwoRef.current,
        {
          autoAlpha: 0,
          y: shouldReduceMotion ? 0 : -34,
          x: shouldReduceMotion ? 0 : 6,
          scale: shouldReduceMotion ? 1 : 1.02,
          filter: shouldReduceMotion ? "none" : "blur(6px)",
          duration: 0.12,
        },
        0.72
      );

      timeline.fromTo(
        stepThreeRef.current,
        {
          autoAlpha: 0,
          x: 0,
          y: shouldReduceMotion ? 0 : 42,
          scale: shouldReduceMotion ? 1 : 0.97,
          filter: shouldReduceMotion ? "none" : "blur(6px)",
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.15,
        },
        0.82
      );

      timeline.to(
        stepThreeRef.current,
        {
          autoAlpha: 0,
          y: shouldReduceMotion ? 0 : -32,
          scale: shouldReduceMotion ? 1 : 1.02,
          filter: shouldReduceMotion ? "none" : "blur(6px)",
          duration: 0.12,
        },
        1.02
      );
    }, pin);

    const refreshFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      progressRef.current = 0;
      context.revert();
    };
  }, [shouldReduceMotion]);

  return (
    <section
      ref={sectionRef}
      id="home"
      aria-label="Portfolio introduction"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100svh",
        background: "var(--bg)",
      }}
    >
      <div
        ref={pinRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100svh",
          minHeight: quality.compact ? 620 : 680,
          overflow: "hidden",
          isolation: "isolate",
          background: "var(--bg)",
        }}
      >
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
        >
          {!shouldReduceMotion ? (
            <Canvas
              frameloop="always"
              dpr={quality.dpr}
              camera={{
                position: [0, 0, 8.5],
                fov: quality.compact ? 56 : 50,
                near: 0.1,
                far: 100,
              }}
              gl={{
                alpha: true,
                antialias: !quality.compact,
                powerPreference: "high-performance",
              }}
            >
              <Suspense fallback={null}>
                <World progressRef={progressRef} quality={quality} />
              </Suspense>
            </Canvas>
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `
                  radial-gradient(circle at 72% 25%, rgba(10, 132, 255, 0.16), transparent 30%),
                  radial-gradient(circle at 25% 70%, rgba(94, 92, 230, 0.14), transparent 32%)
                `,
              }}
            />
          )}
        </div>

        <div
          ref={topGlowRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            zIndex: 1,
            width: "55vw",
            height: "55vw",
            maxWidth: 760,
            maxHeight: 760,
            borderRadius: "50%",
            background: "var(--cyan-glow)",
            filter: "blur(110px)",
            opacity: 0.55,
            pointerEvents: "none",
          }}
        />

        <div
          ref={bottomGlowRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-30%",
            left: "-15%",
            zIndex: 1,
            width: "60vw",
            height: "60vw",
            maxWidth: 800,
            maxHeight: 800,
            borderRadius: "50%",
            background: "var(--purple-glow)",
            filter: "blur(120px)",
            opacity: 0.42,
            pointerEvents: "none",
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "radial-gradient(ellipse at center, transparent 20%, var(--bg) 108%)",
            pointerEvents: "none",
          }}
        />

        <BinaryField />

        {!quality.compact && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50%",
              right: "clamp(1.25rem, 3vw, 3rem)",
              zIndex: 4,
              width: 2,
              height: 110,
              overflow: "hidden",
              borderRadius: 999,
              background: "var(--glass-border)",
              transform: "translateY(-50%)",
            }}
          >
            <div
              ref={progressBarRef}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "inherit",
                background:
                  "linear-gradient(to bottom, var(--cyan), var(--purple))",
              }}
            />
          </div>
        )}

        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 3,
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <div
            ref={heroRef}
            style={{
              width: "min(900px, 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <motion.div
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 18 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
            >
              <div
                className="section-tag hero-availability"
                style={{
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                  backdropFilter: "blur(12px)",
                }}
              >
                <motion.span
                  aria-hidden="true"
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          opacity: [0.45, 1, 0.45],
                          scale: [0.9, 1.15, 0.9],
                        }
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#0a84ff",
                    boxShadow: "0 0 14px rgba(10, 132, 255, 0.6)",
                  }}
                />
                Available for selected projects
              </div>
            </motion.div>

            <motion.h1
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 32 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.28,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                maxWidth: 920,
                margin: 0,
                fontSize: quality.compact
                  ? "clamp(2.7rem, 16vw, 4.8rem)"
                  : "clamp(3.2rem, 10vw, 8rem)",
                lineHeight: quality.compact ? 0.94 : 0.88,
                letterSpacing: quality.compact ? "-0.052em" : "-0.065em",
                textWrap: "balance",
              }}
            >
              <motion.span
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.65, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "block" }}
              >
                STUDENT
              </motion.span>
              <motion.span
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.75, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="text-gradient"
                style={{ display: "block" }}
              >
                CREATOR
              </motion.span>
            </motion.h1>

            <motion.p
              className="hero-description"
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 24, filter: "blur(8px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.65, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
              style={{
                maxWidth: 620,
                margin: quality.compact ? "1.2rem auto 0" : "1.75rem auto 0",
                fontSize: quality.compact
                  ? "clamp(0.94rem, 4vw, 1.05rem)"
                  : "clamp(1rem, 2vw, 1.18rem)",
                lineHeight: quality.compact ? 1.65 : 1.75,
                textWrap: "balance",
              }}
            >
              คิดให้เป็น ทำให้ใช้งานได้จริง ใส่ใจทุกงาน
              ตั้งแต่เว็บไซต์ ระบบข้อมูล ไปจนถึงคอนเทนต์วิดีโอ
            </motion.p>

            <motion.div
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="hero-actions"
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: quality.compact ? "0.75rem" : "1rem",
                marginTop: quality.compact ? "1.5rem" : "2rem",
              }}
            >
              <MagneticButton strength={0.22}>
                <a
                  href="#projects"
                  className="btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.55rem",
                  }}
                >
                  <span>Explore projects</span>
                  <ArrowUpRight size={17} />
                </a>
              </MagneticButton>

              <MagneticButton strength={0.22}>
                <a href="#contact" className="btn-outline">
                  Start a conversation
                </a>
              </MagneticButton>
            </motion.div>
          </div>

          <TextStep
            stepRef={stepOneRef}
            number="01"
            eyebrow="Discover"
            title="Ideas become"
            highlight="experiences."
            description="Every project begins by understanding the people, purpose, and constraints behind the product."
          />

          <TextStep
            stepRef={stepTwoRef}
            number="02"
            eyebrow="Engineer"
            title="Complexity becomes"
            highlight="clarity."
            description="Scalable architecture, precise interaction, and maintainable code work together as one coherent system."
          />

          <TextStep
            stepRef={stepThreeRef}
            number="03"
            eyebrow="Deliver"
            title="Details create"
            highlight="impact."
            description="The final experience is refined across performance, accessibility, responsiveness, and visual polish."
          />
        </div>

        <div
          ref={scrollHintRef}
          className="hero-scroll-hint"
          style={{
            position: "absolute",
            bottom: "max(1.5rem, env(safe-area-inset-bottom))",
            left: "50%",
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.45rem",
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        >
          <motion.div
            initial={
              shouldReduceMotion ? false : { opacity: 0, y: 10 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.95 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.45rem",
            }}
          >
            <span
              style={{
                fontSize: "0.67rem",
                fontWeight: 600,
                letterSpacing: "0.16em",
              }}
            >
              SCROLL TO EXPLORE
            </span>

            <motion.div
              animate={
                shouldReduceMotion ? undefined : { y: [0, 7, 0] }
              }
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ArrowDown size={16} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
