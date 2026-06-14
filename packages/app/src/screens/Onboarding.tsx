/* Onboarding (kijkprofiel) — geport uit screens-misc.jsx. */
import { useState } from "react";
import { useWN } from "../state/AppContext";
import { Icon, ThemeChip, GlowButton } from "../components/ui";
import { WATCH_LEVELS, ONB_GENRES, ONB_THEMES } from "../data/config";

function ChipStep({ title, sub, eyebrow, items, selected, onToggle }: {
  title: string; sub: string; eyebrow: string; items: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div style={{ animation: "wnFadeUp .35s" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: 2, color: "var(--amber2)" }}>{eyebrow}</div>
      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 30, lineHeight: 1.05, color: "var(--tx)", marginTop: 12 }}>{title}</div>
      <div style={{ fontFamily: "var(--sans)", fontSize: 14.5, color: "var(--tx2)", marginTop: 10, lineHeight: 1.45 }}>{sub}</div>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 26 }}>
        {items.map((it) => <ThemeChip key={it} label={it} active={selected.includes(it)} onClick={() => onToggle(it)} />)}
      </div>
    </div>
  );
}

export function Onboarding() {
  const { finishOnboarding } = useWN();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const canNext = step === 0 ? !!level : step === 1 ? genres.length >= 1 : themes.length >= 2;

  return (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(700px 520px at 50% -5%, rgba(255,138,43,0.14), transparent 60%), var(--bg)", display: "flex", flexDirection: "column", zIndex: 60 }}>
      <div className="wn-scroll" style={{ flex: 1, padding: "58px 22px 8px" }}>
        <div style={{ display: "flex", gap: 7, marginBottom: 30 }}>
          {[0, 1, 2].map((s) => <div key={s} style={{ flex: 1, height: 5, borderRadius: 999, background: s <= step ? "linear-gradient(90deg, var(--amber1), var(--amber2))" : "var(--surface3)", transition: "background .3s" }} />)}
        </div>

        {step === 0 && (
          <div style={{ animation: "wnFadeUp .35s" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: 2, color: "var(--amber2)" }}>STAP 1 · KIJKPROFIEL</div>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 30, lineHeight: 1.05, color: "var(--tx)", marginTop: 12 }}>Hoe vaak duik je in een film?</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 14.5, color: "var(--tx2)", marginTop: 10, lineHeight: 1.45 }}>Zo stemmen we het ritme van je aanbevelingen af.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 26 }}>
              {WATCH_LEVELS.map((l) => {
                const on = level === l.id;
                return (
                  <button key={l.id} onClick={() => setLevel(l.id)} style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", padding: 16, borderRadius: 16, cursor: "pointer", background: on ? "rgba(255,138,43,0.1)" : "var(--surface)", border: `1.5px solid ${on ? "var(--amber)" : "var(--line)"}`, transition: "all .18s" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 17, color: on ? "var(--amber2)" : "var(--tx)" }}>{l.label}</div>
                      <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--tx2)", marginTop: 2 }}>{l.sub}</div>
                    </div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx3)" }}>{l.films}</span>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${on ? "var(--amber)" : "var(--surface3)"}`, background: on ? "var(--amber)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a0e02", flexShrink: 0 }}>{on && <Icon name="check" size={14} stroke={3} />}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <ChipStep title="Welke genres trekken je?" sub="Kies er minstens één — je kunt dit later bijstellen." eyebrow="STAP 2 · GENRES" items={ONB_GENRES} selected={genres} onToggle={(v) => toggle(genres, setGenres, v)} />
        )}
        {step === 2 && (
          <ChipStep title="En welke thema's raken je?" sub="Hierop bouwen we de thematische ketens. Kies er twee of meer." eyebrow="STAP 3 · THEMA'S" items={ONB_THEMES} selected={themes} onToggle={(v) => toggle(themes, setThemes, v)} />
        )}
      </div>

      <div style={{ padding: "12px 22px 30px", display: "flex", gap: 12, alignItems: "center" }}>
        {step > 0 && <button onClick={() => setStep(step - 1)} style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--line)", color: "var(--tx)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="back" size={22} /></button>}
        <GlowButton size="l" full variant={canNext ? "amber" : "dark"} icon={step === 2 ? "play" : "chevron"} onClick={() => { if (!canNext) return; if (step === 2) finishOnboarding({ level: level!, genres, themes }); else setStep(step + 1); }} style={{ opacity: canNext ? 1 : 0.5 }}>
          {step === 2 ? "Start met ontdekken" : "Verder"}
        </GlowButton>
      </div>
    </div>
  );
}
