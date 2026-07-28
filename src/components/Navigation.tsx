"use client";
import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Home",     id: "home"     },
  { name: "About",    id: "about"    },
  { name: "Services", id: "services" },
  { name: "Projects", id: "projects" },
  { name: "Contact",  id: "contact"  },
];

const subscribeToClient = () => () => {};

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

export default function Navigation() {
  const pathname  = usePathname();
  const [scrolled, setScrolled]           = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { theme, setTheme, systemTheme }  = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false
  );
  const { scrollY }                       = useScroll();

  const isAdminPage = pathname?.startsWith("/admin") ?? false;

  /* ── Scroll-driven glass effect ── */
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (isAdminPage) return;
    setScrolled(latest > 50);
  });

  /* ── Active-section observer ── */
  useEffect(() => {
    if (isAdminPage) return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of viewport that is intersecting
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((prev, curr) =>
          prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
        );
        setActiveSection(top.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isAdminPage]);

  /* ── Close mobile menu on outside click / Escape ── */
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileMenuOpen]);

  /* ── Handlers ── */
  const handleNavClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      setMobileMenuOpen(false);
      scrollToSection(id);
      // Update URL hash without page reload
      history.replaceState(null, "", id === "home" ? "/" : `#${id}`);
    },
    []
  );

  const toggleTheme = () => {
    const currentTheme = theme === "system" ? systemTheme : theme;
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark");

  /* ── Don't render on admin pages ── */
  if (isAdminPage) return null;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0.75rem 0",
          background: scrolled ? "var(--glass-bg)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "none",
          borderBottom: scrolled ? "1px solid var(--glass-border)" : "1px solid transparent",
          transition: "background 0.4s ease, backdrop-filter 0.4s ease, border 0.4s ease",
        }}
      >
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

          {/* Logo */}
          <motion.a
            href="/"
            onClick={(e) => handleNavClick(e, "home")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              fontWeight: 900,
              fontSize: "1.5rem",
              letterSpacing: "2px",
              position: "relative",
              textDecoration: "none",
            }}
            className="text-gradient"
          >
            PORTFOLIO.
          </motion.a>

          {/* Desktop Nav */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                gap: "0.25rem",
                background: scrolled ? "var(--bg-2)" : "rgba(255,255,255,0.05)",
                borderRadius: "var(--radius-full)",
                padding: "0.3rem",
                border: `1px solid ${scrolled ? "var(--glass-border)" : "rgba(255,255,255,0.08)"}`,
                transition: "all 0.4s ease",
              }}
            >
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.name}
                    href={`#${link.id}`}
                    onClick={(e) => handleNavClick(e, link.id)}
                    style={{
                      position: "relative",
                      padding: "0.5rem 1rem",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: isActive ? "var(--cyan)" : "var(--fg-dim)",
                      transition: "color 0.3s ease",
                      zIndex: 1,
                      textDecoration: "none",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "var(--radius-full)",
                          background: "var(--cyan-subtle)",
                          border: "1px solid var(--cyan)",
                          boxShadow: "0 0 12px var(--cyan-glow)",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span style={{ position: "relative", zIndex: 1 }}>{link.name}</span>
                  </a>
                );
              })}
            </div>

            {/* Theme Toggle */}
            {mounted && (
              <motion.button
                onClick={toggleTheme}
                aria-label="Toggle color theme"
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  marginLeft: "1rem",
                  background: "var(--bg-2)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--cyan)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "var(--neu-shadow-sm)",
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isDark ? "sun" : "moon"}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: "flex" }}
                  >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            )}
          </div>

          {/* Mobile Nav Controls */}
          <div className="mobile-btn" style={{ display: "none", alignItems: "center", gap: "0.75rem" }}>
            {mounted && (
              <motion.button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                whileTap={{ scale: 0.9 }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--cyan)",
                  display: "flex",
                  cursor: "pointer",
                }}
              >
                {isDark ? <Sun size={22} /> : <Moon size={22} />}
              </motion.button>
            )}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              style={{ background: "none", border: "none", color: "var(--fg)", cursor: "pointer", display: "flex" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mobileMenuOpen ? "close" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex" }}
                >
                  {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "var(--bg)",
              zIndex: 99,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.name}
                href={`#${link.id}`}
                onClick={(e) => handleNavClick(e, link.id)}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  padding: "0.75rem 2rem",
                  color: activeSection === link.id ? "var(--cyan)" : "var(--fg)",
                  transition: "color 0.3s ease",
                  position: "relative",
                  textDecoration: "none",
                }}
                whileHover={{ x: 10, color: "var(--cyan)" }}
              >
                <span style={{
                  position: "absolute",
                  left: "0",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.7rem",
                  color: "var(--fg-dim)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                }}>
                  0{i + 1}
                </span>
                {link.name}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
