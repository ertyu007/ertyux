"use client";

import { useRef, useCallback } from "react";
import { motion, Variants } from "framer-motion";
import { Code, Palette, Box, ArrowRight } from "lucide-react";

const services = [
  {
    icon: Code,
    title: "รับเขียนเว็บไซต์",
    description: "รับทำเว็บร้านค้าและหน้าเว็บไซต์ เชื่อมฐานข้อมูลและ deploy ให้ได้ โดยรับเฉพาะงานฝั่งเว็บไซต์",
    gradient: "linear-gradient(135deg, #4fd1c5, #319795)",
  },
  {
    icon: Palette,
    title: "ปรึกษาเรื่องคอม",
    description: "ปรึกษาผ่านแชตหรือ Remote ช่วยแก้ปัญหาโปรแกรม Windows เครือข่าย และการตั้งค่าเครื่อง",
    gradient: "linear-gradient(135deg, #b794f4, #805ad5)",
  },
  {
    icon: Box,
    title: "รับตัดต่อวิดีโอ",
    description: "รับตัดวิดีโอโปรโมตและวิดีโอเล่น ๆ ด้วย CapCut, After Effects และ Premiere Pro",
    gradient: "linear-gradient(135deg, #f687b3, #d53f8c)",
  },
];

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 54, rotateX: 10, filter: "blur(10px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.12,
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

function ServiceCard({
  icon: Icon,
  title,
  description,
  gradient,
  index,
}: {
  icon: typeof Code;
  title: string;
  description: string;
  gradient: string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty("--mouse-x", `${x}%`);
    cardRef.current.style.setProperty("--mouse-y", `${y}%`);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={cardVariant}
      onMouseMove={handleMouseMove}
      className="neu-card"
      style={{
        padding: "2.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        perspective: "1000px",
        cursor: "default",
      }}
      whileHover={{ y: -10, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Icon with gradient background */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "var(--radius-sm)",
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          boxShadow: `0 8px 24px ${gradient.includes("4fd1c5") ? "var(--cyan-glow)" : gradient.includes("b794f4") ? "var(--purple-glow)" : "var(--pink-glow)"}`,
          transition: "var(--transition)",
        }}
      >
        <Icon size={28} />
      </div>

      <h3 style={{ fontSize: "1.4rem", letterSpacing: "-0.3px" }}>{title}</h3>
      <p style={{ flex: 1, lineHeight: 1.75 }}>{description}</p>

      <motion.a
        href="/#contact"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "none",
          border: "none",
          color: "var(--cyan)",
          fontWeight: 600,
          fontSize: "0.95rem",
          padding: "0.5rem 0",
          cursor: "pointer",
          transition: "var(--transition)",
        }}
        whileHover={{ x: 8, opacity: 1 }}
      >
        Learn More <ArrowRight size={16} />
      </motion.a>
    </motion.div>
  );
}

export default function Services() {
  return (
    <section id="services" className="section container">
        <motion.div
          className="section-heading"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: "center", marginBottom: "3rem" }}
        >
        <div className="section-tag" style={{ justifyContent: "center" }}>What I Do</div>
        <h2>
          My <span className="text-gradient">Services</span>
        </h2>
        <p style={{ maxWidth: 500, margin: "1rem auto 0" }}>
          Comprehensive solutions from concept to deployment, crafted with precision.
        </p>
      </motion.div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {services.map((service, i) => (
          <ServiceCard key={service.title} {...service} index={i} />
        ))}
      </div>
    </section>
  );
}
