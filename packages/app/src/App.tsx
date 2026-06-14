/* App-shell: tab-routing, overlays, install-toast en de bottom tab bar — geport uit app.jsx
 * (zonder iOS-frame en Tweaks-panel uit het prototype). */
import { useEffect, useState } from "react";
import { useWN } from "./state/AppContext";
import { Icon, GlowButton } from "./components/ui";
import { Discover } from "./screens/Discover";
import { Detail, Tune } from "./screens/Detail";
import { QuizHub, QuizFlow } from "./screens/Quiz";
import { Search } from "./screens/Search";
import { Onboarding } from "./screens/Onboarding";
import { Watchlist } from "./screens/Watchlist";
import { Profile } from "./screens/Profile";
import { Settings } from "./screens/Settings";
import { canInstall, onInstallAvailability, promptInstall } from "./pwa/install";

const TABS = [
  { id: "discover", label: "Ontdek", icon: "discover" },
  { id: "watchlist", label: "Watchlist", icon: "bookmark" },
  { id: "quiz", label: "Quiz", icon: "quiz" },
  { id: "profile", label: "Profiel", icon: "profile" },
] as const;

export default function App() {
  const ctx = useWN();
  const { t, tab, setTab, onboarded, filmId, quizActive, settingsOpen, searchOpen, tuneOpen, seed } = ctx;
  const [installAvail, setInstallAvail] = useState(canInstall());
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => onInstallAvailability(setInstallAvail), []);
  useEffect(() => {
    if (!onboarded || !installAvail) { setShowInstall(false); return; }
    const id = setTimeout(() => setShowInstall(true), 3500);
    return () => clearTimeout(id);
  }, [onboarded, installAvail]);

  const fullOverlay = !onboarded || !!filmId || quizActive || settingsOpen || searchOpen;

  return (
    <div className="wn-shell">
      <div className="wn-root">
        <div style={{ position: "absolute", inset: 0, animation: t.reduceMotion ? "none" : "wnFade .3s" }} key={tab}>
          {tab === "discover" && <Discover />}
          {tab === "watchlist" && <Watchlist />}
          {tab === "quiz" && <QuizHub />}
          {tab === "profile" && <Profile />}
        </div>

        {showInstall && !fullOverlay && tab === "discover" && !seed && (
          <div style={{ position: "absolute", left: 14, right: 14, top: 98, zIndex: 30, animation: "wnFadeUp .4s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(20,20,24,0.92)", backdropFilter: "blur(12px)", border: "1px solid var(--line2)", borderRadius: 16, padding: "12px 14px", boxShadow: "0 14px 36px rgba(0,0,0,0.5)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg, var(--amber1), var(--amber2))", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a0e02", flexShrink: 0, boxShadow: "0 0 18px rgba(255,138,43,0.4)" }}><Icon name="play" size={20} fill="#1a0e02" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 14, color: "var(--tx)" }}>Installeer WhatNow</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)", marginTop: 2 }}>Op je beginscherm · werkt offline</div>
              </div>
              <GlowButton size="s" onClick={() => { void promptInstall(); setShowInstall(false); }}>Installeer</GlowButton>
              <button onClick={() => setShowInstall(false)} style={{ background: "none", border: "none", color: "var(--tx3)", cursor: "pointer", padding: 4 }}><Icon name="close" size={18} /></button>
            </div>
          </div>
        )}

        {!fullOverlay && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 25, paddingBottom: 22, paddingTop: 9, background: "linear-gradient(0deg, var(--bg) 62%, transparent)" }}>
            <div style={{ margin: "0 14px", display: "flex", background: "rgba(22,22,26,0.86)", backdropFilter: "blur(16px)", border: "1px solid var(--line)", borderRadius: 20, padding: "7px 6px" }}>
              {TABS.map((tb) => {
                const on = tab === tb.id;
                return (
                  <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0", color: on ? "var(--amber2)" : "var(--tx3)", position: "relative" }}>
                    {on && <div style={{ position: "absolute", top: -7, width: 26, height: 3, borderRadius: 3, background: "linear-gradient(90deg, var(--amber1), var(--amber2))" }} />}
                    <Icon name={tb.icon} size={23} fill={on ? "currentColor" : "none"} stroke={on ? 1.6 : 1.8} />
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: 0.3 }}>{tb.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {filmId && <Detail id={filmId} />}
        {tuneOpen && <Tune />}
        {settingsOpen && <Settings />}
        {searchOpen && <Search />}
        {quizActive && <QuizFlow />}
        {!onboarded && <Onboarding />}
      </div>
    </div>
  );
}
