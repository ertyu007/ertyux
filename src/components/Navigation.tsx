"use client";
import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { Box, LoaderCircle, Menu, X, Sun, Moon } from "lucide-react";
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
type Mobile3DStatus = "idle" | "loading" | "error" | "active";

/** Scroll smoothly to a section by id */
function scrollToSection(id: string) {
  if (id === "home") {
    // Jump directly across the pinned GSAP section. Smooth-scrolling from the
    // bottom can leave ScrollTrigger between states while it crosses the pin.
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

export default function Navigation() {
  const pathname  = usePathname();
  const [scrolled, setScrolled]           = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [mobile3DStatus, setMobile3DStatus] =
    useState<Mobile3DStatus>("idle");
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
    if (latest < window.innerHeight * 0.72) {
      setActiveSection("home");
    }
  });

  /* ── Active-section observer ── */
  useEffect(() => {
    if (isAdminPage) return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Keep Home active while the pinned hero still fills the viewport.
        if (window.scrollY < window.innerHeight * 0.72) {
          setActiveSection("home");
          return;
        }

        // Pick the entry closest to the top of viewport that is intersecting
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((prev, curr) =>
          prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
        );
        setActiveSection(top.target.id);
      },
      { rootMargin: "-14% 0px -58% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isAdminPage]);

  /* ── Close mobile menu on outside click / Escape ── */
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handle3DStatus = (event: Event) => {
      const status = (event as CustomEvent<Mobile3DStatus>).detail;
      if (["idle", "loading", "error", "active"].includes(status)) {
        setMobile3DStatus(status);
      }
    };

    window.addEventListener("portfolio:3d-status", handle3DStatus);
    return () => {
      window.removeEventListener("portfolio:3d-status", handle3DStatus);
    };
  }, []);

  /* ── Handlers ── */
  const handleNavClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      setMobileMenuOpen(false);
      setActiveSection(id);
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
          top: "0.75rem",
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 0.75rem",
          pointerEvents: "none",
        }}
      >
        <div
          className="container site-nav__bar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            paddingTop: 0,
            paddingBottom: 0,
            minHeight: 68,
            borderRadius: "24px",
            background: isDark
              ? scrolled
                ? "rgba(15, 18, 26, 0.9)"
                : "rgba(20, 23, 31, 0.86)"
              : scrolled
                ? "rgba(255, 255, 255, 0.9)"
                : "rgba(255, 255, 255, 0.86)",
            backdropFilter: "blur(20px) saturate(1.3)",
            WebkitBackdropFilter: "blur(20px) saturate(1.3)",
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.12)"
              : "1px solid rgba(255, 255, 255, 0.72)",
            boxShadow: scrolled
              ? "0 16px 40px rgba(15, 23, 42, 0.12)"
              : "0 12px 30px rgba(15, 23, 42, 0.08)",
            pointerEvents: "auto",
            overflow: "hidden",
            transition: "background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease",
          }}
        >

          {/* Logo */}
          <motion.a
            href="/"
            onClick={(e) => handleNavClick(e, "home")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-gradient site-nav__logo"
            style={{
              fontWeight: 900,
              fontSize: "1.5rem",
              letterSpacing: "2px",
              position: "relative",
              textDecoration: "none",
            }}
          >
            PORTFOLIO.
          </motion.a>

          {/* Desktop Nav */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                gap: "0.25rem",
                background: isDark
                  ? "rgba(255, 255, 255, 0.045)"
                  : "rgba(15, 23, 42, 0.035)",
                borderRadius: "var(--radius-full)",
                padding: "0.3rem",
                border: `1px solid ${
                  isDark
                    ? "rgba(255, 255, 255, 0.09)"
                    : "rgba(15, 23, 42, 0.08)"
                }`,
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
                      color: isActive
                        ? "var(--cyan)"
                        : isDark
                          ? "#c6cfdd"
                          : "#536078",
                      transition: "color 0.3s ease",
                      zIndex: 1,
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--cyan)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isActive
                        ? "var(--cyan)"
                        : isDark
                          ? "#c6cfdd"
                          : "#536078";
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
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
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
                type="button"
                onClick={() => {
                  setMobile3DStatus("loading");
                  window.dispatchEvent(new Event("portfolio:enable-3d"));
                }}
                aria-label={
                  mobile3DStatus === "loading"
                    ? "กำลังเปิดโหมด 3D"
                    : mobile3DStatus === "active"
                      ? "เปิดโหมด 3D แล้ว"
                      : mobile3DStatus === "error"
                        ? "โหลดโหมด 3D ไม่สำเร็จ กดเพื่อลองใหม่"
                        : "เปิดโหมด 3D"
                }
                title={
                  mobile3DStatus === "error"
                    ? "ลองเปิด 3D อีกครั้ง"
                    : "เปิดโหมด 3D"
                }
                disabled={
                  mobile3DStatus === "loading" ||
                  mobile3DStatus === "active"
                }
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                style={{
                  background: "var(--bg-elevated)",
                  border: `1px solid ${
                    mobile3DStatus === "error"
                      ? "var(--pink)"
                      : mobile3DStatus === "active"
                        ? "var(--cyan)"
                        : "var(--glass-border)"
                  }`,
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  color:
                    mobile3DStatus === "error"
                      ? "var(--pink)"
                      : "var(--cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    mobile3DStatus === "loading"
                      ? "wait"
                      : mobile3DStatus === "active"
                        ? "default"
                        : "pointer",
                  opacity: mobile3DStatus === "loading" ? 0.72 : 1,
                }}
              >
                {mobile3DStatus === "loading" ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ display: "flex" }}
                  >
                    <LoaderCircle size={21} aria-hidden="true" />
                  </motion.span>
                ) : (
                  <Box size={21} aria-hidden="true" />
                )}
              </motion.button>
            )}
            {mounted && (
              <motion.button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  color: "var(--cyan)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--glass-border)",
                borderRadius: "50%",
                width: 44,
                height: 44,
                color: "var(--fg)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            style={{
              position: "fixed",
              inset: 0,
              width: "100dvw",
              maxWidth: "100%",
              background: "var(--bg)",
              zIndex: 220,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              padding: "5rem 1.25rem 2rem",
              overflow: "hidden",
            }}
          >
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: "absolute",
                top: "max(1rem, env(safe-area-inset-top))",
                right: "1rem",
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                border: "1px solid var(--glass-border)",
                borderRadius: "50%",
                background: "var(--bg-2)",
                color: "var(--fg)",
              }}
            >
              <X size={22} />
            </motion.button>

              {navLinks.map((link, i) => (
              <motion.a
                key={link.name}
                href={`#${link.id}`}
                onClick={(e) => handleNavClick(e, link.id)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.025, duration: 0.12 }}
                style={{
                  width: "min(100%, 340px)",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "clamp(1.65rem, 8vw, 2.35rem)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  padding: "0.8rem 1rem 0.8rem 3.2rem",
                  borderRadius: "14px",
                  background: activeSection === link.id ? "var(--cyan-subtle)" : "transparent",
                  color: activeSection === link.id ? "var(--cyan)" : "var(--fg)",
                  transition: "color 0.3s ease",
                  position: "relative",
                  textDecoration: "none",
                }}
                whileTap={{ opacity: 0.7 }}
              >
                <span style={{
                  position: "absolute",
                  left: "1rem",
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
