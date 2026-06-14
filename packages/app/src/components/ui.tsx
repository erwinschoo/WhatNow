/* Gedeelde UI-primitieven — geport uit het design (components.jsx). Inline-styles 1-op-1 behouden. */
import type { CSSProperties, ReactNode } from "react";
import type { CatalogFilm } from "../data/types";
import type { FeelDef } from "../data/config";

// ── Icons (lijn-glyphs, 24px grid, currentColor) ──────────────────────
export function Icon({ name, size = 24, stroke = 1.8, fill = "none", style }: {
  name: string; size?: number; stroke?: number; fill?: string; style?: CSSProperties;
}) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const paths: Record<string, ReactNode> = {
    discover: <><circle cx="12" cy="12" r="9" {...p} /><path d="M15.5 8.5l-2 5-5 2 2-5z" {...p} /></>,
    bookmark: <path d="M6 4h12v16l-6-4-6 4z" {...p} fill={fill} />,
    quiz: <><circle cx="12" cy="12" r="9" {...p} /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7" {...p} /><circle cx="12" cy="16.5" r=".6" fill="currentColor" stroke="none" /></>,
    profile: <><circle cx="12" cy="8.5" r="3.5" {...p} /><path d="M5.5 19a6.5 6.5 0 0 1 13 0" {...p} /></>,
    play: <path d="M8 5.5v13l11-6.5z" {...p} fill={fill} />,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    check: <path d="M5 12.5l4.5 4.5L19 7" {...p} />,
    eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...p} /><circle cx="12" cy="12" r="2.6" {...p} /></>,
    sliders: <><path d="M5 7h14M5 12h14M5 17h14" {...p} /><circle cx="9" cy="7" r="2.2" {...p} fill="var(--bg)" /><circle cx="15" cy="12" r="2.2" {...p} fill="var(--bg)" /><circle cx="8" cy="17" r="2.2" {...p} fill="var(--bg)" /></>,
    back: <path d="M15 5l-7 7 7 7" {...p} />,
    close: <path d="M6 6l12 12M18 6L6 18" {...p} />,
    heart: <path d="M12 20s-7-4.6-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7-1.3C19 11.4 12 20 12 20z" {...p} fill={fill} />,
    share: <><circle cx="6" cy="12" r="2.2" {...p} /><circle cx="17" cy="6" r="2.2" {...p} /><circle cx="17" cy="18" r="2.2" {...p} /><path d="M8 11l7-4M8 13l7 4" {...p} /></>,
    chevron: <path d="M9 6l6 6-6 6" {...p} />,
    settings: <><circle cx="12" cy="12" r="3" {...p} /><path d="M12 3v2.5M12 18.5V21M4.2 7l2.2 1.3M17.6 15.7l2.2 1.3M4.2 17l2.2-1.3M17.6 8.3l2.2-1.3" {...p} /></>,
    cloud: <path d="M7 18a4 4 0 0 1-.5-8A5 5 0 0 1 16 9.5 3.5 3.5 0 0 1 17 18z" {...p} />,
    refresh: <><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" {...p} /><path d="M20 4v4h-4" {...p} /><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" {...p} /><path d="M4 20v-4h4" {...p} /></>,
    film: <><rect x="4" y="5" width="16" height="14" rx="2" {...p} /><path d="M9 5v14M15 5v14M4 9.7h5M15 9.7h5M4 14.3h5M15 14.3h5" {...p} /></>,
    compass: <><circle cx="12" cy="12" r="9" {...p} /><path d="M15.5 8.5l-2 5-5 2 2-5z" {...p} /></>,
    moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" {...p} />,
    star: <path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.7l5.4-.8z" {...p} fill={fill} />,
    clock: <><circle cx="12" cy="12" r="8.5" {...p} /><path d="M12 7.5V12l3 2" {...p} /></>,
    heart_fill: <path d="M12 20s-7-4.6-7-9.3A3.7 3.7 0 0 1 12 8a3.7 3.7 0 0 1 7-1.3C19 11.4 12 20 12 20z" fill="currentColor" stroke="none" />,
    flame: <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.6.8-2.7 1.5-3.5.3 1 1 1.5 1.7 1.5.8 0 1.3-.8.8-2.2C11.4 6.6 12 4.5 12 3z" {...p} fill={fill} />,
    download: <><path d="M12 4v10M8 11l4 4 4-4" {...p} /><path d="M5 19h14" {...p} /></>,
    gift: <><rect x="4" y="9" width="16" height="11" rx="1.5" {...p} /><path d="M4 13h16M12 9v11" {...p} /><path d="M12 9S10.5 4.5 8 5.5 9.5 9 12 9zM12 9s1.5-4.5 4-3.5S14.5 9 12 9z" {...p} /></>,
    search: <><circle cx="11" cy="11" r="6.5" {...p} /><path d="M16 16l4 4" {...p} /></>,
    grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" {...p} /><rect x="13" y="4" width="7" height="7" rx="1.5" {...p} /><rect x="4" y="13" width="7" height="7" rx="1.5" {...p} /><rect x="13" y="13" width="7" height="7" rx="1.5" {...p} /></>,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  );
}

