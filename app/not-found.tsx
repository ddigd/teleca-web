import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#111827",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
      backgroundImage: "linear-gradient(to right,rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.04) 1px,transparent 1px)",
      backgroundSize: "4rem 4rem",
    }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{
          fontSize: "clamp(80px,15vw,160px)",
          fontWeight: 900,
          color: "#FFFFFF",
          lineHeight: 1,
          letterSpacing: "-.03em",
        }}>404</div>
        <div style={{
          fontSize: "clamp(14px,2.5vw,20px)",
          color: "#9CA3AF",
          marginTop: 16,
          marginBottom: 40,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".1em",
        }}>Page Not Found</div>
        <Link href="/" style={{
          display: "inline-block",
          padding: "14px 32px",
          background: "transparent",
          color: "#FFFFFF",
          border: "2px solid #FFFFFF",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          textDecoration: "none",
          cursor: "pointer",
          transition: "all .25s",
        }}>
          ← BACK TO HOME
        </Link>
      </div>
    </div>
  );
}
