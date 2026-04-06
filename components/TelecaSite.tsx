"use client";
import { submitContactInquiry, submitOrderInquiry } from "@/lib/supabase";
import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  Settings, Plus, Trash2, Upload, Download, Edit2, LayoutGrid, Zap, Crown,
  Target, CheckSquare, Info, ShoppingCart, X, Save, FileSpreadsheet, Package,
  Image as ImageIcon, Menu, ArrowLeft, Lock, LogOut, Shield, BarChart3,
  Check, Home, Bell, Send, CalendarCheck, ClipboardList, ChevronLeft, ChevronRight
} from "lucide-react";

/* ═══════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════ */
const C = {
  black: "#000000", white: "#FFFFFF", blue: "#2563EB", blueDark: "#1D4ED8",
  red: "#DC2626", pageBg: "#FFFFFF", cardBg: "#FFFFFF", textPrimary: "#000000",
  textSecondary: "#374151", textMuted: "#6B7280", textLight: "#9CA3AF",
  textOnDark: "#D1D5DB", gray800: "#111111", gray100: "#F3F4F6", gray200: "#E5E7EB",
  green: "#059669", miim: "#9B7BCC",
};
const F = { ui: "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif" };
const gridBg = "linear-gradient(to right,rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.04) 1px,transparent 1px)";
const gridBgLight = "linear-gradient(to right,rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.1) 1px,transparent 1px)";
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
const ADMIN_PW = "break111213!"; // TODO: move to env var

/* Premium smooth scroll — disable snap during animation */
function smoothScroll(el, distance) {
  const start = el.scrollLeft;
  const duration = 600;
  let startTime = null;
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  // Disable snap during animation
  el.style.scrollSnapType = "none";
  const step = (time) => {
    if (!startTime) startTime = time;
    const progress = Math.min((time - startTime) / duration, 1);
    el.scrollLeft = start + distance * ease(progress);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Re-enable snap after animation completes
      el.style.scrollSnapType = "x mandatory";
    }
  };
  requestAnimationFrame(step);
}
const LOGO_SRC = "/logo-white.png";

/* ═══════════════════════════════════════
   XLSX PARSER
   ═══════════════════════════════════════ */
let SheetJS = null;
try { SheetJS = require("xlsx"); } catch (e) {}

function parseXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (SheetJS) {
          const wb = SheetJS.read(e.target.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = SheetJS.utils.sheet_to_json(ws, { defval: "" });
          resolve(data.map(row => { const k = Object.keys(row); return { number: String(row[k[0]] || ""), name: String(row[k[1]] || ""), rarity: String(row[k[2]] || "Common") }; }));
        } else {
          const text = new TextDecoder().decode(e.target.result);
          const lines = text.split("\n").filter(l => l.trim());
          resolve(lines.slice(1).map(line => { const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, "")); return { number: cols[0] || "", name: cols[1] || "", rarity: cols[2] || "Common" }; }));
        }
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/* ═══════════════════════════════════════
   DEFAULT DATA
   ═══════════════════════════════════════ */
// Collections loaded from Supabase


/* ═══════════════════════════════════════
   HOOKS & CONTEXT
   ═══════════════════════════════════════ */
function useR() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return { mob: w < 768, tab: w >= 768 && w < 1024, cols: w < 768 ? 1 : w < 1024 ? 2 : 4 };
}
const Ctx = createContext(null);

function useToast() {
  const [t, setT] = useState({ visible: false, message: "" });
  const show = (msg) => { setT({ visible: true, message: msg }); setTimeout(() => setT(p => ({ ...p, visible: false })), 2500); };
  return { toast: t, showToast: show };
}

function Toast({ message, visible }) {
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: C.black, color: C.white, padding: "14px 24px", border: `2px solid ${C.green}`, boxShadow: "8px 8px 0 0 rgba(0,0,0,1)", display: "flex", alignItems: "center", gap: 10, transform: visible ? "translateX(0)" : "translateX(calc(100% + 60px))", opacity: visible ? 1 : 0, transition: "all .35s cubic-bezier(.4,0,.2,1)", pointerEvents: "none", maxWidth: 380, fontSize: 14, fontWeight: 700 }}>
      <div style={{ width: 24, height: 24, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={14} style={{ color: C.white }} /></div>
      {message}
    </div>
  );
}

/* ═══════════════════════════════════════
   ★ AutoImg — contain + padding + drop-shadow
   ═══════════════════════════════════════ */
function AutoImg({ src, style: sx, padding = "8px", noShadow }) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Determine background: use sx.background if provided, else default dark gradient
  const defaultBg = "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f1626 100%)";
  const bg = sx?.background || defaultBg;

  return (
    <div ref={ref} style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", ...sx, background: bg }}>
      {inView && src && (
        <img src={src} alt="" loading="lazy" onLoad={() => setLoaded(true)}
          style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain", padding, boxSizing: "border-box", opacity: loaded ? 1 : 0, transition: "opacity .4s", filter: noShadow ? "none" : "drop-shadow(0 4px 12px rgba(0,0,0,0.5))", imageRendering: "auto", WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", transform: "translateZ(0)" }} />
      )}
      {(!loaded || !src) && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", opacity: .3 }}>
            <svg width={52} height={52} viewBox="0 0 48 48" fill="none"><rect x="8" y="4" width="32" height="40" rx="2" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" /><path d="M18 16L24 12L30 16V28L24 32L18 28Z" stroke="rgba(255,255,255,.4)" strokeWidth="1.2" fill="none" /><circle cx="24" cy="22" r="4" stroke="rgba(255,255,255,.4)" strokeWidth="1.2" /></svg>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", fontWeight: 700, letterSpacing: 3, marginTop: 6 }}>IMAGE</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   ★★ ChasingCardItem — 3D tilt + holographic shimmer
   ═══════════════════════════════════════ */
function ChasingCardItem({ cc, index }) {
  const elRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [appeared, setAppeared] = useState(false); // entrance done → clear delay
  const [hov, setHov] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // After entrance animation completes, clear the delay so hover is instant
  useEffect(() => {
    if (inView && !appeared) {
      const t = setTimeout(() => setAppeared(true), index * 100 + 600);
      return () => clearTimeout(t);
    }
  }, [inView, appeared, index]);

  // Direct mouse tracking — no RAF, immediate response
  const onMove = (e) => {
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const accent = cc.tagColor || "#7C3AED";
  const tiltX = hov ? (pos.y - 50) * -0.12 : 0;
  const tiltY = hov ? (pos.x - 50) * 0.12 : 0;

  const cardTransform = inView
    ? `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
    : "perspective(800px) rotateX(15deg) scale(0.97)";

  return (
    <div
      ref={elRef}
      onMouseMove={onMove}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPos({ x: 50, y: 50 }); }}
      onTouchStart={() => setHov(true)}
      onTouchEnd={() => { setHov(false); setPos({ x: 50, y: 50 }); }}
      style={{
        cursor: "pointer",
        transformOrigin: "center center",
        willChange: "transform",
        transition: `transform ${appeared ? ".15s" : ".4s"} cubic-bezier(.23,1,.32,1), box-shadow .3s ease, opacity .5s ease`,
        transform: cardTransform,
        opacity: inView ? 1 : 0,
        transitionDelay: appeared ? "0s" : `${index * 0.1}s`,
        boxShadow: hov
          ? `0 8px 20px rgba(0,0,0,0.1), 0 0 12px ${accent}15`
          : "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ border: `2px solid ${C.black}`, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Image Area — Premium Display Case ── */}
      <div style={{
        position: "relative",
        background: "linear-gradient(160deg, #0a0a12 0%, #12121f 40%, #0e0e1a 100%)",
        borderBottom: `2px solid ${C.black}`,
        flexShrink: 0,
      }}>
        {/* Subtle carbon fiber texture */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.015) 1px, rgba(255,255,255,0.015) 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.015) 1px, rgba(255,255,255,0.015) 2px)",
          backgroundSize: "4px 4px",
        }} />

        {/* Center bright glow — card illumination */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.08) 0%, ${accent}08 25%, transparent 55%)`,
          opacity: hov ? 0.8 : 0.3,
          transition: "opacity .4s ease",
        }} />

        {/* Soft vignette — lighter than before */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.25) 100%)",
        }} />

        <div style={{ paddingTop: "120%" }} />
        <AutoImg src={cc.image} padding="6px" style={{ position: "absolute", inset: 0, background: "transparent" }} noShadow />

        {/* Inner frame line */}
        <div style={{
          position: "absolute", inset: 6, zIndex: 2, pointerEvents: "none",
          border: "1px solid rgba(255,255,255,0.06)",
        }} />

        {/* Holo L1: Ambient shimmer (always) */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
          background: `linear-gradient(105deg, transparent 20%, ${accent}0A 30%, rgba(255,255,255,0.15) 38%, ${accent}0D 42%, transparent 50%, rgba(255,255,255,0.1) 58%, ${accent}0A 65%, transparent 80%)`,
          backgroundSize: "250% 100%",
          animation: "holoShimmer 4s ease-in-out infinite",
          mixBlendMode: "screen",
          opacity: hov ? 0.9 : 0,
          transition: "opacity .5s ease",
        }} />

        {/* Holo L2: Rainbow prism */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
          background: `linear-gradient(${125 + (pos.x - 50) * 0.6}deg, transparent 15%, rgba(255,80,80,0.08) 25%, rgba(255,210,60,0.1) 35%, rgba(60,255,120,0.08) 45%, rgba(60,160,255,0.1) 55%, rgba(160,60,255,0.08) 65%, transparent 80%)`,
          mixBlendMode: "screen",
          opacity: hov ? 0.85 : 0,
          transition: "opacity .5s ease",
        }} />

        {/* Holo L3: Foil noise texture */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
          backgroundImage: NOISE_SVG,
          backgroundSize: "200px 200px",
          mixBlendMode: "overlay",
          opacity: hov ? 0.3 : 0,
          transition: "opacity .4s ease",
        }} />

        {/* Holo L4: Glare edge */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
          background: `linear-gradient(${100 + (pos.x - 50) * 0.8}deg, transparent 38%, rgba(255,255,255,0.3) 48%, rgba(255,255,255,0.08) 52%, transparent 62%)`,
          opacity: hov ? 1 : 0,
          transition: "opacity .35s ease",
        }} />
      </div>

      {/* ── Info ── */}
      <div style={{ padding: "10px 12px", background: C.white, position: "relative", zIndex: 5, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, minHeight: 13 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", letterSpacing: ".06em", textTransform: "uppercase", background: accent, color: C.white, flexShrink: 0 }}>{cc.tag}</span>
          <span style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cc.name}</span>
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6, minHeight: 35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{cc.desc}</div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", padding: "8px 12px",
        borderTop: `2px solid ${C.black}`, background: C.white, position: "relative", zIndex: 5,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>{cc.ratio}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>{cc.code}</span>
      </div>
      </div>{/* end inner clip */}
    </div>
  );
}

