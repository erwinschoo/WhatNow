/* Onboarding (taal + kijkprofiel) — geport uit screens-misc.jsx.
 * Stap 0 = taalkeuze, daarna kijkprofiel/genres/thema's. De annuleren-knop verschijnt alleen bij
 * her-onboarding (reonboard), zodat een al-ingelogde gebruiker het opnieuw instellen kan afbreken. */
import { useState } from "react";
import { useWN } from "../state/AppContext";
import { Icon, ThemeChip, GlowButton } from "../components/ui";
import { WATCH_LEVELS, ONB_GENRES, ONB_THEMES } from "../data/config";
import { LANGS } from "../i18n/dict";
import type { Tr } from "../i18n/i18n";

const STEPS = 4;

function ChipStep({ title, sub, eyebrow, items, selected, tr, onToggle }: {
  title: string; sub: string; eyebrow: string; items: string[]; selected: string[]; tr: Tr; onToggle: (v: string) => void;
}) {
  return (
    <div style={{ animation: "wnFadeUp .35s" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: 2, color: "var(--amber2)" }}>{eyebrow}</div>
      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 30, lineHeight: 1.05, color: "var(--tx)", marginTop: 12 }}>{title}</div>
      <div style={{ fontFamily: "var(--sans)", fontSize: 14.5, color: "var(--tx2)", marginTop: 10, lineHeight: 1.45 }}>{sub}</div>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 26 }}>
        {items.map((it) => <ThemeChip key={it} label={tr(it)} active={selected.includes(it)} onClick={() => onToggle(it)} />)}
      </div>
    </div>
  );
}

export function Onboarding() {
  const { finishOnboarding, lang, setLang, tr, reonboard, cancelOnboarding } = useWN();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const canNext = step === 0 ? true : step === 1 ? !!level : step === 2 ? genres.length >= 1 : themes.length >= 2;
  const eyebrow = (n: number, label: string) => `${tr("STAP")} ${n} · ${tr(label)}`;

  return (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(700px 520px at 50% -5%, rgba(255,138,43,0.14), transparent 60%), var(--bg)", display: "flex", flexDirection: "column", zIndex: 60 }}>
      <div className="wn-scroll" style={{ flex: 1, padding: "58px 22px 8px" }}>
        {reonboard && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button onClick={cancelOnboarding} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, background: "var(--surface2)", border: "1px solid var(--line2)", color: "var(--tx2)", cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 500, fontSize: 13.5 }}><Icon name="close" size={16} /> {tr("Annuleren")}</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 7, marginBottom: 30 }}>
          {Array.from({ length: STEPS }).map((_, s) => <div key={s} style={{ flex: 1, height: 5, borderRadius: 999, background: s <= step ? "linear-gradient(90deg, var(--amber1), var(--amber2))" : "var(--surface3)", transition: "background .3s" }} />)}
        </div>

        {step === 0 && (
          <div style={{ animation: "wnFadeUp .35s" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: 2, color: "var(--amber2)" }}>{eyebrow(1, "TAAL")}</div>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 30, lineHeight: 1.05, color: "var(--tx)", marginTop: 12 }}>{tr("Kies je taal")}</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 14.5, color: "var(--tx2)", marginTop: 10, lineHeight: 1.45 }}>{tr("Welke taal spreekt je het meest aan?")} {tr("Je kunt dit later wijzigen in je profiel.")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26 }}>
              {LANGS.map((l) => {
                const on = lang === l.id;
                return (
                  <button key={l.id} onClick={() => setLang(l.id)} style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", padding: 15, borderRadius: 16, cursor: "pointer", background: on ? "rgba(255,138,43,0.1)" : "var(--surface)", border: `1.5px solid ${on ? "var(--amber)" : "var(--line)"}`, transition: "all .18s" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: on ? "linear-gradient(120deg, var(--amber1), var(--amber2))" : "var(--surface2)", color: on ? "#1a0e02" : "var(--tx2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>{l.code}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 17, color: on ? "var(--amber2)" : "var(--tx)" }}>{l.native}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--tx3)", marginTop: 2 }}>{l.en}</div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${on ? "var(--amber)" : "var(--surface3)"}`, background: on ? "var(--amber)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a0e02", flexShrink: 0 }}>{on && <Icon name="check" size={14} stroke={3} />}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ animation: "wnFadeUp .35s" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: 2, color: "var(--amber2)" }}>{eyebrow(2, "KIJKPROFIEL")}</div>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 30, lineHeight: 1.05, color: "var(--tx)", marginTop: 12 }}>{tr("Hoe vaak duik je in een film?")}</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 14.5, color: "var(--tx2)", marginTop: 10, lineHeight: 1.45 }}>{tr("Zo stemmen we het ritme van je aanbevelingen af.")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 26 }}>
              {WATCH_LEVELS.map((l) => {
                const on = level === l.id;
                return (
                  <button key={l.id} onClick={() => setLevel(l.id)} style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", padding: 16, borderRadius: 16, cursor: "pointer", background: on ? "rgba(255,138,43,0.1)" : "var(--surface)", border: `1.5px solid ${on ? "var(--amber)" : "var(--line)"}`, transition: "all .18s" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 17, color: on ? "var(--amber2)" : "var(--tx)" }}>{tr(l.label)}</div>
                      <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--tx2)", marginTop: 2 }}>{tr(l.sub)}</div>
                    </div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx3)" }}>{l.films}</span>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${on ? "var(--amber)" : "var(--surface3)"}`, background: on ? "var(--amber)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a0e02", flexShrink: 0 }}>{on && <Icon name="check" size={14} stroke={3} />}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <ChipStep title={tr("Welke genres trekken je?")} sub={tr("Kies er minstens één — je kunt dit later bijstellen.")} eyebrow={eyebrow(3, "GENRES")} items={ONB_GENRES} selected={genres} tr={tr} onToggle={(v) => toggle(genres, setGenres, v)} />
        )}
        {step === 3 && (
          <ChipStep title={tr("En welke thema's raken je?")} sub={tr("Hierop bouwen we de thematische ketens. Kies er twee of meer.")} eyebrow={eyebrow(4, "THEMA'S")} items={ONB_THEMES} selected={themes} tr={tr} onToggle={(v) => toggle(themes, setThemes, v)} />
        )}
      </div>

      <div style={{ padding: "12px 22px 30px", display: "flex", gap: 12, alignItems: "center" }}>
        {step > 0 && <button onClick={() => setStep(step - 1)} style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--line)", color: "var(--tx)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="back" size={22} /></button>}
        <GlowButton size="l" full variant={canNext ? "amber" : "dark"} icon={step === STEPS - 1 ? "play" : "chevron"} onClick={() => { if (!canNext) return; if (step === STEPS - 1) finishOnboarding({ level: level!, genres, themes }); else setStep(step + 1); }} style={{ opacity: canNext ? 1 : 0.5 }}>
          {tr(step === STEPS - 1 ? "Start met ontdekken" : "Verder")}
        </GlowButton>
      </div>
    </div>
  );
}
