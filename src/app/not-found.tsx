import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        background: "#0a0b0f",
        color: "#e4e5e9",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(6rem, 15vw, 12rem)",
          fontWeight: 900,
          letterSpacing: "-0.06em",
          lineHeight: 1,
          margin: 0,
          background: "linear-gradient(135deg, #00eaff 0%, #7b61ff 50%, #d53f8c 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        404
      </h1>

      <p
        style={{
          fontSize: "1.15rem",
          color: "#9ca3af",
          maxWidth: 420,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/"
        style={{
          marginTop: "0.5rem",
          padding: "0.85rem 2rem",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #00eaff, #7b61ff)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.9rem",
          textDecoration: "none",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
      >
        Back to Home
      </Link>
    </main>
  );
}