/* ═══════════════════════════════════════
   CHASING CAROUSEL — 3 visible, arrows, peek
   ═══════════════════════════════════════ */
function ChasingCarousel({ cards }) {
  const scrollRef = useRef(null);
  const { mob } = useR();
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  const gap = mob ? 16 : 24;
  const cols = 3;
  const peek = 20;

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const t = setTimeout(checkScroll, 200);
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => { clearTimeout(t); el.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, [cards]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardW = el.querySelector("[data-cc]")?.offsetWidth || 300;
    smoothScroll(el, dir * (cardW + gap));
  };

  const cardFlex = mob
    ? "0 0 56%"
    : `0 0 calc((100% - ${(cols - 1) * gap}px) / ${cols} - ${peek}px)`;

  return (
    <div style={{ position: "relative" }}>
      {canL && (
        <button onClick={() => scroll(-1)} style={{
          position: "absolute", left: mob ? 4 : -20, top: "50%", transform: "translateY(-50%)", zIndex: 10,
          width: 40, height: 40, background: C.white, border: `2px solid ${C.black}`,
          boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><ChevronLeft size={20} /></button>
      )}
      {canR && (
        <button onClick={() => scroll(1)} style={{
          position: "absolute", right: mob ? 4 : -20, top: "50%", transform: "translateY(-50%)", zIndex: 10,
          width: 40, height: 40, background: C.white, border: `2px solid ${C.black}`,
          boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><ChevronRight size={20} /></button>
      )}
      {canR && (
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 48, zIndex: 5,
          background: `linear-gradient(to left, ${C.pageBg} 0%, transparent 100%)`,
          pointerEvents: "none",
        }} />
      )}

      <div ref={scrollRef} style={{
          display: "flex", gap,
          overflowX: "auto", overflowY: "visible",
          alignItems: "stretch",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none", msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          padding: "16px 0 24px",
          margin: "-16px 0 -24px",
        }}>
          {cards.map((cc, i) => (
            <div key={i} data-cc style={{
              flex: cardFlex, scrollSnapAlign: "start", minWidth: 0,
            }}>
              <ChasingCardItem cc={cc} index={i} />
            </div>
          ))}
        </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   UI PRIMITIVES
   ═══════════════════════════════════════ */
function Btn({ children, onClick, v = "outline", size = "md", style: sx, disabled }) {
  const [h, setH] = useState(false);
  const base = { fontFamily: F.ui, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", cursor: disabled ? "default" : "pointer", border: `2px solid ${C.black}`, transition: "all .25s", display: "inline-flex", alignItems: "center", gap: 6, opacity: disabled ? .4 : 1, whiteSpace: "nowrap" };
  const szMap = { sm: { fontSize: 11, padding: "6px 12px" }, md: { fontSize: 13, padding: "10px 20px" }, lg: { fontSize: 15, padding: "14px 32px" } };
  const vaMap = {
    outline: { background: h ? C.black : "transparent", color: h ? C.white : C.textPrimary, boxShadow: h ? "4px 4px 0 0 rgba(0,0,0,1)" : "none" },
    filled: { background: h ? C.gray800 : C.black, color: C.white },
    blue: { background: h ? C.blueDark : C.blue, color: C.white, border: `2px solid ${h ? C.blueDark : C.blue}` },
    ghost: { background: h ? C.gray100 : "transparent", border: "2px solid transparent", color: C.textPrimary },
    whiteO: { background: h ? C.white : "transparent", color: h ? C.black : C.white, border: `2px solid ${C.white}`, boxShadow: h ? "4px 4px 0 0 rgba(255,255,255,.4)" : "none" },
  };
  return <button style={{ ...base, ...szMap[size], ...vaMap[v], ...sx }} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={!disabled ? onClick : undefined}>{children}</button>;
}

function Input({ label, value, onChange, type = "text", placeholder, style: sx, textarea, rows = 4 }) {
  const shared = { width: "100%", padding: "10px 14px", border: `2px solid ${C.black}`, fontSize: 14, fontFamily: F.ui, background: C.pageBg, outline: "none", boxSizing: "border-box", transition: "border-color .3s" };
  return (
    <div style={{ marginBottom: 16, ...sx }}>
      {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>}
      {textarea ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...shared, resize: "vertical" }} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.black} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={shared} onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.black} />}
    </div>
  );
}

function Sel({ label, value, onChange, options }) {
  return (<div style={{ marginBottom: 16 }}>{label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>}<select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: `2px solid ${C.black}`, fontSize: 14, fontFamily: F.ui, background: C.pageBg, outline: "none", cursor: "pointer" }}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>);
}

