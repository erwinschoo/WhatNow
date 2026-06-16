/* Watchlist & gezien — geport uit screens-misc.jsx (history-tab vervangen door echte 'gezien'). */
import { useState } from "react";
import { useWN } from "../state/AppContext";
import { Icon, Poster, Eyebrow } from "../components/ui";
import { getCatalog } from "../data/catalog";

export function Watchlist() {
  const { watchlist, seen, openFilm, tr } = useWN();
  const { byId } = getCatalog();
  const [tab, setTab] = useState<"watchlist" | "seen">("watchlist");
  const tabs = [
    { id: "watchlist" as const, label: "Watchlist", ids: watchlist },
    { id: "seen" as const, label: "Gezien", ids: seen },
  ];
  const active = tabs.find((t) => t.id === tab)!;
  const films = active.ids.map((id) => byId[id]).filter(Boolean);
  return (
    <div className="wn-scroll" style={{ position: "absolute", inset: 0, padding: "60px 18px 100px" }}>
      <Eyebrow>{tr("Jouw collectie")}</Eyebrow>
      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 27, color: "var(--tx)", lineHeight: 1, marginTop: 3, marginBottom: 18 }}>{tr("Bewaard")}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, padding: "10px 6px", borderRadius: 11, cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 600, fontSize: 13, background: tab === tb.id ? "var(--surface2)" : "transparent", border: `1px solid ${tab === tb.id ? "var(--line2)" : "transparent"}`, color: tab === tb.id ? "var(--tx)" : "var(--tx3)" }}>
            {tr(tb.label)}<span style={{ fontFamily: "var(--mono)", fontSize: 10, color: tab === tb.id ? "var(--amber2)" : "var(--tx3)", marginLeft: 5 }}>{tb.ids.length}</span>
          </button>
        ))}
      </div>
      {films.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tx3)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--tx3)" }}><Icon name="bookmark" size={28} /></div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 15, color: "var(--tx2)" }}>{tr("Nog niets hier")}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, marginTop: 6 }}>{tr("Veeg in Ontdek naar rechts om te bewaren")}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {films.map((f, i) => (
            <button key={f.id} onClick={() => openFilm(f.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", animation: `wnFadeUp .4s ${i * 0.04}s both` }}>
              <div style={{ width: "100%", aspectRatio: "2/3", borderRadius: 11, boxShadow: "0 6px 18px rgba(0,0,0,0.4)" }}><Poster film={f} rounded={11} /></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
