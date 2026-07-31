"use client";

import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from "@emailjs/browser";
import Image from "next/image";
import { Send, CheckCircle, AlertCircle, Mail, MessageSquare, User, LucideIcon, ShieldCheck, RefreshCw } from "lucide-react";

const EMAILJS = {
  SERVICE_ID: "service_em7z8t4",
  TEMPLATE_ID: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_xnc97ns",
  PUBLIC_KEY: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "eeZHKjTMxrFyznOzR",
};

type Status = "idle" | "loading" | "success" | "error";

/* ── Floating Label Input ── */
function FloatingField({
  icon: Icon, label, type = "text", name, multiline = false,
}: {
  icon: LucideIcon; label: string; type?: string;
  name: string; multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isActive = focused || hasValue;

  const baseInput: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--fg)",
    fontFamily: "inherit",
    fontSize: "1rem",
    padding: "1.4rem 1rem 0.6rem 3rem",
    resize: multiline ? "vertical" : "none",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setHasValue(e.target.value.length > 0);
  };

  return (
    <div style={{ position: "relative" }}>
      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ y: -2 }}
        style={{
          position: "relative",
          borderRadius: "var(--radius-sm)",
          border: `1px solid ${focused || hovered ? "var(--cyan)" : "rgba(10, 132, 255, 0.14)"}`,
          background: "var(--bg-elevated)",
          backdropFilter: "blur(12px)",
          boxShadow: focused ? "0 0 20px var(--cyan-glow)" : hovered ? "0 10px 30px rgba(15, 23, 42, 0.08)" : "0 8px 24px rgba(15, 23, 42, 0.04)",
          transition: "var(--transition)",
        }}
      >
        <Icon
          size={16}
          style={{
            position: "absolute",
            left: "1rem",
            top: multiline ? "1.2rem" : "50%",
            transform: multiline ? "none" : "translateY(-50%)",
            color: focused || hovered ? "var(--cyan)" : "var(--fg-dim)",
            transition: "var(--transition)",
          }}
        />

        {/* Floating Label */}
        <label
          style={{
            position: "absolute",
            left: "3rem",
            top: isActive ? "0.35rem" : multiline ? "1.2rem" : "50%",
            transform: isActive ? "none" : multiline ? "none" : "translateY(-50%)",
            fontSize: isActive ? "0.7rem" : "0.95rem",
            color: focused || hovered ? "var(--cyan)" : "var(--fg-dim)",
            letterSpacing: isActive ? "1.5px" : "0",
            textTransform: isActive ? "uppercase" : "none",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: "none",
            fontWeight: isActive ? 600 : 400,
          }}
        >
          {label}
        </label>

        {multiline ? (
          <textarea
            name={name}
            rows={5}
            required
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={handleChange}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ ...baseInput, minHeight: 130, paddingTop: "1.6rem" }}
          />
        ) : (
          <input
            type={type}
            name={name}
            required
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={handleChange}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={baseInput}
          />
        )}
      </motion.div>
    </div>
  );
}