function ImgUp({ label, value, onChange, h = 160 }) {
  const ref = useRef(null);
  const handle = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = e.target.result;
      // If file is under 2MB, keep original quality — no re-encoding
      if (file.size < 2 * 1024 * 1024) {
        onChange(raw);
        return;
      }
      // Only resize if truly oversized
      const img = new window.Image();
      img.onload = () => {
        const MAX = 2400; // Retina-ready
        let w = img.width, ht = img.height;
        if (w <= MAX && ht <= MAX) {
          // Within limits, keep original
          onChange(raw);
          return;
        }
        const r = Math.min(MAX / w, MAX / ht);
        w = Math.round(w * r);
        ht = Math.round(ht * r);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = ht;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, ht);
        // High quality: try PNG first, fallback to WebP 0.97
        const png = canvas.toDataURL("image/png");
        if (png.length < 3 * 1024 * 1024) {
          onChange(png);
        } else {
          onChange(canvas.toDataURL("image/webp", 0.97));
        }
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>}
      <div onClick={() => ref.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handle(e.dataTransfer.files[0]); }}
        style={{ height: h, border: `2px dashed ${value ? C.black : C.textLight}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: value ? "linear-gradient(145deg, #1a1a2e, #0f1626)" : C.gray100, position: "relative", overflow: "hidden" }}>
        {value && <img src={value} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 10, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.4))", imageRendering: "auto" }} />}
        {!value && <div style={{ textAlign: "center", color: C.textMuted }}><Upload size={20} /><div style={{ fontSize: 11, marginTop: 4, fontWeight: 600 }}>클릭 또는 드래그</div></div>}
        {value && <button onClick={e => { e.stopPropagation(); onChange(null); }} style={{ position: "absolute", top: 4, right: 4, background: C.red, color: C.white, border: "none", width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={12} /></button>}
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={e => handle(e.target.files[0])} />
    </div>
  );
}

/* ═══════════════════════════════════════
   NAV & FOOTER
   ═══════════════════════════════════════ */
function Nav() {
  const { page, setPage } = useContext(Ctx);
  const { mob } = useR();
  const [open, setOpen] = useState(false);
  const links = [{ key: "home", label: "HOME" }, { key: "collection", label: "COLLECTION" }, { key: "contact", label: "CONTACT" }];
  return (<nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: mob ? "0 16px" : "0 32px", height: 56, background: C.black, position: "sticky", top: 0, zIndex: 100 }}><div style={{ display: "flex", alignItems: "center", gap: mob ? 12 : 24 }}><img src={LOGO_SRC} alt="TELECA" onClick={() => setPage({ view: "home" })} style={{ height: mob ? 22 : 28, cursor: "pointer" }} />{!mob && links.map(l => <button key={l.key} onClick={() => setPage({ view: l.key })} style={{ fontFamily: F.ui, color: page.view === l.key ? C.white : C.textLight, fontSize: 13, fontWeight: 700, letterSpacing: ".06em", cursor: "pointer", textTransform: "uppercase", border: "none", background: "none", borderBottom: page.view === l.key ? "2px solid white" : "2px solid transparent", padding: "4px 0" }}>{l.label}</button>)}</div>{mob && <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: C.white, cursor: "pointer" }}><Menu size={20} /></button>}{mob && open && <div style={{ position: "absolute", top: 56, left: 0, right: 0, background: C.black, zIndex: 99 }}>{links.map(l => <button key={l.key} onClick={() => { setPage({ view: l.key }); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", color: C.white, fontSize: 14, fontWeight: 700, padding: "14px 16px", border: "none", background: page.view === l.key ? C.gray800 : "transparent", cursor: "pointer", borderBottom: `1px solid ${C.gray800}` }}>{l.label}</button>)}</div>}</nav>);
}

function Footer() {
  const { setPage, setAdminMode } = useContext(Ctx);
  const { mob } = useR();
  return (<footer style={{ background: C.white, borderTop: `2px solid ${C.black}`, padding: mob ? "32px 16px" : "48px 32px" }}><div style={{ maxWidth: 1280, margin: "0 auto" }}><div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: mob ? 24 : 32 }}>{[{ h: "PRODUCTS", l: [{ t: "TELECA COLLECTION", a: () => setPage({ view: "collection", brand: "TELECA COLLECTION CARD" }) }, { t: "MIIM CARD", a: () => setPage({ view: "collection", brand: "MIIM CARD" }) }, { t: "ALL PRODUCTS", a: () => setPage({ view: "collection" }) }] }, { h: "SUPPORT", l: [{ t: "FAQ", a: () => setPage({ view: "faq" }) }, { t: "CONTACT US", a: () => setPage({ view: "contact" }) }] }, { h: "POLICIES", l: [{ t: "PRIVACY POLICY", a: () => setPage({ view: "privacy" }) }, { t: "TERMS OF SERVICE", a: () => setPage({ view: "terms" }) }] }].map((col, i) => <div key={i}><div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", marginBottom: 12 }}>{col.h}</div>{col.l.map((lnk, j) => <button key={j} onClick={lnk.a} style={{ display: "block", fontSize: 13, color: C.textMuted, marginBottom: 8, cursor: "pointer", background: "none", border: "none", padding: 0, textAlign: "left" }}>{lnk.t}</button>)}</div>)}</div><div style={{ textAlign: "center", fontSize: 11, color: C.textMuted, marginTop: 36, paddingTop: 20, borderTop: `2px solid ${C.black}`, fontWeight: 700 }}>© 2026 <span onClick={() => setAdminMode(true)} style={{ cursor: "default", userSelect: "none" }}>BREAK&COMPANY</span>. ALL RIGHTS RESERVED.</div></div></footer>);
}

/* ═══════════════════════════════════════
   CARD ITEM
   ═══════════════════════════════════════ */
function CardItem({ item, onClick }) {
  const [hov, setHov] = useState(false);
  const isMiim = item.brand === "MIIM CARD";
  const fc = isMiim ? C.miim : C.black; // frame color
  const hc = isMiim ? C.miim : C.blue;  // hover accent
  return (
    <div style={{
      border: `2px solid ${fc}`, background: C.cardBg, cursor: "pointer",
      overflow: "hidden", height: "100%",
      display: "flex", flexDirection: "column",
      transition: "transform .3s cubic-bezier(.23,1,.32,1), box-shadow .3s ease",
      transform: hov ? "perspective(600px) rotateX(-2deg)" : "perspective(600px) rotateX(0)",
      boxShadow: hov ? `8px 8px 0 0 ${isMiim ? C.miim + "90" : "rgba(0,0,0,1)"}` : "none",
    }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}>
      {/* Image */}
      <div style={{ position: "relative", borderBottom: `2px solid ${fc}`, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ paddingTop: "75%" }} />
        <div style={{ position: "absolute", inset: 0, transition: "transform .3s", transform: hov ? "scale(1.05)" : "scale(1)" }}>
          <AutoImg src={item.thumbnail} padding="12px" style={{ position: "absolute", inset: 0 }} />
        </div>
        {item.isNew && <div style={{ position: "absolute", top: 0, left: 0, background: isMiim ? C.miim : C.red, color: C.white, fontSize: 11, fontWeight: 900, letterSpacing: ".12em", padding: "5px 10px", zIndex: 2 }}>NEW</div>}
        <div style={{ position: "absolute", top: 0, right: 0, background: isMiim ? C.miim + "E0" : "rgba(0,0,0,.85)", color: C.white, fontSize: 10, fontWeight: 700, padding: "5px 10px", textTransform: "uppercase", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", zIndex: 2 }}>{item.title}</div>
      </div>
      {/* Content */}
      <div style={{ padding: "16px 16px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 15, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.3, marginBottom: 6, transition: "color .3s", color: hov ? hc : C.textPrimary, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 39 }}>{item.title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: C.textSecondary, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 42 }}>{item.description}</div>
      </div>
      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: `2px solid ${fc}`, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.textMuted }}>{item.date}</span>
        <Btn size="sm" v={hov ? "filled" : "outline"} style={isMiim ? { borderColor: C.miim, background: hov ? C.miim : "transparent", color: hov ? C.white : C.miim } : {}}>VIEW</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   PUBLIC PAGES
   ═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   CAROUSEL — configurable cols, arrows, peek
   ═══════════════════════════════════════ */
function Carousel({ items, onClickItem, cols = 4 }) {
  const scrollRef = useRef(null);
  const { mob } = useR();
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  const gap = mob ? 12 : 20;

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const t = setTimeout(checkScroll, 100);
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => { clearTimeout(t); el.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, [items]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardW = el.querySelector("[data-card]")?.offsetWidth || 280;
    smoothScroll(el, dir * (cardW + gap));
  };

  if (!items.length) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 14 }}>No collections yet.</div>;

  // Card width: N cols fit + ~60px peek of next card
  const peek = 20;
  const cardFlex = mob
    ? "0 0 78%"
    : `0 0 calc((100% - ${(cols - 1) * gap}px) / ${cols} - ${peek}px)`;

  return (
    <div style={{ position: "relative" }}>
      {/* Left arrow */}
      {canL && (
        <button onClick={() => scroll(-1)} style={{
          position: "absolute", left: mob ? 4 : -20, top: "50%", transform: "translateY(-50%)", zIndex: 3,
          width: 40, height: 40, background: C.white, border: `2px solid ${C.black}`,
          boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><ChevronLeft size={20} /></button>
      )}
      {/* Right arrow */}
      {canR && (
        <button onClick={() => scroll(1)} style={{
          position: "absolute", right: mob ? 4 : -20, top: "50%", transform: "translateY(-50%)", zIndex: 3,
          width: 40, height: 40, background: C.white, border: `2px solid ${C.black}`,
          boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><ChevronRight size={20} /></button>
      )}
      {/* Peek fade on right edge */}
      {canR && (
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 4, width: 48, zIndex: 2,
          background: `linear-gradient(to left, ${C.pageBg} 0%, transparent 100%)`,
          pointerEvents: "none",
        }} />
      )}
      {/* Peek fade on left edge */}

      {/* Scrollable row */}
      <div ref={scrollRef} style={{
        display: "flex", gap, overflowX: "auto", alignItems: "stretch",
        scrollSnapType: "x mandatory", paddingBottom: 4,
        scrollbarWidth: "none", msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}>
        {items.map(item => (
          <div key={item.id} data-card style={{
            flex: cardFlex,
            scrollSnapAlign: "start", minWidth: 0,
          }}>
            <CardItem item={item} onClick={() => onClickItem(item.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function HomePage() {
  const { collections, heroSettings, setPage } = useContext(Ctx);
  const { mob, cols } = useR();
  const [bf, setBf] = useState("TELECA COLLECTION CARD");
  return (<React.Fragment><div style={{ background: C.black, padding: mob ? "56px 16px" : "96px 32px", backgroundImage: gridBg, backgroundSize: "4rem 4rem" }}><div style={{ maxWidth: 1280, margin: "0 auto" }}><div style={{ display: "inline-block", border: "2px solid rgba(255,255,255,.3)", color: C.white, fontSize: 11, fontWeight: 700, letterSpacing: ".12em", padding: "5px 14px", marginBottom: 20 }}>PREMIUM TRADING CARDS</div><h1 style={{ fontSize: "clamp(40px,8vw,76px)", fontWeight: 900, color: C.white, lineHeight: 1.0, letterSpacing: "-.03em", textTransform: "uppercase", whiteSpace: "pre-line" }}>{heroSettings.title}</h1><p style={{ color: C.textLight, fontSize: "clamp(14px,2vw,18px)", marginTop: 20, maxWidth: 460, lineHeight: 1.6 }}>{heroSettings.subtitle}</p><div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}><Btn v="filled" onClick={() => setPage({ view: "collection" })}>New Releases →</Btn><Btn v="whiteO" onClick={() => setPage({ view: "collection" })}>Full Catalog</Btn></div></div></div><div style={{ padding: mob ? "40px 16px" : "64px 32px", maxWidth: 1280, margin: "0 auto" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 8 }}><div><h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 900, letterSpacing: "-.02em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}><Zap size={22} /> NEW RELEASES</h2><p style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>Latest collection launches</p></div><Btn size="sm" onClick={() => setPage({ view: "collection" })}>VIEW ALL →</Btn></div><div style={{ borderTop: `2px solid ${C.black}`, paddingTop: 20 }}><Carousel items={(() => { const nw = [...collections].filter(c => c.isNew).sort((a,b) => (b.releaseDate||"").localeCompare(a.releaseDate||"")); return nw.length >= 2 ? nw : [...collections].sort((a,b) => (b.releaseDate||"").localeCompare(a.releaseDate||"")).slice(0, 2); })()} onClickItem={id => setPage({ view: "detail", id })} cols={3} /></div></div><div style={{ padding: mob ? "16px 16px 40px" : "16px 32px 64px", maxWidth: 1280, margin: "0 auto" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 8 }}><div><h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 900, letterSpacing: "-.02em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}><Crown size={22} /> BRANDS</h2><p style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>Browse by collection brand</p></div><div style={{ display: "flex", gap: 8 }}>{["TELECA COLLECTION CARD", "MIIM CARD"].map(b => { const isMiim = b === "MIIM CARD"; const active = bf === b; return <button key={b} onClick={() => setBf(b)} style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "6px 12px", cursor: "pointer", border: `2px solid ${isMiim ? C.miim : C.black}`, background: active ? (isMiim ? C.miim : C.black) : "transparent", color: active ? C.white : (isMiim ? C.miim : C.textPrimary), transition: "all .25s", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>{b}</button>; })}</div></div><Carousel items={[...collections].filter(c => c.brand === bf).sort((a,b) => (b.releaseDate||"").localeCompare(a.releaseDate||""))} onClickItem={id => setPage({ view: "detail", id })} cols={4} /></div><div style={{ background: "#000", padding: mob ? "56px 16px" : "80px 32px", textAlign: "center", backgroundImage: gridBgLight, backgroundSize: "4rem 4rem" }}><h2 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, color: C.white, textTransform: "uppercase", lineHeight: 1.0 }}>{"START YOUR\nCOLLECTION TODAY"}</h2><p style={{ color: C.textLight, fontSize: "clamp(14px,2vw,18px)", marginTop: 16, marginBottom: 32 }}>Experience the joy of collecting and trading special cards</p><Btn v="whiteO" size="lg" onClick={() => setPage({ view: "collection" })}>GET STARTED</Btn></div></React.Fragment>);
}

function CollectionPage({ initialBrand }) {
  const { collections, setPage } = useContext(Ctx); const { mob, cols } = useR(); const [bf, setBf] = useState(initialBrand || null); const [sf, setSf] = useState("all");
  let list = collections; if (bf) list = list.filter(c => c.brand === bf); if (sf === "new") list = list.filter(c => c.isNew); if (sf === "available") list = list.filter(c => c.status === "available"); const base = bf ? collections.filter(c => c.brand === bf) : collections;
  return (<React.Fragment><div style={{ background: C.black, padding: mob ? "40px 16px" : "64px 32px", backgroundImage: gridBg, backgroundSize: "4rem 4rem" }}><div style={{ maxWidth: 1280, margin: "0 auto" }}><h1 style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 900, color: C.white, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 10 }}><LayoutGrid size={26} /> TELECA COLLECTION</h1><p style={{ color: C.textOnDark, fontSize: 15, marginTop: 8 }}>Browse all trading card collections</p></div></div><div style={{ padding: mob ? "20px 16px 40px" : "32px 32px 64px", maxWidth: 1280, margin: "0 auto" }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}><span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted }}>Brand:</span>{["TELECA COLLECTION CARD", "MIIM CARD"].map(b => <Btn key={b} size="sm" v={bf === b ? "filled" : "outline"} onClick={() => setBf(bf === b ? null : b)}>{b}</Btn>)}</div><div style={{ display: "flex", marginBottom: 20, border: `2px solid ${C.black}`, width: "fit-content" }}>{[{ k: "all", l: `ALL (${base.length})` }, { k: "new", l: `NEW (${base.filter(c => c.isNew).length})` }, { k: "available", l: `AVAIL (${base.filter(c => c.status === "available").length})` }].map(s => <button key={s.k} onClick={() => setSf(s.k)} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, padding: "8px 16px", cursor: "pointer", border: "none", background: sf === s.k ? C.black : C.white, color: sf === s.k ? C.white : C.textMuted }}>{s.l}</button>)}</div><div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: mob ? 16 : 24, alignItems: "stretch" }}>{list.map(i => <CardItem key={i.id} item={i} onClick={() => setPage({ view: "detail", id: i.id })} />)}</div></div></React.Fragment>);
}

/* ═══════════════════════════════════════
   ★ CTA Auto-Switch Logic
   ═══════════════════════════════════════ */
function getCTAInfo(item) {
  const today = new Date().toISOString().split("T")[0];
  // 품절
  if (item.status === "soldout") {
    return { label: "Restock Alert", icon: <Bell size={14} />, type: "restock" };
  }
  // 릴리즈 전
  if (item.releaseDate && item.releaseDate > today) {
    return { label: "Pre-Order Inquiry", icon: <CalendarCheck size={14} />, type: "preorder" };
  }
  // 판매중
  return { label: "Order Inquiry", icon: <ClipboardList size={14} />, type: "purchase" };
}

/* ═══════════════════════════════════════
   ★ Order Modal — B2B Wholesale Inquiry
   ═══════════════════════════════════════ */
const REGIONS = [
  { value: "", label: "— Select Region —" },
  { value: "KR", label: "🇰🇷 South Korea" }, { value: "JP", label: "🇯🇵 Japan" }, { value: "CN", label: "🇨🇳 China" },
  { value: "TW", label: "🇹🇼 Taiwan" }, { value: "HK", label: "🇭🇰 Hong Kong" }, { value: "SG", label: "🇸🇬 Singapore" },
  { value: "TH", label: "🇹🇭 Thailand" }, { value: "VN", label: "🇻🇳 Vietnam" }, { value: "PH", label: "🇵🇭 Philippines" },
  { value: "ID", label: "🇮🇩 Indonesia" }, { value: "MY", label: "🇲🇾 Malaysia" },
  { value: "US", label: "🇺🇸 United States" }, { value: "CA", label: "🇨🇦 Canada" },
  { value: "GB", label: "🇬🇧 United Kingdom" }, { value: "DE", label: "🇩🇪 Germany" }, { value: "FR", label: "🇫🇷 France" },
  { value: "AU", label: "🇦🇺 Australia" }, { value: "OTHER", label: "Other (specify)" },
];
const ORG_TYPES = [
  { value: "", label: "— Select Type —" },
  { value: "cardshop", label: "Card Shop (Retail)" }, { value: "online", label: "Online Card Shop" },
  { value: "distributor", label: "Distributor / Wholesaler" }, { value: "agency", label: "Agency / Buyer" },
  { value: "other", label: "Other" },
];

function OrderModal({ open, onClose, item, ctaType }) {
  const { mob } = useR();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", orgType: "", orgName: "", region: "", regionOther: "", qty: 1, message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  if (!open) return null;

  const titles = { preorder: "Pre-Order Inquiry", purchase: "Order Inquiry", restock: "Restock Alert" };
  const bpc = item.boxesPerCase || 12;

  const handleSubmit = () => {
    if (!form.name.trim()) { alert("Please enter your name."); return; }
    if (!form.email.trim()) { alert("Please enter your email."); return; }
    if (!form.orgType) { alert("Please select your organization type."); return; }
    if (!form.region) { alert("Please select your region."); return; }
    if (ctaType !== "restock" && form.qty < 1) { alert("Please enter a quantity."); return; }
    setSubmitted(true);
  };
  const resetAndClose = () => {
    setSubmitted(false);
    setForm({ name: "", email: "", phone: "", orgType: "", orgName: "", region: "", regionOther: "", qty: 1, message: "" });
    onClose();
  };

  const sectionHead = (text) => (
    <div style={{ fontSize: 12, fontWeight: 900, color: C.textPrimary, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${C.gray200}`, letterSpacing: ".04em", marginTop: 8 }}>{text}</div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "fadeIn .2s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.white, border: `2px solid ${C.black}`, width: "100%", maxWidth: 580, maxHeight: "92vh", overflowY: "auto", boxShadow: "12px 12px 0 0 rgba(0,0,0,1)", animation: "slideUp .3s cubic-bezier(.23,1,.32,1)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `2px solid ${C.black}`, background: C.black, color: C.white }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, textTransform: "uppercase" }}>{titles[ctaType]}</div>
            <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>WHOLESALE ORDER INQUIRY</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.white, cursor: "pointer", padding: 4 }}><X size={20} /></button>
        </div>

        {!submitted ? (
          <div style={{ padding: 24 }}>
            {/* Product summary */}
            <div style={{ display: "flex", gap: 12, padding: 14, marginBottom: 24, background: C.pageBg, border: `2px solid ${C.gray200}` }}>
              <div style={{ width: 52, height: 68, flexShrink: 0, overflow: "hidden", background: "linear-gradient(145deg, #1a1a2e, #0f1626)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.thumbnail ? <img src={item.thumbnail} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 3 }} /> : <Package size={18} style={{ color: C.textLight }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase" }}>{item.title}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{item.brand}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{item.cardsPerPack} cards/pack · {item.packsPerBox} packs/box · {bpc} boxes/case · Release {item.releaseDate || "TBD"}</div>
              </div>
            </div>

            {sectionHead("Contact Information")}
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 0 : 12 }}>
              <Input label="Name *" value={form.name} onChange={v => u("name", v)} placeholder="John Doe" />
              <Input label="Email *" type="email" value={form.email} onChange={v => u("email", v)} placeholder="name@company.com" />
            </div>
            <Input label="Phone" value={form.phone} onChange={v => u("phone", v)} placeholder="+1-000-000-0000" />

            {sectionHead("Organization")}
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 0 : 12 }}>
              <Sel label="Organization Type *" value={form.orgType} onChange={v => u("orgType", v)} options={ORG_TYPES} />
              <Input label="Company Name" value={form.orgName} onChange={v => u("orgName", v)} placeholder="e.g. ABC Card Shop" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 0 : 12 }}>
              <Sel label="Region (Country) *" value={form.region} onChange={v => u("region", v)} options={REGIONS} />
              {form.region === "OTHER" && <Input label="Specify Region" value={form.regionOther} onChange={v => u("regionOther", v)} placeholder="Country / City" />}
            </div>

            {ctaType !== "restock" && (
              <React.Fragment>
                {sectionHead("Order Details")}
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 0 : 12 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Order Quantity (Cases) *</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => u("qty", Math.max(1, form.qty - 1))} style={{ width: 44, height: 44, border: `2px solid ${C.black}`, background: C.pageBg, cursor: "pointer", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <input type="number" value={form.qty} onChange={e => u("qty", Math.max(1, parseInt(e.target.value) || 1))} min="1" style={{ width: 64, textAlign: "center", padding: "8px", border: `2px solid ${C.black}`, fontSize: 16, fontWeight: 900, fontFamily: F.ui, outline: "none" }} />
                      <button onClick={() => u("qty", form.qty + 1)} style={{ width: 44, height: 44, border: `2px solid ${C.black}`, background: C.pageBg, cursor: "pointer", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Order Breakdown</label>
                    <div style={{ padding: "10px 14px", background: C.pageBg, border: `1px solid ${C.gray200}`, fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 700 }}>{form.qty} {form.qty === 1 ? "Case" : "Cases"}</div>
                      <div style={{ color: C.textMuted, fontSize: 12 }}>= {form.qty * bpc} Boxes · {form.qty * bpc * item.packsPerBox} Packs · {(form.qty * bpc * item.packsPerBox * item.cardsPerPack).toLocaleString()} Cards</div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}

            <Input label="Additional Notes" textarea rows={3} value={form.message} onChange={v => u("message", v)} placeholder="Any additional questions or special requests..." />

            <div style={{ padding: "12px 14px", background: "#FEF9C3", border: "1px solid #FDE68A", fontSize: 12, color: "#92400E", lineHeight: 1.6, marginBottom: 20 }}>
              This form is for wholesale (B2B) inquiries. Our sales team will respond within <strong>1 business day</strong>.
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn v="ghost" onClick={onClose}>Cancel</Btn>
              <Btn v="blue" onClick={handleSubmit}><Send size={14} /> Submit Inquiry</Btn>
            </div>
          </div>
        ) : (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check size={28} style={{ color: C.white }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{ctaType === "restock" ? "Restock Alert Registered" : "Inquiry Submitted"}</div>
            <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, marginBottom: 12 }}>
              {ctaType === "restock" ? "We will notify you via email when this product is restocked." : "Our sales team will respond within 1 business day."}
            </p>
            {ctaType !== "restock" && (
              <div style={{ display: "inline-block", padding: "12px 20px", background: C.pageBg, border: `1px solid ${C.gray200}`, fontSize: 13, textAlign: "left", lineHeight: 1.7, marginBottom: 20, color: C.textSecondary }}>
                <div><strong>Name:</strong> {form.name}</div>
                <div><strong>Email:</strong> {form.email}</div>
                {form.orgName && <div><strong>Company:</strong> {form.orgName}</div>}
                <div><strong>수량:</strong> {form.qty} {form.qty === 1 ? "Case" : "Cases"} ({form.qty * bpc}박스)</div>
              </div>
            )}
            <div><Btn v="filled" onClick={resetAndClose}>Close</Btn></div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailPage({ id }) {
  const { collections, setPage } = useContext(Ctx); const { mob, cols } = useR(); const [tab, setTab] = useState("chasing");
  const [modalOpen, setModalOpen] = useState(false);
  const item = collections.find(c => c.id === id);
  if (!item) return <div style={{ padding: 40 }}>Not found.</div>;
  const related = collections.filter(c => c.id !== id && c.brand === item.brand).slice(0, 4);
  const rs = (r) => ({ fontSize: 11, fontWeight: 700, padding: "3px 10px", textTransform: "uppercase", background: r === "Common" ? C.gray100 : r === "Rare" ? "#DBEAFE" : r === "Super Rare" ? "#FEF3C7" : "#FCE7F3", color: r === "Common" ? C.textMuted : r === "Rare" ? "#1E40AF" : r === "Super Rare" ? "#92400E" : "#BE185D" });
  const cta = getCTAInfo(item);

  return (
    <React.Fragment>
      <div style={{ padding: mob ? "10px 16px" : "12px 32px", fontSize: 11, color: C.textMuted, display: "flex", gap: 6, alignItems: "center", fontWeight: 700, textTransform: "uppercase", borderBottom: `1px solid ${C.gray200}`, flexWrap: "wrap" }}>
        <button style={{ color: C.textMuted, cursor: "pointer", background: "none", border: "none", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }} onClick={() => setPage({ view: "home" })}>HOME</button>/
        <button style={{ color: C.textMuted, cursor: "pointer", background: "none", border: "none", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }} onClick={() => setPage({ view: "collection" })}>COLLECTION</button>/
        <span style={{ color: C.textPrimary }}>{item.title}</span>
      </div>

      <div style={{ background: C.black, padding: mob ? "32px 16px" : "48px 32px", backgroundImage: gridBg, backgroundSize: "4rem 4rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 24 : 48, alignItems: "center" }}>
          <div>
            <button style={{ color: C.textOnDark, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "none", border: "none", marginBottom: 24, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase" }} onClick={() => setPage({ view: "collection" })}><ArrowLeft size={14} /> COLLECTION</button>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", textTransform: "uppercase", background: "rgba(255,255,255,.08)", color: C.white, border: "1px solid rgba(255,255,255,.2)" }}>{item.brand}</span>
              {item.isNew && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", background: C.red, color: C.white }}>NEW</span>}
            </div>
            <h1 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 900, color: C.white, textTransform: "uppercase", lineHeight: 1.0, marginBottom: 14 }}>{item.title}</h1>
            <p style={{ color: C.textLight, fontSize: 14, lineHeight: 1.6, marginBottom: 24, maxWidth: 480 }}>{item.description}</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              {[{ v: item.cardsPerPack, l: "CARDS/PACK" }, { v: item.packsPerBox, l: "PACKS/BOX" }, { v: item.boxesPerCase || "-", l: "BOX/CASE" }, { v: item.releaseDate, l: "RELEASE" }].map((s, i) => <div key={i} style={{ background: "rgba(255,255,255,.06)", border: "2px solid rgba(255,255,255,.12)", padding: "10px 14px", minWidth: 76 }}><div style={{ fontSize: 18, fontWeight: 900, color: C.white }}>{s.v}</div><div style={{ fontSize: 10, color: C.textLight, fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>{s.l}</div></div>)}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Btn v="blue" onClick={() => setModalOpen(true)}>{cta.icon} {cta.label}</Btn></div>
          </div>
          <AutoImg src={item.mainImage} padding="24px" style={{ height: mob ? 280 : 400, border: "2px solid rgba(255,255,255,.08)" }} />
        </div>
      </div>

      {/* Order Modal */}
      <OrderModal open={modalOpen} onClose={() => setModalOpen(false)} item={item} ctaType={cta.type} />

      <div style={{ display: "flex", borderBottom: `2px solid ${C.black}`, padding: mob ? "0 16px" : "0 32px", maxWidth: 1280, margin: "0 auto", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {[{ k: "chasing", l: "CHASING CARDS", i: <Target size={14} /> }, { k: "checklist", l: "CHECKLIST", i: <CheckSquare size={14} /> }, { k: "info", l: "PRODUCT INFO", i: <Info size={14} /> }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: mob ? "14px 14px" : "16px 24px", cursor: "pointer", background: "none", border: "none", borderBottom: tab === t.k ? `3px solid ${C.black}` : "3px solid transparent", marginBottom: -2, color: tab === t.k ? C.textPrimary : C.textMuted, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>{t.i} {t.l}</button>
        ))}
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", overflow: "hidden" }}>
        {tab === "chasing" && (
          <div style={{ padding: mob ? "28px 16px" : "40px 32px" }}>
            <h3 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, textTransform: "uppercase", marginBottom: 4 }}>SPECIAL CARD LINEUP</h3>
            <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 28 }}>Rare cards you can find in this product</p>
            <ChasingCarousel cards={item.chasingCards} />
          </div>
        )}

        {tab === "checklist" && (
          <div style={{ padding: mob ? "28px 16px" : "36px 32px", overflowX: "auto" }}>
            <h3 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, textTransform: "uppercase", marginBottom: 20 }}>CARD CHECKLIST</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
              <thead><tr>{["#", "CARD NAME", "RARITY"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, padding: "10px 14px", borderBottom: `3px solid ${C.black}`, color: C.textMuted }}>{h}</th>)}</tr></thead>
              <tbody>{item.checklist.map((cl, i) => <tr key={i}><td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.gray200}`, fontWeight: 700, fontSize: 13, width: 70 }}>{cl.number}</td><td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.gray200}`, fontSize: 13 }}>{cl.name}</td><td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.gray200}` }}><span style={rs(cl.rarity)}>{cl.rarity.toUpperCase()}</span></td></tr>)}</tbody>
            </table>
          </div>
        )}

        {tab === "info" && (
          <div style={{ padding: mob ? "28px 16px" : "36px 32px", maxWidth: 720 }}>
            <h3 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, textTransform: "uppercase", marginBottom: 16 }}>PRODUCT INFORMATION</h3>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: C.textSecondary }}>{item.productInfo}</p>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div style={{ background: C.black, padding: mob ? "32px 16px" : "48px 32px", marginTop: 40 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <h3 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, color: C.white, textTransform: "uppercase", marginBottom: 20 }}>RELATED PRODUCTS</h3>
            <div style={mob ? { display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 8 } : { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {related.map(r => <div key={r.id} onClick={() => setPage({ view: "detail", id: r.id })} style={{ background: C.gray800, cursor: "pointer", overflow: "hidden", border: "2px solid rgba(255,255,255,.08)", ...(mob ? { minWidth: "75%", scrollSnapAlign: "start", flexShrink: 0 } : {}) }}><AutoImg src={r.thumbnail} padding="8px" style={{ height: mob ? 140 : 170 }} /><div style={{ padding: "12px 14px" }}><div style={{ fontSize: 10, fontWeight: 700, color: C.textLight, letterSpacing: ".04em", marginBottom: 4 }}>{r.brand}</div><div style={{ fontSize: 15, fontWeight: 900, color: C.white }}>{r.title}</div></div></div>)}
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

function ContactPage() {
  const { mob } = useR();
  const [form, setForm] = useState({ name: "", email: "", company: "", subject: "", message: "" });
  const [privacy, setPrivacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      alert("Name, email, and message are required.");
      return;
    }
    if (!privacy) { alert("Please agree to the privacy policy."); return; }
    setSubmitted(true);
  };

  return (
    <React.Fragment>
      <div style={{ background: C.black, padding: mob ? "40px 16px" : "64px 32px", backgroundImage: gridBg, backgroundSize: "4rem 4rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 900, color: C.white, textTransform: "uppercase" }}>CONTACT US</h1>
          <p style={{ color: C.textOnDark, fontSize: 15, marginTop: 8 }}>Get in touch with the TELECA team</p>
        </div>
      </div>

      <div style={{
        padding: mob ? "32px 16px 48px" : "56px 32px 72px",
        background: C.pageBg, display: "flex", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* Watermark */}
        <div style={{ position: "absolute", inset: -100, pointerEvents: "none", opacity: 0.03, display: "flex", flexWrap: "wrap", alignContent: "flex-start", transform: "rotate(-15deg)", transformOrigin: "center" }}>
          {Array.from({ length: 200 }).map((_, i) => (
            <div key={i} style={{ fontSize: 32, fontWeight: 900, letterSpacing: ".2em", color: C.black, padding: "6px 20px", whiteSpace: "nowrap" }}>TELECA</div>
          ))}
        </div>

        {!submitted ? (
          <div style={{ width: "100%", maxWidth: 560, position: "relative", zIndex: 1 }}>
            <div style={{ border: `4px solid ${C.black}`, boxShadow: "12px 12px 0 0 rgba(0,0,0,1)", background: C.white, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: C.black, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.white, textTransform: "uppercase" }}>CONTACT CARD</div>
                  <div style={{ fontSize: 10, color: C.textLight, marginTop: 2, letterSpacing: ".1em" }}>SEND US A MESSAGE</div>
                </div>
                <div style={{ width: 40, height: 40, border: "2px solid rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Send size={18} style={{ color: C.white }} />
                </div>
              </div>

              {/* Form area */}
              <div style={{ margin: mob ? 12 : 20, border: `2px solid ${C.gray200}`, padding: mob ? 16 : 24, position: "relative" }}>
                {[{ top: -5, left: -5 }, { top: -5, right: -5 }, { bottom: -5, left: -5 }, { bottom: -5, right: -5 }].map((pos, i) => (
                  <div key={i} style={{ position: "absolute", ...pos, width: 12, height: 12, background: C.black }} />
                ))}

                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 0 : 12 }}>
                  <Input label="Name *" value={form.name} onChange={v => u("name", v)} placeholder="John Doe" />
                  <Input label="Email *" value={form.email} onChange={v => u("email", v)} type="email" placeholder="name@company.com" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 0 : 12 }}>
                  <Input label="Company" value={form.company} onChange={v => u("company", v)} placeholder="Break & Company" />
                  <Input label="Subject" value={form.subject} onChange={v => u("subject", v)} placeholder="Inquiry subject" />
                </div>
                <Input label="Message *" value={form.message} onChange={v => u("message", v)} textarea rows={5} placeholder="Write your message here..." />

                {/* Privacy */}
                <div style={{ padding: "14px 16px", background: C.pageBg, border: `1px solid ${C.gray200}`, marginBottom: 16, marginTop: 4 }}>
                  <div onClick={() => setPrivacy(!privacy)} style={{ display: "flex", gap: 10, cursor: "pointer", alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, flexShrink: 0, marginTop: 1, border: `2px solid ${privacy ? C.blue : C.black}`, background: privacy ? C.blue : C.white, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s ease" }}>
                      {privacy && <Check size={13} style={{ color: C.white }} />}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.6 }}>
                      <strong style={{ color: C.textPrimary }}>[Required] Privacy Policy Consent</strong><br />
                      Data collected: Name, Email, Company | Purpose: Inquiry response | Retention: 1 year after resolution, then deleted.
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: `4px solid ${C.black}`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: C.pageBg }}>
                <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: ".08em" }}>© 2026 BREAK&COMPANY</div>
                <Btn v="blue" onClick={handleSubmit}><Send size={14} /> Submit Inquiry</Btn>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 1 }}>
            <div style={{ border: `4px solid ${C.black}`, boxShadow: "12px 12px 0 0 rgba(0,0,0,1)", background: C.white, overflow: "hidden" }}>
              <div style={{ background: C.green, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.white, textTransform: "uppercase" }}>MESSAGE SENT</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: ".12em", background: "rgba(255,255,255,.15)", padding: "4px 10px" }}>CONFIRMED</div>
              </div>
              <div style={{ padding: "48px 32px", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: `0 0 0 4px ${C.white}, 0 0 0 6px ${C.green}` }}>
                  <Check size={32} style={{ color: C.white }} />
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Inquiry Submitted</div>
                <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, marginBottom: 24 }}>Our team will get back to you as soon as possible.</p>
                <div style={{ display: "inline-block", padding: "12px 20px", background: C.pageBg, border: `1px solid ${C.gray200}`, fontSize: 13, textAlign: "left", lineHeight: 1.7, marginBottom: 24, color: C.textSecondary }}>
                  <div><strong>Name:</strong> {form.name}</div>
                  <div><strong>Email:</strong> {form.email}</div>
                  {form.company && <div><strong>Company:</strong> {form.company}</div>}
                </div>
              </div>
              <div style={{ borderTop: `4px solid ${C.black}`, padding: "16px 24px", textAlign: "center", background: C.pageBg }}>
                <Btn v="filled" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", company: "", subject: "", message: "" }); setPrivacy(false); }}>New Inquiry</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

/* ═══════════════════════════════════════
   FAQ PAGE
   ═══════════════════════════════════════ */
const FAQ_DATA = [
  {
    category: "ORDERING",
    items: [
      { q: "What is the minimum order quantity?", a: "All wholesale orders are placed in case units. The minimum order is 1 case. Each case contains a set number of boxes depending on the product (typically 8–12 boxes per case)." },
      { q: "How do I place a wholesale order?", a: "Navigate to any product page and click the 'Order Inquiry' or 'Pre-Order Inquiry' button. Fill out the inquiry form with your contact details, organization info, and desired quantity. Our sales team will respond within 1 business day." },
      { q: "Can I order sample packs before committing to a full case?", a: "Sample requests are handled on a case-by-case basis. Please reach out through our Contact page and mention your interest in samples. Our team will work with you to find the best solution." },
    ],
  },
  {
    category: "PRODUCTS",
    items: [
      { q: "What types of trading cards does TELECA produce?", a: "TELECA specializes in K-IP (Korean Intellectual Property) trading cards, including K-POP artist collections, webtoon character cards, sports collaborations, and original illustration series under the MIIM CARD brand." },
      { q: "What are Chasing Cards?", a: "Chasing Cards are rare, special insert cards found randomly in packs. They feature premium finishes such as holographic effects, autograph prints, chrome coatings, or relic patches. Each product page lists the specific chasing cards and their pull ratios." },
      { q: "Are the cards officially licensed?", a: "Yes. All TELECA products are produced under official licensing agreements with IP holders. Each collection is developed in close collaboration with the respective rights holders." },
    ],
  },
  {
    category: "SHIPPING & DELIVERY",
    items: [
      { q: "Which regions do you ship to?", a: "We ship worldwide. Our primary markets include South Korea, Japan, Southeast Asia, North America, and Europe. Shipping options and costs vary by region and will be confirmed during the order process." },
      { q: "How long does delivery take?", a: "Domestic (Korea) orders typically ship within 2–3 business days. International orders take 7–14 business days depending on the destination and shipping method selected." },
      { q: "Do you handle customs and import duties?", a: "Shipping terms, including customs and import duty responsibilities, are confirmed during the order process and outlined in individual purchase agreements." },
    ],
  },
  {
    category: "PARTNERSHIP",
    items: [
      { q: "How can I become an authorized retailer?", a: "We welcome partnership inquiries from card shops, online retailers, and distributors worldwide. Please submit your details through the Order Inquiry form or Contact page, and our BD team will reach out to discuss terms." },
    ],
  },
];

function FaqPage() {
  const { mob } = useR();
  const { setPage } = useContext(Ctx);
  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (key) => setOpenIdx(openIdx === key ? null : key);

  return (
    <React.Fragment>
      <div style={{ background: C.black, padding: mob ? "40px 16px" : "64px 32px", backgroundImage: gridBg, backgroundSize: "4rem 4rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 900, color: C.white, textTransform: "uppercase" }}>FAQ</h1>
          <p style={{ color: C.textOnDark, fontSize: 15, marginTop: 8 }}>Frequently Asked Questions</p>
        </div>
      </div>

      <div style={{ padding: mob ? "32px 16px 48px" : "48px 32px 72px", maxWidth: 800, margin: "0 auto" }}>
        {FAQ_DATA.map((section, si) => (
          <div key={si} style={{ marginBottom: 36 }}>
            <div style={{
              fontSize: 12, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase",
              color: C.white, background: C.black, padding: "10px 16px", marginBottom: 0,
            }}>{section.category}</div>
            <div style={{ border: `2px solid ${C.black}`, borderTop: "none" }}>
              {section.items.map((faq, fi) => {
                const key = `${si}-${fi}`;
                const isOpen = openIdx === key;
                return (
                  <div key={fi} style={{ borderTop: fi > 0 ? `1px solid ${C.gray200}` : "none" }}>
                    <button onClick={() => toggle(key)} style={{
                      width: "100%", textAlign: "left", padding: "16px 18px",
                      background: isOpen ? C.pageBg : C.white,
                      border: "none", cursor: "pointer", fontFamily: F.ui,
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, lineHeight: 1.3 }}>{faq.q}</span>
                      <span style={{
                        fontSize: 18, fontWeight: 700, color: C.textMuted, flexShrink: 0,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        transition: "transform .25s ease",
                      }}>+</span>
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: "0 18px 18px", fontSize: 14, lineHeight: 1.7,
                        color: C.textSecondary, background: C.pageBg,
                      }}>{faq.a}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{
          padding: "24px 28px", background: C.black, marginTop: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.white }}>Still have questions?</div>
            <div style={{ fontSize: 13, color: C.textLight, marginTop: 4 }}>Our team is here to help.</div>
          </div>
          <Btn v="whiteO" size="sm" onClick={() => setPage({ view: "contact" })}>CONTACT US →</Btn>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ═══════════════════════════════════════
   POLICY PAGE — shared layout
   ═══════════════════════════════════════ */
function PolicyPage({ title, subtitle, lastUpdated, sections }) {
  const { mob } = useR();
  return (
    <React.Fragment>
      <div style={{ background: C.black, padding: mob ? "40px 16px" : "64px 32px", backgroundImage: gridBg, backgroundSize: "4rem 4rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 900, color: C.white, textTransform: "uppercase" }}>{title}</h1>
          <p style={{ color: C.textOnDark, fontSize: 15, marginTop: 8 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding: mob ? "32px 16px 48px" : "48px 32px 72px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 32, fontWeight: 700 }}>Last Updated: {lastUpdated}</div>
        {sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <div style={{
              fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em",
              padding: "10px 16px", background: C.black, color: C.white, marginBottom: 16,
            }}>{i + 1}. {sec.title}</div>
            {sec.paragraphs.map((p, j) => (
              <p key={j} style={{ fontSize: 14, lineHeight: 1.7, color: C.textSecondary, marginBottom: 12, paddingLeft: 16 }}>{p}</p>
            ))}
          </div>
        ))}
        <div style={{
          padding: "20px 24px", background: C.pageBg, border: `2px solid ${C.black}`,
          fontSize: 13, lineHeight: 1.6, color: C.textMuted, marginTop: 20,
        }}>
          For questions regarding this policy, please contact us at <strong style={{ color: C.textPrimary }}>contact@break.co.kr</strong>
        </div>
      </div>
    </React.Fragment>
  );
}

function PrivacyPage() {
  return (
    <PolicyPage
      title="PRIVACY POLICY"
      subtitle="How we collect, use, and protect your information"
      lastUpdated="April 1, 2026"
      sections={[
        {
          title: "Information We Collect",
          paragraphs: [
            "We collect information you provide directly when submitting inquiry forms on our website, including your name, email address, phone number, company name, organization type, and region.",
            "We may also automatically collect certain technical information when you visit our website, such as your IP address, browser type, device information, and pages visited. This data is collected through standard web analytics tools and is used solely to improve our website experience.",
          ],
        },
        {
          title: "How We Use Your Information",
          paragraphs: [
            "We use the information collected to respond to your wholesale order inquiries and business partnership requests, communicate with you about products, pricing, and order status, provide customer support, improve our website and services, and comply with legal obligations.",
            "We do not use your information for automated decision-making or profiling. We do not sell, rent, or trade your personal information to third parties for marketing purposes.",
          ],
        },
        {
          title: "Data Sharing and Disclosure",
          paragraphs: [
            "We may share your information with affiliated companies within Break & Company group (including BREAK marketplace and BRG grading services) for the purpose of fulfilling your orders and providing integrated services.",
            "We may also share your information with logistics and shipping partners to facilitate product delivery, professional service providers who assist our business operations under confidentiality agreements, and legal authorities when required by applicable law or regulation.",
          ],
        },
        {
          title: "Data Retention",
          paragraphs: [
            "We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, typically for 1 year after the completion of your inquiry or the end of our business relationship. After this period, your data will be securely deleted or anonymized.",
            "You may request early deletion of your data by contacting us at contact@break.co.kr.",
          ],
        },
        {
          title: "Data Security",
          paragraphs: [
            "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
          ],
        },
        {
          title: "Your Rights",
          paragraphs: [
            "Depending on your jurisdiction, you may have the right to access the personal data we hold about you, request correction of inaccurate data, request deletion of your data, object to or restrict certain processing activities, and receive your data in a portable format.",
            "To exercise any of these rights, please contact us using the information provided below. We will respond to your request within 30 days.",
          ],
        },
        {
          title: "International Data Transfers",
          paragraphs: [
            "As a global business headquartered in South Korea, your data may be transferred to and processed in countries other than your country of residence. We ensure that appropriate safeguards are in place for such transfers in compliance with applicable data protection laws in relevant jurisdictions.",
          ],
        },
        {
          title: "Changes to This Policy",
          paragraphs: [
            "We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will post the updated policy on this page with a revised 'Last Updated' date. We encourage you to review this policy periodically.",
          ],
        },
      ]}
    />
  );
}

function TermsPage() {
  return (
    <PolicyPage
      title="TERMS OF SERVICE"
      subtitle="Terms and conditions governing the use of our services"
      lastUpdated="April 1, 2026"
      sections={[
        {
          title: "Acceptance of Terms",
          paragraphs: [
            "By accessing or using the TELECA website (operated by Break & Company), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website or services.",
            "These terms apply to all visitors, users, and business partners who access or use our website and wholesale ordering services.",
          ],
        },
        {
          title: "Products and Services",
          paragraphs: [
            "TELECA is a trading card IP sourcing, design, and distribution brand operated by Break & Company. Our website provides product information, collection catalogs, and wholesale order inquiry services for authorized retailers, distributors, and business partners.",
            "All product images, descriptions, and specifications on our website are provided for informational purposes. While we strive for accuracy, we reserve the right to correct any errors and to modify product details without prior notice.",
          ],
        },
        {
          title: "Wholesale Orders and Pricing",
          paragraphs: [
            "All orders placed through our inquiry forms are wholesale (B2B) inquiries and are subject to confirmation by our sales team. Submitting an inquiry does not constitute a binding order or guarantee of product availability.",
            "Pricing, minimum order quantities, and payment terms will be communicated directly by our sales team upon review of your inquiry. All prices are subject to change without prior notice until a formal purchase agreement is executed.",
          ],
        },
        {
          title: "Intellectual Property",
          paragraphs: [
            "All content on this website, including but not limited to text, graphics, logos, images, product designs, card artwork, and the TELECA and MIIM CARD brand names, is the property of Break & Company or its licensors and is protected by applicable intellectual property laws.",
            "You may not reproduce, distribute, modify, create derivative works from, publicly display, or commercially exploit any content from our website without our prior written consent.",
          ],
        },
        {
          title: "User Responsibilities",
          paragraphs: [
            "You agree to provide accurate and complete information when submitting inquiry forms or communicating with our team. You agree not to use our website for any unlawful purpose, attempt to gain unauthorized access to our systems, or interfere with the proper functioning of our website.",
            "Business partners and authorized retailers are responsible for complying with all applicable local laws and regulations regarding the resale and distribution of our products in their respective markets.",
          ],
        },
        {
          title: "Limitation of Liability",
          paragraphs: [
            "To the maximum extent permitted by applicable law, Break & Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our website or services, including but not limited to loss of profits, data, or business opportunities.",
            "This website serves as an informational and inquiry platform only. No payment transactions are processed through this website, and all commercial terms are governed by separate agreements executed between the parties.",
          ],
        },
        {
          title: "Governing Law and Jurisdiction",
          paragraphs: [
            "These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of Korea. Any disputes arising from or relating to these terms shall be subject to the exclusive jurisdiction of the courts located in Seoul, Republic of Korea.",
          ],
        },
        {
          title: "Modifications",
          paragraphs: [
            "We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting on our website. Your continued use of our website after any changes constitutes your acceptance of the updated terms.",
          ],
        },
      ]}
    />
  );
}

/* ═══════════════════════════════════════
   ADMIN LOGIN + PANEL + EDITOR (한글)
   ═══════════════════════════════════════ */
function AdminLogin({ onAuth }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(false); const [shake, setShake] = useState(false);
  const attempt = () => { if (pw === ADMIN_PW) onAuth(); else { setErr(true); setShake(true); setTimeout(() => setShake(false), 500); } };
  return (<div style={{ minHeight: "100vh", background: C.black, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: gridBg, backgroundSize: "4rem 4rem" }}><div style={{ width: "100%", maxWidth: 400, padding: 32, animation: shake ? "shake .4s ease" : "none" }}><div style={{ textAlign: "center", marginBottom: 32 }}><Shield size={40} style={{ color: C.white, marginBottom: 12 }} /><img src={LOGO_SRC} alt="TELECA" style={{ height: 32 }} /><div style={{ fontSize: 12, color: C.textLight, marginTop: 4, fontWeight: 700 }}>관리자 콘솔</div></div><div style={{ background: C.white, padding: 24 }}><label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>비밀번호</label><div style={{ display: "flex", gap: 8 }}><input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(false); }} onKeyDown={e => e.key === "Enter" && attempt()} placeholder="관리자 비밀번호" style={{ flex: 1, padding: "10px 14px", border: `2px solid ${err ? C.red : C.black}`, fontSize: 14, fontFamily: F.ui, outline: "none" }} /><Btn v="filled" onClick={attempt}><Lock size={14} /></Btn></div>{err && <div style={{ fontSize: 12, color: C.red, marginTop: 8, fontWeight: 700 }}>비밀번호가 틀렸습니다.</div>}</div></div></div>);
}

function AdminPanel() {
  const { collections, setCollections, heroSettings, setHeroSettings, setAdminMode } = useContext(Ctx);
  const { mob } = useR(); const [tab, setTab] = useState("dashboard"); const [editingId, setEditingId] = useState(null); const { toast, showToast } = useToast();
  const exportJSON = () => { const blob = new Blob([JSON.stringify(collections, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "collections.json"; a.click(); URL.revokeObjectURL(url); showToast("JSON 다운로드 완료"); };
  const goHome = () => setAdminMode(false);
  const sec = { border: `2px solid ${C.black}`, padding: mob ? 16 : 24, background: C.white, marginBottom: 20 };
  return (<div style={{ minHeight: "100vh", background: C.pageBg, fontFamily: F.ui }}><Toast {...toast} /><div style={{ background: C.black, padding: mob ? "0 16px" : "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `2px solid ${C.blue}` }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><img src={LOGO_SRC} alt="TELECA" onClick={goHome} style={{ height: 24, cursor: "pointer" }} /><div style={{ background: C.blue, color: C.white, fontSize: 10, fontWeight: 700, padding: "3px 8px" }}>ADMIN</div></div><div style={{ display: "flex", gap: 8 }}><Btn size="sm" v="ghost" style={{ color: C.textLight, border: "none" }} onClick={goHome}><Home size={14} />{!mob && " 홈으로"}</Btn><Btn size="sm" v="ghost" style={{ color: C.red, border: "none" }} onClick={() => setAdminMode(false)}><LogOut size={14} />{!mob && " 로그아웃"}</Btn></div></div>
  <div style={{ maxWidth: 1280, margin: "0 auto", padding: mob ? "16px" : "24px 32px" }}>
    <div style={{ display: "flex", border: `2px solid ${C.black}`, width: "fit-content", marginBottom: 24, flexWrap: "wrap" }}>{[{ k: "dashboard", l: "대시보드", i: <BarChart3 size={14} /> }, { k: "list", l: "컬렉션 관리", i: <LayoutGrid size={14} /> }, ...(editingId !== null ? [{ k: "editor", l: editingId === "new" ? "신규 등록" : "수정", i: <Edit2 size={14} /> }] : [])].map(t => <button key={t.k} onClick={() => setTab(t.k)} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, padding: "10px 16px", cursor: "pointer", border: "none", background: tab === t.k ? C.black : C.white, color: tab === t.k ? C.white : C.textMuted, display: "flex", alignItems: "center", gap: 6 }}>{t.i} {t.l}</button>)}</div>

    {tab === "dashboard" && <div><div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>{[{ l: "전체", v: collections.length, c: C.black }, { l: "텔레카", v: collections.filter(c => c.brand === "TELECA COLLECTION CARD").length, c: C.blue }, { l: "밈", v: collections.filter(c => c.brand === "MIIM CARD").length, c: "#7C3AED" }].map((s, i) => <div key={i} style={{ border: `2px solid ${C.black}`, padding: 20, background: C.white }}><div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted }}>{s.l}</div><div style={{ fontSize: 40, fontWeight: 900, color: s.c, marginTop: 4 }}>{s.v}</div></div>)}</div><div style={sec}><h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${C.gray200}`, display: "flex", alignItems: "center", gap: 8 }}><Settings size={16} /> 메인 히어로 설정</h3><Input label="히어로 타이틀" value={heroSettings.title} onChange={v => setHeroSettings(p => ({ ...p, title: v }))} /><Input label="서브타이틀" value={heroSettings.subtitle} onChange={v => setHeroSettings(p => ({ ...p, subtitle: v }))} /><Sel label="대표 컬렉션" value={heroSettings.featuredId || ""} onChange={v => setHeroSettings(p => ({ ...p, featuredId: v || null }))} options={[{ value: "", label: "— 선택 없음 —" }, ...collections.map(c => ({ value: c.id, label: c.title }))]} /><Btn v="blue" size="sm" onClick={() => showToast("히어로 설정 저장 완료")}><Save size={14} /> 저장</Btn></div></div>}

    {tab === "list" && <div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}><h2 style={{ fontSize: 20, fontWeight: 900 }}>전체 컬렉션</h2><div style={{ display: "flex", gap: 8 }}><Btn size="sm" v="blue" onClick={() => { setEditingId("new"); setTab("editor"); }}><Plus size={14} /> 신규</Btn><Btn size="sm" onClick={exportJSON}><Download size={14} /> JSON</Btn></div></div><div style={{ border: `2px solid ${C.black}` }}>{collections.map((c, i) => <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: mob ? "10px 12px" : "12px 20px", borderBottom: i < collections.length - 1 ? `1px solid ${C.gray200}` : "none", background: C.white, gap: 8 }}><div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}><div style={{ width: 48, height: 36, flexShrink: 0, position: "relative" }}><AutoImg src={c.thumbnail} padding="4px" style={{ position: "absolute", inset: 0 }} /></div><div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div><div style={{ fontSize: 11, color: C.textMuted }}>{c.brand} · {c.date}</div></div></div><div style={{ display: "flex", gap: 4 }}><Btn size="sm" v="ghost" onClick={() => { setEditingId(c.id); setTab("editor"); }}><Edit2 size={14} /></Btn><Btn size="sm" v="ghost" onClick={() => { if (confirm("삭제?")) { setCollections(p => p.filter(x => x.id !== c.id)); showToast("삭제됨"); } }}><Trash2 size={14} /></Btn></div></div>)}</div></div>}

    {tab === "editor" && <EditorForm editingId={editingId} onDone={(msg) => { setEditingId(null); setTab("list"); if (msg) showToast(msg); }} showToast={showToast} />}
  </div></div>);
}

