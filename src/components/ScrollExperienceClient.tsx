"use client";

import dynamic from "next/dynamic";

const ScrollExperience = dynamic(
  () => import("@/components/ScrollExperience"),
  {
    loading: () => <ScrollExperienceLoading />,
  }
);

function ScrollExperienceLoading() {
  return (
    <section
      aria-label="Loading portfolio introduction"
      aria-busy="true"
      style={{
        minHeight: "100svh",
        width: "100%",
        display: "grid",
        placeItems: "center",
        background: "var(--bg, #0a0b0f)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          color: "var(--fg-dim, #a0aec0)",
        }}
      >
        <div
          className="scroll-experience-loader"
          aria-hidden="true"
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "3px solid rgba(79, 209, 197, 0.18)",
            borderTopColor: "var(--cyan, #4fd1c5)",
          }}
        />

        <span
          style={{
            fontSize: "0.8rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Loading experience
        </span>
      </div>

      <style jsx>{`
        .scroll-experience-loader {
          animation: scroll-experience-spin 0.8s linear infinite;
        }

        @keyframes scroll-experience-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-experience-loader {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

export default function ScrollExperienceClient() {
  return <ScrollExperience />;
}