// ── Poster (echte TMDB-poster indien aanwezig, anders gradient-placeholder) ──
export function Poster({ film, style, rounded = 14, showText = true, badge }: {
  film: CatalogFilm; style?: CSSProperties; rounded?: number; showText?: boolean; badge?: ReactNode;
}) {
  const [a, b] = film.grad;
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", borderRadius: rounded, overflow: "hidden",
      background: `linear-gradient(150deg, ${a}, ${b})`, ...style,
    }}>
      {film.posterUrl && (
        <img src={film.posterUrl} alt="" loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      {/* film-grain + glans */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.5, mixBlendMode: "soft-light", backgroundImage: "repeating-linear-gradient(115deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 5px)" }} />
      {!film.posterUrl && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.10), transparent 55%)" }} />}
      {!film.posterUrl && (
        <div style={{ position: "absolute", right: -28, top: -28, width: 120, height: 120, borderRadius: "50%", border: `1.5px solid ${film.ink}`, opacity: 0.28 }} />
      )}
      {showText && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "14px 13px", background: "linear-gradient(0deg, rgba(0,0,0,0.66), transparent)" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: 1, color: film.ink, opacity: 0.95 }}>{film.year} · {film.dir.split(/[&,]/)[0].trim().split(" ").slice(-1)}</div>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 15.5, lineHeight: 1.06, color: "#fff", marginTop: 3 }}>{film.title}</div>
        </div>
      )}
      {!film.posterUrl && <div style={{ position: "absolute", top: 9, left: 10, fontFamily: "var(--mono)", fontSize: 8.5, letterSpacing: 1.5, color: "rgba(255,255,255,0.55)" }}>WHATNOW</div>}
      {badge}
    </div>
  );
}

// ── Score pills (IMDB / RT / Metacritic) ──────────────────────────────
export function ScorePill({ src, value, compact }: { src: "imdb" | "rt" | "mc"; value: number; compact?: boolean }) {
  const meta = {
    imdb: { tag: "IMDb", txt: "#f5c518", fmt: (v: number) => v.toFixed(1) },
    rt: { tag: "RT", txt: "#fa6f4d", fmt: (v: number) => v + "%" },
    mc: { tag: "MC", txt: "#9fd356", fmt: (v: number) => String(v) },
  }[src];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: compact ? "4px 9px" : "6px 11px", borderRadius: 999, background: "var(--surface2)", border: "1px solid var(--line)" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color: meta.txt }}>{meta.tag}</span>
      <span style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: compact ? 12 : 13.5, color: "var(--tx)" }}>{meta.fmt(value)}</span>
    </div>
  );
}

// ── Theme chip ─────────────────────────────────────────────────────────
export function ThemeChip({ label, active, onClick, size = "m" }: { label: string; active?: boolean; onClick?: () => void; size?: "s" | "m" }) {
  const pad = size === "s" ? "4px 10px" : "6px 13px";
  const fs = size === "s" ? 11 : 12.5;
  return (
    <button onClick={onClick} style={{
      padding: pad, borderRadius: 999, cursor: onClick ? "pointer" : "default",
      fontFamily: "var(--mono)", fontSize: fs, fontWeight: 500, letterSpacing: 0.2, whiteSpace: "nowrap", transition: "all .18s ease",
      background: active ? "linear-gradient(120deg, var(--amber1), var(--amber2))" : "rgba(255,255,255,0.05)",
      color: active ? "#1a0e02" : "var(--tx2)",
      border: active ? "1px solid transparent" : "1px solid var(--line)",
      boxShadow: active ? "0 4px 16px rgba(255,138,43,0.3)" : "none",
    }}>{label}</button>
  );
}

