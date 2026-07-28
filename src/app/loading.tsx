export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0b0f",
        zIndex: 99999,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "3px solid rgba(0, 234, 255, 0.15)",
          borderTopColor: "#00eaff",
          animation: "portfolio-spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes portfolio-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
