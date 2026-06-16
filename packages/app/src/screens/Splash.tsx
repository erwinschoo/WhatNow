/* Gebrand laadscherm — geport uit het prototype (screens-splash.jsx). Anders dan het prototype is
 * `onDone` gekoppeld aan de échte catalogus-load: de splash verdwijnt pas als zowel de gescripte
 * minimum-duur (nette animatie) áls het echte werk klaar is. */
import { useEffect, useRef, useState } from "react";
import { useWN } from "../state/AppContext";
import { loadCatalog, type BootMode } from "../data/catalog";

interface Step { msg: string; dur: number; p: [number, number]; }

const SPLASH_SCRIPTS: Record<BootMode, Step[]> = {
  fetch: [
    { msg: "Verbinden met de catalogus…", dur: 750, p: [0, 20] },
    { msg: "Films & thematische ketens laden…", dur: 1150, p: [20, 84] },
    { msg: "Aanbevelingen afstemmen op je profiel…", dur: 800, p: [84, 100] },
  ],
  update: [
    { msg: "Controleren op updates…", dur: 950, p: [0, 14] },
    { msg: "Nieuwe films downloaden…", dur: 1500, p: [14, 100] },
  ],
  check: [
    { msg: "Controleren op updates…", dur: 950, p: [0, 100] },
  ],
};

const C = 2 * Math.PI * 44;

export function Splash({ mode, onDone }: { mode: BootMode; onDone: () => void }) {
  const { tr, t } = useWN();
  const steps = SPLASH_SCRIPTS[mode] ?? SPLASH_SCRIPTS.check;
  const [pct, setPct] = useState(0);
  const [stage, setStage] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let cancelled = false;
    const totals: [number, number][] = [];
    let acc = 0;
    steps.forEach((st) => { totals.push([acc, acc + st.dur]); acc += st.dur; });
    const total = acc;
    const start = Date.now();

    // Echt werk: alleen 'update' forceert een verse versiecheck/download. 'fetch' (eerste load) en
    // 'check' gebruiken de gewone (gememoïseerde) load. De splash wacht op zowel dit als de
    // gescripte minimum-duur.
    const realWork = loadCatalog(mode === "update").catch(() => {});

    const iv = setInterval(() => {
      if (cancelled) return;
      const tNow = Date.now() - start;
      let si = steps.findIndex((_, i) => tNow < totals[i][1]);
      if (si === -1) si = steps.length - 1;
      const st = steps[si];
      const k = Math.min(1, (tNow - totals[si][0]) / st.dur);
      const e = 1 - Math.pow(1 - k, 2);
      setStage(si);
      setPct(st.p[0] + (st.p[1] - st.p[0]) * e);
      if (tNow >= total) {
        clearInterval(iv);
        setPct(100);
        setFinishing(true);
        void Promise.all([realWork]).then(() => {
          setTimeout(() => { if (!cancelled) onDoneRef.current(); }, 480);
        });
      }
    }, 40);

    return () => { cancelled = true; clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const msg = finishing && mode === "check"
    ? tr("Je catalogus is up-to-date")
    : tr(steps[Math.min(stage, steps.length - 1)].msg);

  const reduce = t.reduceMotion;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 70, background: "radial-gradient(620px 460px at 50% 34%, rgba(255,138,43,0.16), transparent 62%), var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: reduce ? "none" : "wnFade .3s", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5, mixBlendMode: "soft-light", backgroundImage: "repeating-linear-gradient(112deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 7px)" }} />

      <div style={{ position: "relative", width: 92, height: 92, marginBottom: 26 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,138,43,0.25)" }} />
        <svg width="92" height="92" viewBox="0 0 92 92" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="46" cy="46" r="44" fill="none" stroke="url(#splashGrad)" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} style={{ transition: "stroke-dashoffset .1s linear" }} />
          <defs><linearGradient id="splashGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF7A18" /><stop offset="1" stopColor="#FFB347" /></linearGradient></defs>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, var(--amber1), var(--amber2))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 26px rgba(255,138,43,0.5)", animation: reduce ? "none" : "wnPulse 1.8s ease-in-out infinite" }}>
            <svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="#1a0e02" /></svg>
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 28, letterSpacing: -0.5, color: "var(--tx)" }}>WhatNow</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: 2.5, color: "var(--amber2)", marginTop: 6 }}>FILM COMPANION</div>

      <div style={{ position: "absolute", left: 36, right: 36, bottom: 74 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--tx2)" }}>{msg}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--amber2)" }}>{Math.round(pct)}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: "var(--surface3)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg, var(--amber1), var(--amber2))", borderRadius: 999, boxShadow: "0 0 12px rgba(255,138,43,0.5)" }} />
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--tx3)", marginTop: 12, textAlign: "center" }}>{tr("{n} films · {m} thematische ketens", { n: "1.248", m: "316" })}</div>
      </div>

      <style>{"@keyframes wnPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}"}</style>
    </div>
  );
}
