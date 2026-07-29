"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { Code2, Layers, Zap, Globe } from "lucide-react";
import Image from "next/image";

/* ── Data ── */
const skills = [
  "HTML / CSS", "JavaScript", "React / Next.js", "TypeScript",
  "Python", "C", "Node.js", "Git / GitHub", "Linux",
  "ESP32 / Arduino", "OpenCV",
];

const stats = [
  { value: 12, suffix: "", label: "Public Repositories" },
  { value: 4, suffix: "", label: "GitHub Stars" },
  { value: 3, suffix: "", label: "บริการที่รับทำ" },
  { value: 0, suffix: "∞", label: "ความอยากเรียนรู้" },
];

const cards = [
  { icon: Code2, title: "เขียนเว็บไซต์", desc: "รับทำเว็บไซต์ responsive ตั้งแต่หน้าแนะนำตัว เว็บธุรกิจ ไปจนถึงเว็บแอปขนาดเล็ก", color: "var(--cyan)" },
  { icon: Zap, title: "ปรึกษาเรื่องคอม", desc: "ช่วยวิเคราะห์ปัญหา Windows โปรแกรม เครือข่าย และการตั้งค่าเครื่อง", color: "var(--purple)" },
  { icon: Layers, title: "ตัดต่อวิดีโอ", desc: "รับตัดต่อวิดีโอสำหรับคอนเทนต์ สื่อการสอน และงานประชาสัมพันธ์", color: "var(--pink)" },
  { icon: Globe, title: "โปรเจกต์ IoT", desc: "สนใจระบบ ESP32, Arduino, เซนเซอร์ และการเชื่อมต่อฮาร์ดแวร์กับซอฟต์แวร์", color: "var(--cyan)" },
];

/* ── Animation variants ── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 44, scale: 0.96, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
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
        y: -6,
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
        transform: hover ? "translateY(-8px)" : "translateY(0)",
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
          transform: hover ? "scale(1.08) rotate(-4deg)" : "scale(1)",
        }}
      >
        <Icon size={24} />
      </div>
      <motion.h3
        initial={{ opacity: 0.88 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: "0.6rem", fontSize: "1.2rem" }}
      >
        {title}
      </motion.h3>
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
          className="about-intro"
          style={{ marginBottom: "2rem" }}
        >
          <Image
            src="/profile.jpg"
            alt="Thanaphat Karajhak (MK)"
            width={190}
            height={230}
            sizes="(max-width: 520px) 150px, 190px"
            className="about-profile-image"
            priority={false}
          />
          <div className="section-tag">About</div>
          <h2 style={{ marginBottom: "0.45rem" }}>
            Thanaphat <span className="text-gradient">Karajhak</span>
          </h2>
          <p style={{ marginBottom: "1rem", fontWeight: 600 }}>
            นายธนภัทร การะจักษ์ — เอ็มเค (MK)
          </p>
          <motion.p
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
            style={{ maxWidth: "620px", fontSize: "1.1rem" }}
          >
            ตอนนี้ผมเป็นนักเรียนที่สนใจด้านคอมพิวเตอร์ การเขียนโปรแกรม และงานดิจิทัล
            รับงานเขียนเว็บไซต์ ปรึกษาเรื่องคอม และรับตัดต่อวิดีโอ โดยตั้งใจเรียนรู้จากทุกโปรเจกต์
          </motion.p>
          <p style={{ maxWidth: "620px", marginTop: "0.75rem", fontSize: "0.95rem" }}>
            นักเรียน ปวส. 1 เทคนิคคอมพิวเตอร์ วิทยาลัยเทคนิคอำนาจเจริญ อายุ 18 ปี
            รับงานแบบ WFH หรือพื้นที่ใกล้เคียงอำนาจเจริญ
          </p>
        </motion.div>

        {/* Capability Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="about-capabilities"
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
          className="about-stats"
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
          className="about-stack"
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
                initial={{ opacity: 0, y: 8, scale: 0.94 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.035, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{
                  scale: 1.06,
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