// ── Facet chip ─────────────────────────────────────────────────────────
export function FacetChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, cursor: "pointer",
      fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", transition: "all .16s ease",
      background: active ? "var(--amber)" : "var(--surface2)", color: active ? "#1a0e02" : "var(--tx2)",
      border: active ? "1px solid var(--amber)" : "1px solid var(--line)",
    }}>{label}</button>
  );
}

// ── Glow CTA button ────────────────────────────────────────────────────
export function GlowButton({ children, onClick, variant = "amber", size = "m", icon, style, full }: {
  children: ReactNode; onClick?: () => void; variant?: "amber" | "ghost" | "dark"; size?: "s" | "m" | "l"; icon?: string; style?: CSSProperties; full?: boolean;
}) {
  const sizes = { s: { p: "9px 16px", fs: 13.5 }, m: { p: "13px 20px", fs: 15 }, l: { p: "16px 22px", fs: 16 } };
  const s = sizes[size];
  const variants: Record<string, CSSProperties> = {
    amber: { background: "linear-gradient(120deg, var(--amber1), var(--amber2))", color: "#1a0e02", border: "1px solid transparent", boxShadow: "0 6px 22px rgba(255,138,43,0.34)" },
    ghost: { background: "rgba(255,255,255,0.06)", color: "var(--tx)", border: "1px solid var(--line2)", boxShadow: "none" },
    dark: { background: "var(--surface2)", color: "var(--tx)", border: "1px solid var(--line)", boxShadow: "none" },
  };
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: s.p, borderRadius: 999, cursor: "pointer", width: full ? "100%" : undefined,
      fontFamily: "var(--sans)", fontSize: s.fs, fontWeight: 600, letterSpacing: 0.1, transition: "transform .12s ease, box-shadow .2s ease", WebkitTapHighlightColor: "transparent",
      ...variants[variant], ...style,
    }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {icon && <Icon name={icon} size={size === "l" ? 20 : 18} stroke={2} />}
      {children}
    </button>
  );
}

// ── Feel slider (0–10, amber fill + glow thumb) ───────────────────────
export function FeelSlider({ feel, value, onChange }: { feel: FeelDef; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ padding: "2px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 9 }}>
        <span style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 14.5, color: "var(--tx)" }}>{feel.label}</span>
        <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13, color: "var(--amber2)" }}>{value}</span>
      </div>
      <div style={{ position: "relative", height: 24, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 5, borderRadius: 999, background: "var(--surface3)" }} />
        <div style={{ position: "absolute", left: 0, width: `${value * 10}%`, height: 5, borderRadius: 999, background: "linear-gradient(90deg, var(--amber1), var(--amber2))" }} />
        <input type="range" min={0} max={10} step={1} value={value} onChange={(e) => onChange(+e.target.value)}
          style={{ position: "absolute", left: -2, right: -2, width: "calc(100% + 4px)", margin: 0, height: 24, cursor: "pointer" }} />
        <div style={{ position: "absolute", left: `calc(${value * 10}% - 11px)`, width: 22, height: 22, borderRadius: "50%", background: "#fff", border: "3px solid var(--amber)", boxShadow: "0 0 14px rgba(255,138,43,0.55)", pointerEvents: "none" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--tx3)" }}>{feel.lo}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--tx3)" }}>{feel.hi}</span>
      </div>
    </div>
  );
}

// ── Section label (mono eyebrow) ──────────────────────────────────────
export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--tx3)", ...style }}>{children}</div>;
}

// ── Stat ring (SVG progress arc) ──────────────────────────────────────
export function StatRing({ pct, size = 116, stroke = 9, value, sub }: { pct: number; size?: number; stroke?: number; value?: ReactNode; sub?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }} />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF7A18" /><stop offset="1" stopColor="#FFB347" /></linearGradient>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 26, color: "var(--tx)", lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tx3)", marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}
