"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowUpRight, Music2, Video } from "lucide-react";

// Inline SVG components for social icons
const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const socials = [
  { icon: GithubIcon, href: "https://github.com/ertyu007", label: "GitHub" },
  { icon: Music2, href: "https://www.tiktok.com/@ertyu0075", label: "TikTok" },
  { icon: Video, href: "https://youtube.com/@amazingwuji", label: "YouTube" },
];

const navLinks = [
  { name: "Home",     id: "home"     },
  { name: "About",    id: "about"    },
  { name: "Services", id: "services" },
  { name: "Projects", id: "projects" },
  { name: "Contact",  id: "contact"  },
];

/** Scroll smoothly to a section by id */
function scrollToSection(id: string) {
  if (id === "home") {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    return;
  }
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function Footer() {
  const scrollToTop = () => scrollToSection("home");
  const year = new Date().getFullYear();

  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    scrollToSection(id);
    window.history.replaceState(null, "", id === "home" ? "/" : `#${id}`);
  };

  return (
    <footer
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "clamp(4rem, 8vw, 6rem) 0 2rem",
        background: "var(--bg)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "auto -10% 0 -10%",
          height: "70%",
          background:
            "radial-gradient(circle at 18% 80%, var(--cyan-glow), transparent 34%), radial-gradient(circle at 78% 35%, var(--purple-glow), transparent 32%)",
          filter: "blur(36px)",
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--cyan), var(--purple), transparent)",
          opacity: 0.45,
          marginBottom: "2rem",
        }}
      />

      <div className="container" style={{ position: "relative" }}>
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card footer-panel"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(240px, 1.1fr) minmax(220px, 0.9fr) auto",
            gap: "clamp(1.5rem, 4vw, 3rem)",
            alignItems: "center",
            padding: "clamp(1.4rem, 4vw, 2rem)",
            marginBottom: "1rem",
            background: "var(--bg-elevated)",
            border: "1px solid rgba(10, 132, 255, 0.14)",
            boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(1.65rem, 4vw, 2.4rem)",
                letterSpacing: "0",
                marginBottom: "0.7rem",
              }}
              className="text-gradient"
            >
              PORTFOLIO.
            </div>
            <p style={{ maxWidth: 420, margin: 0, fontSize: "0.92rem" }}>
              Polished interfaces, smooth interaction, and practical engineering for digital products that feel good to use.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <ul
              style={{
                listStyle: "none",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.65rem 1.25rem",
                margin: 0,
                padding: 0,
              }}
            >
              {navLinks.map((link) => (
                <li key={link.name}>
                  <motion.a
                    href={`#${link.id}`}
                    onClick={(e) => handleNavClick(e, link.id)}
                    style={{
                      color: "var(--fg-dim)",
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      transition: "var(--transition)",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                    whileHover={{ color: "var(--cyan)", x: 4 }}
                  >
                    {link.name}
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </motion.a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer-panel__actions" style={{ display: "grid", gap: "0.85rem", justifyItems: "end" }}>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              {socials.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  whileHover={{ y: -4, color: "var(--cyan)", borderColor: "var(--cyan)", scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 44,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    border: "1px solid rgba(10, 132, 255, 0.16)",
                    color: "var(--fg-dim)",
                    transition: "var(--transition)",
                    background: "var(--bg-elevated)",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
                  }}
                >
                  <Icon size={17} />
                </motion.a>
              ))}
            </div>

            <motion.button
              onClick={scrollToTop}
              whileHover={{ y: -3, color: "var(--cyan)", borderColor: "var(--cyan)", scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                minHeight: 44,
                background: "linear-gradient(135deg, rgba(10,132,255,0.12), rgba(94,92,230,0.08))",
                border: "1px solid rgba(10, 132, 255, 0.18)",
                borderRadius: "var(--radius-full)",
                padding: "0.55rem 1rem",
                color: "var(--fg)",
                fontSize: "0.82rem",
                fontWeight: 800,
                cursor: "pointer",
                transition: "var(--transition)",
              }}
            >
              <ArrowUp size={14} /> Back to top
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.08 }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            padding: "0.75rem 0.25rem 0",
          }}
        >
          <p style={{ fontSize: "0.82rem", color: "var(--fg-dim)", margin: 0 }}>
            © {year} PORTFOLIO. All rights reserved.
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--fg-dim)", margin: 0 }}>
            Built with Next.js, Three.js, and a little motion polish.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