function EditorForm({ editingId, onDone, showToast }) {
  const { collections, setCollections } = useContext(Ctx); const { mob } = useR(); const isNew = editingId === "new";
  const existing = !isNew ? collections.find(c => c.id === editingId) : null;
  const blank = { brand: "TELECA COLLECTION CARD", title: "", description: "", productInfo: "", thumbnail: null, mainImage: null, cardsPerPack: 5, packsPerBox: 20, boxesPerCase: 12, releaseDate: "", date: "", isNew: true, status: "new", chasingCards: [], checklist: [] };
  const [fm, setFm] = useState(existing ? { ...existing } : blank); const u = (k, v) => setFm(p => ({ ...p, [k]: v }));
  const addCC = () => u("chasingCards", [...fm.chasingCards, { name: "", desc: "", ratio: "", tag: "", tagColor: "#7C3AED", code: "", image: null }]);
  const updCC = (i, k, v) => { const a = [...fm.chasingCards]; a[i] = { ...a[i], [k]: v }; u("chasingCards", a); };
  const delCC = (i) => u("chasingCards", fm.chasingCards.filter((_, idx) => idx !== i));
  const xlsxRef = useRef(null);
  const handleFile = async (file) => { try { const rows = await parseXlsx(file); u("checklist", rows); showToast(`${rows.length}건 업로드`); } catch { alert("파싱 실패"); } };
  const save = () => { if (!fm.title.trim()) { alert("타이틀 필요"); return; } const id = isNew ? fm.title.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-") + "-" + Date.now() : fm.id; if (isNew) setCollections(p => [...p, { ...fm, id }]); else setCollections(p => p.map(c => c.id === editingId ? { ...fm, id } : c)); onDone(isNew ? "등록 완료" : "수정 완료"); };
  const sec = { border: `2px solid ${C.black}`, padding: mob ? 16 : 24, background: C.white, marginBottom: 20 };
  const secH = (icon, text) => <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 16, paddingBottom: 10, borderBottom: `2px solid ${C.gray200}`, display: "flex", alignItems: "center", gap: 8 }}>{icon} {text}</h3>;

  return (<div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}><h2 style={{ fontSize: 18, fontWeight: 900 }}>{isNew ? "신규 등록" : "수정"}</h2><div style={{ display: "flex", gap: 8 }}><Btn v="ghost" size="sm" onClick={() => onDone(null)}><X size={14} /> 취소</Btn><Btn v="blue" size="sm" onClick={save}><Save size={14} /> 저장</Btn></div></div>
    <div style={sec}>{secH(<Info size={16} />, "기본 정보")}<div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 0 : 16 }}><Sel label="브랜드" value={fm.brand} onChange={v => u("brand", v)} options={[{ value: "TELECA COLLECTION CARD", label: "TELECA" }, { value: "MIIM CARD", label: "MIIM" }]} /><Sel label="상태" value={fm.status} onChange={v => { u("status", v); u("isNew", v === "new"); }} options={[{ value: "new", label: "신규" }, { value: "available", label: "판매중" }, { value: "soldout", label: "품절" }]} /></div><Input label="타이틀" value={fm.title} onChange={v => u("title", v)} /><Input label="설명" value={fm.description} onChange={v => u("description", v)} textarea rows={3} /><Input label="상세 정보" value={fm.productInfo} onChange={v => u("productInfo", v)} textarea rows={4} /></div>
    <div style={sec}>{secH(<ImageIcon size={16} />, "이미지")}<div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 16 }}><ImgUp label="썸네일" value={fm.thumbnail} onChange={v => u("thumbnail", v)} h={160} /><ImgUp label="메인 이미지" value={fm.mainImage} onChange={v => u("mainImage", v)} h={160} /></div></div>
    <div style={sec}>{secH(<Package size={16} />, "스펙")}<div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,1fr)", gap: mob ? 0 : 16 }}><Input label="팩당 카드" type="number" value={fm.cardsPerPack} onChange={v => u("cardsPerPack", parseInt(v) || 0)} /><Input label="박스당 팩" type="number" value={fm.packsPerBox} onChange={v => u("packsPerBox", parseInt(v) || 0)} /><Input label="케이스당 박스" type="number" value={fm.boxesPerCase} onChange={v => u("boxesPerCase", parseInt(v) || 0)} /></div><div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 0 : 16 }}><Input label="릴리즈" type="date" value={fm.releaseDate} onChange={v => u("releaseDate", v)} /><Input label="날짜 텍스트" value={fm.date} onChange={v => u("date", v)} placeholder="26.04" /></div></div>
    <div style={sec}>{secH(<Target size={16} />, "체이싱 카드")}{fm.chasingCards.map((cc, i) => <div key={i} style={{ border: `1px solid ${C.gray200}`, padding: mob ? 12 : 16, marginBottom: 12, background: C.pageBg, position: "relative" }}><button onClick={() => delCC(i)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={14} /></button><div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>#{i + 1}</div><div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap: mob ? 0 : 12 }}><Input label="카드명" value={cc.name} onChange={v => updCC(i, "name", v)} /><Input label="태그" value={cc.tag} onChange={v => updCC(i, "tag", v)} /><Input label="코드" value={cc.code} onChange={v => updCC(i, "code", v)} /></div><Input label="설명" value={cc.desc} onChange={v => updCC(i, "desc", v)} /><div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr auto 1fr", gap: mob ? 0 : 12, alignItems: "end" }}><Input label="확률" value={cc.ratio} onChange={v => updCC(i, "ratio", v)} /><div style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>색상</label><input type="color" value={cc.tagColor} onChange={e => updCC(i, "tagColor", e.target.value)} style={{ width: 40, height: 36, border: `2px solid ${C.black}`, cursor: "pointer", padding: 0 }} /></div><ImgUp label="이미지" value={cc.image} onChange={v => updCC(i, "image", v)} h={80} /></div></div>)}<Btn size="sm" onClick={addCC}><Plus size={14} /> 추가</Btn></div>
    <div style={sec}>{secH(<FileSpreadsheet size={16} />, "체크리스트")}<div onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.blue; }} onDragLeave={e => e.currentTarget.style.borderColor = C.textLight} onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.textLight; if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => xlsxRef.current?.click()} style={{ border: `2px dashed ${C.textLight}`, padding: 28, textAlign: "center", cursor: "pointer", background: C.gray100, marginBottom: 16 }}><Upload size={24} style={{ color: C.textMuted, margin: "0 auto 6px" }} /><div style={{ fontSize: 13, fontWeight: 700 }}>.xlsx / .csv 업로드</div></div><input ref={xlsxRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />{fm.checklist.length > 0 && <div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted }}>{fm.checklist.length}건</span><Btn size="sm" v="ghost" onClick={() => u("checklist", [])}><Trash2 size={12} /> 초기화</Btn></div><div style={{ border: `2px solid ${C.black}`, maxHeight: 260, overflowY: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ position: "sticky", top: 0, background: C.white }}>{["#", "NAME", "RARITY"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, padding: "8px 12px", borderBottom: `2px solid ${C.black}`, color: C.textMuted }}>{h}</th>)}</tr></thead><tbody>{fm.checklist.map((cl, i) => <tr key={i}><td style={{ padding: "5px 12px", borderBottom: `1px solid ${C.gray200}`, fontSize: 12, fontWeight: 700 }}>{cl.number}</td><td style={{ padding: "5px 12px", borderBottom: `1px solid ${C.gray200}`, fontSize: 12 }}>{cl.name}</td><td style={{ padding: "5px 12px", borderBottom: `1px solid ${C.gray200}`, fontSize: 12 }}>{cl.rarity}</td></tr>)}</tbody></table></div></div>}</div>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Btn v="ghost" onClick={() => onDone(null)}>Cancel</Btn><Btn v="blue" onClick={save}><Save size={14} /> 저장</Btn></div>
  </div>);
}

