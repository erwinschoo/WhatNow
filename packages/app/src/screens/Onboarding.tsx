/* Onboarding-wizard. Bij de EERSTE run (firstRun) loopt alles wat nodig is om de app in te stellen
 * door één flow: taal → kijkprofiel → genres → thema's → OneDrive (optioneel) → catalogus laden.
 * Die laatste stap downloadt/cachet de catalogus en rondt de wizard af — er volgt dus géén tweede
 * splash. Bij HER-onboarding (reonboard) tonen we alleen de voorkeurstappen; de catalogus staat er
 * dan al en de annuleren-knop laat een al-ingelogde gebruiker netjes terugkeren. */
import { useEffect, useRef, useState } from "react";
import { useWN } from "../state/AppContext";
import { Icon, ThemeChip, GlowButton } from "../components/ui";
import { WATCH_LEVELS, ONB_GENRES, ONB_THEMES } from "../data/config";
import { LANGS } from "../i18n/dict";
import type { Tr } from "../i18n/i18n";
import { loadCatalog } from "../data/catalog";
import { isSyncConfigured, signIn } from "../sync/msal";
import { syncNow } from "../sync/syncEngine";

const ONEDRIVE_STEP = 4;
const LOAD_STEP = 5;

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

/* Optionele OneDrive-stap. Verbinden logt in (popup), doet een eerste sync en zet de syncEnabled-
 * vlag, zodat de app bij elke herstart stil pullt. Overslaan kan altijd via "Verder". */
function SyncStep({ tr, eyebrow, onEnabled }: { tr: Tr; eyebrow: string; onEnabled: () => void }) {
  const configured = isSyncConfigured();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const connect = async () => {
    setBusy(true); setMsg(null);
    try {
      await signIn();
      await syncNow();
      onEnabled();
      setDone(true);
      setMsg(tr("Verbonden — je profiel wordt nu bewaard op OneDrive."));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : tr("Verbinden mislukt."));
    } finally { setBusy(false); }
  };

  return (
    <div style={{ animation: "wnFadeUp .35s" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: 2, color: "var(--amber2)" }}>{eyebrow}</div>
      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 30, lineHeight: 1.05, color: "var(--tx)", marginTop: 12 }}>{tr("Bewaar je profiel veilig")}</div>
      <div style={{ fontFamily: "var(--sans)", fontSize: 14.5, color: "var(--tx2)", marginTop: 10, lineHeight: 1.45 }}>{tr("Verbind met OneDrive zodat je watchlist, voorkeuren en quizscores bewaard blijven en meereizen naar je andere apparaten. Dit is optioneel — je kunt het overslaan en later in instellingen verbinden.")}</div>

      <div style={{ background: "linear-gradient(150deg, var(--surface2), var(--surface))", border: "1px solid var(--line2)", borderRadius: 18, padding: 18, marginTop: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(80,140,255,0.14)", color: "#7eb0ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="cloud" size={26} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 16, color: "var(--tx)" }}>OneDrive</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: done ? "#7fd99a" : "var(--tx3)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: done ? "#7fd99a" : "var(--tx3)", display: "inline-block", flexShrink: 0 }} />
              {!configured ? tr("Sync niet geconfigureerd") : done ? tr("Verbonden") : tr("Niet verbonden")}
            </div>
          </div>
          {done
            ? <Icon name="check" size={24} style={{ color: "#7fd99a" }} />
            : <GlowButton size="s" variant={configured ? "amber" : "dark"} icon="cloud" onClick={() => configured && void connect()} style={{ opacity: configured ? 1 : 0.5 }}>{busy ? tr("Bezig…") : tr("Verbinden")}</GlowButton>}
        </div>
        {msg && <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--tx2)", marginTop: 14, lineHeight: 1.5 }}>{msg}</div>}
      </div>
    </div>
  );
}

/* Catalogus-laadstap: downloadt/cachet de catalogus met voortgang en rondt daarna de wizard af. */
function LoadStep({ tr, onDone }: { tr: Tr; onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    let cancelled = false;
    const real = loadCatalog(false).catch(() => {});
    const start = Date.now();
    const MIN = 2200;
    const iv = setInterval(() => {
      if (cancelled) return;
      const k = Math.min(1, (Date.now() - start) / MIN);
      setPct((1 - Math.pow(1 - k, 2)) * 100);
      if (k >= 1) {
        clearInterval(iv);
        setPct(100);
        void Promise.resolve(real).then(() => { if (!cancelled) setTimeout(() => doneRef.current(), 350); });
      }
    }, 40);
    return () => { cancelled = true; clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ animation: "wnFadeUp .35s", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 30 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--amber1), var(--amber2))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 26px rgba(255,138,43,0.45)", animation: "wnPulse 1.8s ease-in-out infinite" }}>
        <Icon name="film" size={26} stroke={2} style={{ color: "#1a0e02" }} />
      </div>
      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 24, color: "var(--tx)", marginTop: 22 }}>{pct >= 100 ? tr("Klaar om te ontdekken") : tr("Je catalogus wordt klaargezet")}</div>
      <div style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--tx2)", marginTop: 8 }}>{tr("Films & thematische ketens laden…")}</div>
      <div style={{ width: "100%", maxWidth: 320, marginTop: 28 }}>
        <div style={{ height: 5, borderRadius: 999, background: "var(--surface3)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg, var(--amber1), var(--amber2))", borderRadius: 999, boxShadow: "0 0 12px rgba(255,138,43,0.5)" }} />
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--amber2)", marginTop: 10 }}>{Math.round(pct)}%</div>
      </div>
      <style>{"@keyframes wnPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}"}</style>
    </div>
  );
}

export function Onboarding() {
  const { finishOnboarding, firstRun, lang, setLang, tr, reonboard, cancelOnboarding, setSyncEnabled, syncEnabled } = useWN();
  const extended = firstRun === true; // eerste run → OneDrive- + catalogus-laadstap erbij
  const STEPS = extended ? 6 : 4;
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const canNext = step === 0 ? true : step === 1 ? !!level : step === 2 ? genres.length >= 1 : step === 3 ? themes.length >= 2 : true;
  const eyebrow = (n: number, label: string) => `${tr("STAP")} ${n} · ${tr(label)}`;

  const isLoadStep = extended && step === LOAD_STEP;
  const isFinalButton = !extended && step === STEPS - 1; // alleen reonboard heeft een afrond-knop
  const onNext = () => {
    if (!canNext) return;
    if (isFinalButton) finishOnboarding({ level: level!, genres, themes });
    else setStep(step + 1);
  };

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
        {step === ONEDRIVE_STEP && extended && (
          <SyncStep tr={tr} eyebrow={eyebrow(5, "ONEDRIVE")} onEnabled={() => setSyncEnabled(true)} />
        )}
        {isLoadStep && (
          <LoadStep tr={tr} onDone={() => finishOnboarding({ level: level!, genres, themes })} />
        )}
      </div>

      {!isLoadStep && (
        <div style={{ padding: "12px 22px 30px", display: "flex", gap: 12, alignItems: "center" }}>
          {step > 0 && <button onClick={() => setStep(step - 1)} style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--line)", color: "var(--tx)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="back" size={22} /></button>}
          <GlowButton size="l" full variant={canNext ? "amber" : "dark"} icon={isFinalButton ? "play" : "chevron"} onClick={onNext} style={{ opacity: canNext ? 1 : 0.5 }}>
            {tr(isFinalButton ? "Start met ontdekken" : step === ONEDRIVE_STEP && !syncEnabled ? "Verder zonder sync" : "Verder")}
          </GlowButton>
        </div>
      )}
    </div>
  );
}
