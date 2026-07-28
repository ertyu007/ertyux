"use client";

import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

// Inline SVG components for social icons
const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const TwitterIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const socials = [
  { icon: GithubIcon, href: "#", label: "GitHub" },
  { icon: TwitterIcon, href: "#", label: "Twitter" },
  { icon: LinkedinIcon, href: "#", label: "LinkedIn" },
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const year = new Date().getFullYear();

  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    scrollToSection(id);
    window.history.replaceState(null, "", id === "home" ? "/" : `#${id}`);
  };

  return (
    <footer style={{ position: "relative", padding: "4rem 0 2.5rem", background: "var(--bg)" }}>
      {/* Top subtle gradient line */}
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--cyan), var(--purple), transparent)",
          opacity: 0.3,
          marginBottom: "3rem",
        }}
      />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "2rem",
            marginBottom: "2.5rem",
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                fontSize: "1.35rem",
                letterSpacing: "-0.02em",
              }}
              className="text-gradient"
            >
              PORTFOLIO
            </div>
          </div>

          {/* Minimal Links */}
          <nav aria-label="Footer navigation">
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                alignItems: "center",
                gap: "1.8rem",
                margin: 0,
                padding: 0,
                flexWrap: "wrap",
              }}
            >
              {navLinks.map((link) => (
                <li key={link.name}>
                  <motion.a
                    href={`#${link.id}`}
                    onClick={(e) => handleNavClick(e, link.id)}
                    style={{
                      color: "var(--fg-dim)",
                      fontSize: "0.88rem",
                      textDecoration: "none",
                      transition: "var(--transition)",
                      fontWeight: 500,
                    }}
                    whileHover={{ color: "var(--cyan)" }}
                  >
                    {link.name}
                  </motion.a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social Icons */}
          <div style={{ display: "flex", gap: "0.6rem" }}>
            {socials.map(({ icon: Icon, href, label }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                whileHover={{ y: -2, color: "var(--cyan)", borderColor: "var(--cyan)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 38,
                  height: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  border: "1px solid var(--glass-border)",
                  color: "var(--fg-dim)",
                  transition: "var(--transition)",
                  background: "var(--glass-bg)",
                }}
              >
                <Icon size={16} />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            borderTop: "1px solid var(--glass-border)",
            paddingTop: "1.5rem",
          }}
        >
          <p style={{ fontSize: "0.82rem", color: "var(--fg-dim)", margin: 0 }}>
            © {year} PORTFOLIO. All rights reserved.
          </p>

          <motion.button
            onClick={scrollToTop}
            whileHover={{ y: -2, color: "var(--cyan)", borderColor: "var(--cyan)" }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-full)",
              padding: "0.45rem 1.1rem",
              color: "var(--fg-dim)",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "var(--transition)",
            }}
          >
            <ArrowUp size={13} /> Back to top
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
