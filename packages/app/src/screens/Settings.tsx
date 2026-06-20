/* Sync & instellingen — OneDrive-login + sync, kijkprofiel resetten, donatie. Geport uit
 * screens-misc.jsx en bedraad aan de echte MSAL/Graph-sync. */
import { useEffect, useState } from "react";
import { useWN } from "../state/AppContext";
import { Icon, GlowButton, Eyebrow } from "../components/ui";
import { getAccount, isSyncConfigured, signIn, signOut } from "../sync/msal";
import { lastSyncedAt, syncNow } from "../sync/syncEngine";
import { LANGS } from "../i18n/dict";
import type { Tr } from "../i18n/i18n";

function relTime(iso: string | null): string {
  if (!iso) return "nog niet";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "zojuist";
  if (mins < 60) return `${mins} min geleden`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} uur geleden`;
  return `${Math.round(h / 24)} dagen geleden`;
}

function SettingsGroup({ header, rows, tr }: { header: string; rows: { t: string; d?: string; ic: string; onClick?: () => void }[]; tr: Tr }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Eyebrow style={{ marginBottom: 10, paddingLeft: 4 }}>{tr(header)}</Eyebrow>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
        {rows.map((r, i) => (
          <button key={r.t} onClick={r.onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "14px 15px", background: "none", border: "none", borderTop: i ? "1px solid var(--line)" : "none", cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--surface2)", color: "var(--amber2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={r.ic} size={18} /></div>
            <span style={{ flex: 1, fontFamily: "var(--sans)", fontSize: 14.5, color: "var(--tx)" }}>{tr(r.t)}</span>
            {r.d && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx3)" }}>{tr(r.d)}</span>}
            <Icon name="chevron" size={16} style={{ color: "var(--tx3)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Settings() {
  const { closeSettings, resetOnboarding, lang, setLang, tr, checkUpdates, setSyncEnabled } = useWN();
  const configured = isSyncConfigured();
  const [account, setAccount] = useState(() => getAccount());
  const [busy, setBusy] = useState(false);
  const [synced, setSynced] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const activeLang = LANGS.find((l) => l.id === lang) ?? LANGS[0];

  useEffect(() => { void lastSyncedAt().then(setSynced); }, [account]);

  const connect = async () => {
    setBusy(true); setMsg(null);
    try {
      await signIn();
      setAccount(getAccount());
      await syncNow();
      setSyncEnabled(true); // → stille pull bij volgende herstart
      setSynced(await lastSyncedAt());
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Verbinden mislukt.");
    } finally { setBusy(false); }
  };

  const sync = async () => {
    setBusy(true); setMsg(null);
    try {
      const out = await syncNow();
      setSynced(await lastSyncedAt());
      setMsg(out === "pulled" ? "Data opgehaald van OneDrive."
        : out === "merged" ? "Samengevoegd met je andere apparaten."
        : out === "noop" ? "Alles is al up-to-date."
        : "Gesynchroniseerd.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Sync mislukt.");
    } finally { setBusy(false); }
  };

  const disconnect = async () => {
    setBusy(true);
    try { await signOut(); setSyncEnabled(false); setAccount(null); setSynced(null); } finally { setBusy(false); }
  };

  const isConnected = !!account;

  return (
    <div className="wn-scroll" style={{ position: "absolute", inset: 0, background: "var(--bg)", zIndex: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "52px 18px 18px" }}>
        <button onClick={closeSettings} style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--line)", color: "var(--tx)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="back" size={22} /></button>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 22, color: "var(--tx)" }}>{tr("Sync & instellingen")}</div>
      </div>

      <div style={{ padding: "0 18px 40px" }}>
        <div style={{ background: "linear-gradient(150deg, var(--surface2), var(--surface))", border: "1px solid var(--line2)", borderRadius: 18, padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(80,140,255,0.14)", color: "#7eb0ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="cloud" size={26} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 16, color: "var(--tx)" }}>OneDrive</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: isConnected ? "#7fd99a" : "var(--tx3)", marginTop: 3, display: "flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: isConnected ? "#7fd99a" : "var(--tx3)", display: "inline-block", flexShrink: 0 }} />
                {!configured ? "Sync niet geconfigureerd" : isConnected ? `${tr("Verbonden")} · ${account?.username ?? ""}` : tr("Niet verbonden")}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--tx3)" }}>Laatste sync · {relTime(synced)}</div>
            {isConnected
              ? <GlowButton size="s" variant="ghost" icon="refresh" onClick={() => void sync()}>{busy ? "Bezig…" : tr("Nu syncen")}</GlowButton>
              : <GlowButton size="s" variant={configured ? "amber" : "dark"} icon="cloud" onClick={() => configured && void connect()} style={{ opacity: configured ? 1 : 0.5 }}>{busy ? "Bezig…" : tr("Verbinden")}</GlowButton>}
          </div>
          {msg && <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--tx2)", marginTop: 12 }}>{msg}</div>}
        </div>

        {/* Taalkiezer (inklapbare pill) */}
        <Eyebrow style={{ marginBottom: 10, paddingLeft: 4 }}>{tr("Taal")}</Eyebrow>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", marginBottom: 18 }}>
          <button onClick={() => setLangOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "14px 15px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--surface2)", color: "var(--amber2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="compass" size={18} /></div>
            <span style={{ flex: 1, fontFamily: "var(--sans)", fontSize: 14.5, color: "var(--tx)" }}>{tr("Taal")}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 7px 5px 12px", borderRadius: 999, background: "var(--surface2)", border: "1px solid var(--line2)" }}>
              <span style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 13, color: "var(--tx)" }}>{activeLang.native}</span>
              <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 9, color: "#1a0e02", background: "linear-gradient(120deg,var(--amber1),var(--amber2))", borderRadius: 6, padding: "2px 5px" }}>{activeLang.code}</span>
            </span>
            <Icon name="chevron" size={16} style={{ color: "var(--tx3)", transform: langOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
          </button>
          {langOpen && LANGS.map((l) => {
            const on = lang === l.id;
            return (
              <button key={l.id} onClick={() => { setLang(l.id); setLangOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "12px 15px", background: on ? "rgba(255,138,43,0.07)" : "none", border: "none", borderTop: "1px solid var(--line)", cursor: "pointer", textAlign: "left", animation: "wnFadeUp .2s both" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: on ? "linear-gradient(120deg, var(--amber1), var(--amber2))" : "var(--surface2)", color: on ? "#1a0e02" : "var(--tx2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 10.5, flexShrink: 0 }}>{l.code}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 14.5, color: on ? "var(--amber2)" : "var(--tx)" }}>{l.native}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)", marginLeft: 7 }}>{l.en}</span>
                </div>
                {on && <Icon name="check" size={18} style={{ color: "var(--amber2)" }} />}
              </button>
            );
          })}
        </div>

        <SettingsGroup tr={tr} header="App" rows={[
          { t: "Controleer op updates", ic: "download", onClick: checkUpdates },
          { t: "Kijkprofiel opnieuw instellen", ic: "refresh", onClick: resetOnboarding },
          ...(isConnected ? [{ t: "OneDrive ontkoppelen", ic: "close", onClick: () => void disconnect() }] : []),
          { t: "Over WhatNow", d: "v1.0", ic: "film" },
        ]} />

        <div style={{ background: "rgba(255,138,43,0.07)", border: "1px solid rgba(255,138,43,0.25)", borderRadius: 18, padding: 18, marginTop: 18, textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(120deg, var(--amber1), var(--amber2))", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a0e02", margin: "0 auto 12px" }}><Icon name="gift" size={24} /></div>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 17, color: "var(--tx)" }}>{tr("Steun WhatNow")}</div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--tx2)", marginTop: 6, lineHeight: 1.45 }}>{tr("WhatNow is onafhankelijk en advertentievrij. Een kleine donatie houdt de aanbevelingen scherp.")}</div>
          <div style={{ marginTop: 16 }}><GlowButton size="m" icon="heart">{tr("Doneer een koffie")}</GlowButton></div>
        </div>

        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tx3)", textAlign: "center", marginTop: 22, lineHeight: 1.5 }}>
          Filmdata via TMDB & OMDb. Dit product gebruikt de TMDB-API maar is niet door TMDB onderschreven of gecertificeerd.
        </div>
      </div>
    </div>
  );
}
