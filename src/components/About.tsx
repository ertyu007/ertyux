"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { Code2, Layers, Zap, Globe } from "lucide-react";

/* ── Data ── */
const skills = [
  "React / Next.js", "TypeScript", "Three.js / WebGL",
  "Node.js", "PostgreSQL", "Supabase", "Framer Motion",
  "UI/UX Design", "REST / GraphQL", "Docker", "AWS",
];

const stats = [
  { value: 5, suffix: "+", label: "Years Experience" },
  { value: 40, suffix: "+", label: "Projects Shipped" },
  { value: 99, suffix: "%", label: "Client Satisfaction" },
  { value: 0, suffix: "∞", label: "Cups of Coffee" },
];

const cards = [
  { icon: Code2, title: "Frontend", desc: "Pixel-perfect UIs with a focus on micro-interactions and performance.", color: "var(--cyan)" },
  { icon: Zap, title: "Backend", desc: "Scalable APIs, real-time systems, and reliable cloud infrastructure.", color: "var(--purple)" },
  { icon: Layers, title: "3D & WebGL", desc: "Immersive 3D experiences using Three.js and React Three Fiber.", color: "var(--pink)" },
  { icon: Globe, title: "Full-Stack", desc: "End-to-end delivery from database schema to polished deployment.", color: "var(--cyan)" },
];

/* ── Animation variants ── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ── Counter Component ── */
function AnimatedCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || value === 0) return;

    let current = 0;
    const step = Math.max(1, Math.floor(value / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(current);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      variants={cardVariant}
      style={{
        textAlign: "center",
        padding: "2rem 1.5rem",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--glass-border)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(12px)",
        transition: "var(--transition)",
      }}
      whileHover={{
        y: -4,
        borderColor: "var(--cyan)",
        boxShadow: "0 0 25px var(--cyan-glow)",
      }}
    >
      <div
        style={{
          fontSize: "2.8rem",
          fontWeight: 900,
          fontFamily: "'Space Grotesk', sans-serif",
          lineHeight: 1,
        }}
        className="text-gradient"
      >
        {value === 0 ? suffix : `${count}${suffix}`}
      </div>
      <div
        style={{
          fontSize: "0.78rem",
          color: "var(--fg-dim)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginTop: "0.5rem",
        }}
      >
        {label}
      </div>
    </motion.div>
  );
}

/* ── Capability Card ── */
function CapabilityCard({
  icon: Icon, title, desc, color,
}: {
  icon: typeof Code2; title: string; desc: string; color: string;
}) {
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      variants={cardVariant}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="glass-card"
      style={{
        padding: "2rem",
        cursor: "default",
        transition: "var(--transition)",
        transform: hover ? "translateY(-6px)" : "translateY(0)",
        borderColor: hover ? color : undefined,
        boxShadow: hover ? `0 10px 40px ${color}20` : undefined,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "var(--radius-sm)",
          background: `${color}12`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.25rem",
          color: color,
          transition: "var(--transition)",
          transform: hover ? "scale(1.1) rotate(-5deg)" : "scale(1)",
        }}
      >
        <Icon size={24} />
      </div>
      <h3 style={{ marginBottom: "0.6rem", fontSize: "1.2rem" }}>{title}</h3>
      <p style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>{desc}</p>
    </motion.div>
  );
}

/* ── Main Component ── */
export default function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          style={{ marginBottom: "3.5rem" }}
        >
          <div className="section-tag">About</div>
          <h2 style={{ marginBottom: "1rem" }}>
            Who I <span className="text-gradient">Am</span>
          </h2>
          <p style={{ maxWidth: "620px", fontSize: "1.1rem" }}>
            I&apos;m a Senior Software Engineer who bridges the gap between
            engineering rigor and creative design. I build products that don&apos;t
            just work — they{" "}
            <em style={{ color: "var(--cyan)", fontStyle: "normal", fontWeight: 600 }}>
              feel
            </em>{" "}
            exceptional to use.
          </p>
        </motion.div>

        {/* Capability Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.25rem",
            marginBottom: "4rem",
          }}
        >
          {cards.map((card) => (
            <CapabilityCard key={card.title} {...card} />
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem",
            marginBottom: "4rem",
          }}
        >
          {stats.map((stat) => (
            <AnimatedCounter key={stat.label} {...stat} />
          ))}
        </motion.div>

        {/* Skill Tags */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <p
            style={{
              fontSize: "0.78rem",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
              marginBottom: "1rem",
            }}
          >
            Tech Stack
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {skills.map((skill, i) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                whileHover={{
                  scale: 1.08,
                  borderColor: "var(--cyan)",
                  color: "var(--cyan)",
                  background: "var(--cyan-subtle)",
                  boxShadow: "0 0 15px var(--cyan-glow)",
                }}
                style={{
                  padding: "0.45rem 1.1rem",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass-bg)",
                  fontSize: "0.85rem",
                  color: "var(--fg-dim)",
                  cursor: "default",
                  transition: "var(--transition)",
                }}
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
