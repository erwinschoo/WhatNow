/* Profiel — stats, top-thema's, genre-verdeling en badges afgeleid uit de ECHTE data. */
import { useLiveQuery } from "dexie-react-hooks";
import { useWN } from "../state/AppContext";
import { Icon, Eyebrow, StatRing } from "../components/ui";
import { getCatalog } from "../data/catalog";
import { getState, DEFAULT_STATE } from "../db/db";
import { deriveProfile } from "../state/profile";
import { getAccount } from "../sync/msal";

export function Profile() {
  const { openSettings } = useWN();
  const state = useLiveQuery(getState, [], DEFAULT_STATE);
  const cat = getCatalog();
  const p = deriveProfile(state, cat);

  const account = getAccount();
  const name = account?.name || account?.username || "Filmkijker";
  const initials = name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "WN";

  const maxBar = Math.max(1, ...p.genreBars.map((g) => g.n));
  const topThemeMax = Math.max(1, ...p.topThemes.map((t) => t.n));

  return (
    <div className="wn-scroll" style={{ position: "absolute", inset: 0, padding: "54px 18px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <Eyebrow>Profiel</Eyebrow>
        <button onClick={openSettings} style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--line)", color: "var(--tx2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="settings" size={21} /></button>
      </div>

      <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 26 }}>
        <div style={{ position: "relative" }}>
          <StatRing pct={p.levelPct} size={104} stroke={7} value="" sub="" />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(150deg, #3a1d4d, #0b1230)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sans)", fontWeight: 700, fontSize: 26, color: "#fff" }}>{initials}</div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 22, color: "var(--tx)" }}>{name}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 10, padding: "5px 11px", borderRadius: 999, background: "rgba(255,138,43,0.12)", border: "1px solid rgba(255,138,43,0.3)" }}>
            <Icon name="flame" size={14} fill="var(--amber2)" style={{ color: "var(--amber2)" }} /><span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--amber2)" }}>{p.level} · {Math.round(p.levelPct * 100)}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 26 }}>
        {[{ v: p.stats.seen, l: "gezien" }, { v: p.stats.watchlist, l: "watchlist" }, { v: p.stats.hours + "u", l: "kijktijd" }].map((s) => (
          <div key={s.l} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 23, color: "var(--tx)", lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--tx3)", marginTop: 5 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {p.genreBars.length > 0 && (
        <>
          <Eyebrow style={{ marginBottom: 14 }}>Meest gekeken genres</Eyebrow>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 9, height: 120, padding: "0 2px", marginBottom: 26 }}>
            {p.genreBars.map((g, i) => (
              <div key={g.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx2)" }}>{g.n}</div>
                <div style={{ width: "100%", height: (g.n / maxBar) * 88, borderRadius: "6px 6px 3px 3px", background: i === 0 ? "linear-gradient(0deg, var(--amber1), var(--amber2))" : "var(--surface3)", animation: `wnGrow .6s ${i * 0.06}s both`, transformOrigin: "bottom" }} />
                <div style={{ fontFamily: "var(--mono)", fontSize: 8.5, color: "var(--tx3)", textAlign: "center" }}>{g.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {p.topThemes.length > 0 && (
        <>
          <Eyebrow style={{ marginBottom: 12 }}>Je terugkerende thema's</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26 }}>
            {p.topThemes.map((th) => (
              <div key={th.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--tx2)", width: 92, flexShrink: 0 }}>{th.label}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--surface3)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(th.n / topThemeMax) * 100}%`, background: "linear-gradient(90deg, var(--amber1), var(--amber2))", borderRadius: 999, animation: "wnFade .8s" }} />
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--amber2)", width: 20, textAlign: "right" }}>{th.n}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Eyebrow style={{ marginBottom: 12 }}>Badges</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {p.badges.map((b) => (
          <div key={b.id} style={{ background: "var(--surface)", border: `1px solid ${b.earned ? "rgba(255,138,43,0.3)" : "var(--line)"}`, borderRadius: 14, padding: "15px 8px", textAlign: "center", opacity: b.earned ? 1 : 0.4 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", background: b.earned ? "linear-gradient(120deg, var(--amber1), var(--amber2))" : "var(--surface3)", color: b.earned ? "#1a0e02" : "var(--tx3)" }}><Icon name={b.icon} size={22} fill={b.earned ? "#1a0e02" : "none"} /></div>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 11.5, color: "var(--tx)", lineHeight: 1.1 }}>{b.label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--tx3)", marginTop: 4, lineHeight: 1.2 }}>{b.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