/* ═══════════════════════════════════════
   APP ROOT
   ═══════════════════════════════════════ */
export default function App({ initialCollections = [], initialHero = { title: 'COLLECT\nTHE LEGENDS', subtitle: 'Collect special moments of the world\'s greatest stars', featured_id: null } }) {
  const [page, setPageRaw] = useState({ view: "home" });
  const [collections, setCollections] = useState(initialCollections);
  const [heroSettings, setHeroSettings] = useState(initialHero);
  const [adminMode, setAdminMode] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const setPage = (p) => { setPageRaw(p); window.scrollTo({ top: 0, behavior: "instant" }); };

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      *{margin:0;padding:0;box-sizing:border-box}
      body{background:${C.pageBg};font-family:${F.ui}}
      ::selection{background:${C.blue};color:white}
      ::-webkit-scrollbar{width:6px;height:6px}
      ::-webkit-scrollbar-thumb{background:${C.textLight}}
      ::-webkit-scrollbar-track{background:${C.gray100}}
      [data-card]{-webkit-overflow-scrolling:touch}
      img{-webkit-backface-visibility:hidden;backface-visibility:hidden;image-rendering:auto}
      @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
      @keyframes holoShimmer{
        0%{background-position:250% 0}
        50%{background-position:-50% 0}
        100%{background-position:250% 0}
      }
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const ctxValue = { collections, setCollections, heroSettings, setHeroSettings, page, setPage, setAdminMode: (v) => { setAdminMode(v); if (!v) setAdminAuth(false); } };

  if (adminMode) {
    if (!adminAuth) return <AdminLogin onAuth={() => setAdminAuth(true)} />;
    return <Ctx.Provider value={ctxValue}><AdminPanel /></Ctx.Provider>;
  }

  return (
    <Ctx.Provider value={ctxValue}>
      <div style={{ fontFamily: F.ui, color: C.textPrimary, background: C.pageBg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Nav />
        <main style={{ flex: 1 }}>
          {page.view === "home" && <HomePage />}
          {page.view === "collection" && <CollectionPage initialBrand={page.brand} />}
          {page.view === "detail" && <DetailPage id={page.id} />}
          {page.view === "contact" && <ContactPage />}
          {page.view === "faq" && <FaqPage />}
          {page.view === "privacy" && <PrivacyPage />}
          {page.view === "terms" && <TermsPage />}
        </main>
        <Footer />
      </div>
    </Ctx.Provider>
  );
}
