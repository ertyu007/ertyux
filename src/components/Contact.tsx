"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from "@emailjs/browser";
import { Send, CheckCircle, AlertCircle, Mail, MessageSquare, User, LucideIcon } from "lucide-react";

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
      <div
        style={{
          position: "relative",
          borderRadius: "var(--radius-sm)",
          border: `1px solid ${focused ? "var(--cyan)" : "var(--glass-border)"}`,
          background: "var(--glass-bg)",
          backdropFilter: "blur(8px)",
          boxShadow: focused ? "0 0 20px var(--cyan-glow)" : "none",
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
            color: focused ? "var(--cyan)" : "var(--fg-dim)",
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
            color: focused ? "var(--cyan)" : "var(--fg-dim)",
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
            style={baseInput}
          />
        )}
      </div>
    </div>
  );
}

export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: "center", marginBottom: "3rem" }}
        >
          <div className="section-tag" style={{ justifyContent: "center" }}>Contact</div>
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
            style={{
              display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.5rem",
              }}
            >
              <FloatingField icon={User} label="Your Name" name="user_name" />
              <FloatingField icon={Mail} label="Your Email" name="user_email" type="email" />
            </div>
            <FloatingField icon={MessageSquare} label="Message" name="message" multiline />

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={status === "loading"}
              whileHover={{ scale: status === "loading" ? 1 : 1.02 }}
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
                    color: "#4ade80", fontWeight: 600, padding: "0.75rem 1rem",
                    background: "rgba(74, 222, 128, 0.08)", borderRadius: "var(--radius-sm)",
                    border: "1px solid rgba(74, 222, 128, 0.2)",
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
        </motion.div>
      </div>
    </section>
  );
}