export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [startedAt] = useState(() => Date.now());
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaMessage, setCaptchaMessage] = useState("");
  const [captchaSeed, setCaptchaSeed] = useState(0);

  const captcha = useMemo(() => {
    const first = 3 + ((captchaSeed * 7 + 2) % 8);
    const second = 2 + ((captchaSeed * 5 + 4) % 7);

    return {
      label: `${first} + ${second}`,
      answer: first + second,
    };
  }, [captchaSeed]);

  const resetCaptcha = () => {
    setCaptchaAnswer("");
    setCaptchaMessage("");
    setCaptchaSeed((current) => current + 1);
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = formRef.current;
    const formData = form ? new FormData(form) : null;
    const trapValue = String(formData?.get("website") || "").trim();
    const elapsedMs = Date.now() - startedAt;

    if (trapValue.length > 0 || elapsedMs < 3500) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
      return;
    }

    if (Number(captchaAnswer.trim()) !== captcha.answer) {
      setCaptchaMessage("Security answer is incorrect. Please try again.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
      return;
    }

    setStatus("loading");

    // If EmailJS keys are default placeholders, simulate submission gracefully
    if (EMAILJS.SERVICE_ID === "YOUR_SERVICE_ID") {
      setTimeout(() => {
        setStatus("success");
        formRef.current?.reset();
        setTimeout(() => setStatus("idle"), 5000);
      }, 1000);
      return;
    }

    try {
      await emailjs.sendForm(
        EMAILJS.SERVICE_ID,
        EMAILJS.TEMPLATE_ID,
        formRef.current!,
        EMAILJS.PUBLIC_KEY,
      );
      setStatus("success");
      formRef.current?.reset();
      resetCaptcha();
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <section id="contact" className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        {/* Header */}
        <motion.div
          className="section-heading"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: "center", marginBottom: "3rem" }}
        >
          <motion.div
            className="section-tag"
            style={{ justifyContent: "center" }}
            whileHover={{ y: -2, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            Contact
          </motion.div>
          <h2>
            Let&apos;s Build <span className="text-gradient">Something</span>
          </h2>
          <p style={{ marginTop: "0.75rem", maxWidth: 500, margin: "0.75rem auto 0" }}>
            Have a project in mind or just want to say hi? I&apos;d love to hear from you.
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card"
          style={{
            padding: "clamp(2rem, 5vw, 3rem)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative glow orbs */}
          <div
            style={{
              position: "absolute", top: -100, right: -100,
              width: 300, height: 300, borderRadius: "50%",
              background: "var(--cyan-glow)", filter: "blur(100px)",
              pointerEvents: "none", opacity: 0.5,
            }}
          />
          <div
            style={{
              position: "absolute", bottom: -80, left: -80,
              width: 250, height: 250, borderRadius: "50%",
              background: "var(--purple-glow)", filter: "blur(100px)",
              pointerEvents: "none", opacity: 0.3,
            }}
          />

          <form
            ref={formRef}
            onSubmit={sendEmail}
            autoComplete="on"
            style={{
              display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <FloatingField icon={User} label="Your Name" name="user_name" />
              <FloatingField icon={Mail} label="Your Email" name="user_email" type="email" />
            </div>
            <FloatingField icon={MessageSquare} label="Message" name="message" multiline />

            <motion.div
              className="contact-security"
              whileHover={{ y: -2 }}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(120px, 160px)",
                gap: "1rem",
                alignItems: "center",
                padding: "1rem 1rem 1rem 1.1rem",
                border: "1px solid rgba(10, 132, 255, 0.22)",
                borderRadius: "18px",
                background: "linear-gradient(135deg, rgba(10, 132, 255, 0.12), rgba(94, 92, 230, 0.08))",
                backdropFilter: "blur(14px) saturate(1.1)",
                boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(10, 132, 255, 0.12)",
                      color: "var(--cyan)",
                    }}
                  >
                    <ShieldCheck size={16} />
                  </span>
                  <p style={{ margin: 0, color: "var(--fg)", fontWeight: 800, fontSize: "0.96rem" }}>
                    Security check
                  </p>
                </div>

                <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--fg-dim)" }}>
                  What is {captcha.label}?
                </p>
                {captchaMessage && (
                  <p style={{ margin: "0.45rem 0 0", color: "var(--pink)", fontSize: "0.78rem", fontWeight: 600 }}>
                    {captchaMessage}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "0.45rem",
                }}
              >
                <input
                  type="number"
                  inputMode="numeric"
                  value={captchaAnswer}
                  onChange={(event) => {
                    setCaptchaAnswer(event.target.value);
                    setCaptchaMessage("");
                  }}
                  aria-label="Security answer"
                  required
                  placeholder="Answer"
                  style={{
                    width: "100%",
                    minHeight: 48,
                    border: "1px solid rgba(10, 132, 255, 0.24)",
                    borderRadius: "14px",
                    background: "var(--bg-elevated)",
                    color: "var(--fg)",
                    padding: "0 0.95rem",
                    font: "inherit",
                    fontWeight: 800,
                    outline: "none",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                  }}
                />

                <motion.button
                  type="button"
                  onClick={resetCaptcha}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                    minHeight: 44,
                    padding: "0 0.8rem",
                    border: "1px solid rgba(10, 132, 255, 0.18)",
                    borderRadius: "999px",
                    background: "var(--bg-elevated)",
                    color: "var(--cyan)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  <RefreshCw size={13} />
                  New challenge
                </motion.button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={status === "loading"}
              whileHover={{ scale: status === "loading" ? 1 : 1.04, y: status === "loading" ? 0 : -2 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary"
              style={{
                alignSelf: "flex-end",
                minWidth: 180,
                opacity: status === "loading" ? 0.7 : 1,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <AnimatePresence mode="wait">
                {status === "loading" ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ display: "flex" }}
                    >
                      <Send size={16} />
                    </motion.span>
                    Sending…
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    Send Message <Send size={16} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Status Messages */}
            <AnimatePresence>
              {status === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    color: "var(--cyan)", fontWeight: 600, padding: "0.75rem 1rem",
                    background: "rgba(10, 132, 255, 0.08)", borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(10, 132, 255, 0.2)",
                  }}
                >
                  <CheckCircle size={18} /> Message sent! I&apos;ll get back to you soon.
                </motion.div>
              )}
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    color: "var(--pink)", fontWeight: 600, padding: "0.75rem 1rem",
                    background: "rgba(213, 63, 140, 0.08)", borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(213, 63, 140, 0.2)",
                  }}
                >
                  <AlertCircle size={18} /> Failed to send. Please try again later.
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="glass-card contact-line-card"
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "1rem",
              alignItems: "center",
              background: "var(--bg-elevated)",
              border: "1px solid rgba(10, 132, 255, 0.16)",
              boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
            }}
          >
            <motion.div
              whileHover={{ scale: 1.02, rotate: -0.5 }}
              className="contact-line-card__qr"
              style={{
                width: 132,
                height: 132,
                padding: 8,
                borderRadius: "20px",
                background: "rgba(255,255,255,0.92)",
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
                flexShrink: 0,
              }}
            >
              <Image
                src="/line-qr.jpg"
                alt="LINE QR code"
                width={116}
                height={116}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: "14px",
                }}
              />
            </motion.div>

            <div className="contact-line-card__body" style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  color: "var(--fg)",
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                Add me on LINE
              </p>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
                สแกน QR เพื่อคุยงานได้เร็วขึ้น หรือส่งลิงก์ LINE มาให้เลยถ้าจะให้ผมใส่ปุ่มตรง ๆ
              </p>
            </div>
          </motion.div>

          <div className="contact-social-links" aria-label="ช่องทางติดต่ออื่น">
            <a href="https://github.com/ertyu007" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://line.me/ti/p/@ertyuxm0p" target="_blank" rel="noreferrer">LINE @ertyuxm0p</a>
            <a href="https://www.facebook.com/share/18wptJW2p1/" target="_blank" rel="noreferrer">Facebook</a>
            <a href="https://youtube.com/@amazingwuji?si=oEBHetf2kvo0GWCm" target="_blank" rel="noreferrer">YouTube</a>
            <a href="https://www.tiktok.com/@ertyu0075?_r=1&amp;_t=ZS-98QbaWz95vg" target="_blank" rel="noreferrer">TikTok @ertyu0075</a>
          </div>
          <div className="contact-availability">
            <strong>รับงานแบบ WFH / พื้นที่ใกล้อำนาจเจริญ</strong>
            <span>ติดต่อสะดวก: 05:00–07:00 น., ช่วงเที่ยง และช่วงเย็น</span>
            <span>จันทร์–ศุกร์ทำงานหลัง 20:00 น. · เสาร์–อาทิตย์ยืดหยุ่นประมาณ 8 ชั่วโมง</span>
            <span>อีเมล: <a href="mailto:ertyualexs04@gmail.com">ertyualexs04@gmail.com</a> · โทร: <a href="tel:0800163734">080-016-3734</a></span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
