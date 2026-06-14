/* Sync & instellingen — OneDrive-login + sync, kijkprofiel resetten, donatie. Geport uit
 * screens-misc.jsx en bedraad aan de echte MSAL/Graph-sync. */
import { useEffect, useState } from "react";
import { useWN } from "../state/AppContext";
import { Icon, GlowButton, Eyebrow } from "../components/ui";
import { getAccount, isSyncConfigured, signIn, signOut } from "../sync/msal";
import { lastSyncedAt, syncNow } from "../sync/syncEngine";

function relTime(iso: string | null): string {
  if (!iso) return "nog niet";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "zojuist";
  if (mins < 60) return `${mins} min geleden`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} uur geleden`;
  return `${Math.round(h / 24)} dagen geleden`;
}

function SettingsGroup({ header, rows }: { header: string; rows: { t: string; d?: string; ic: string; onClick?: () => void }[] }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Eyebrow style={{ marginBottom: 10, paddingLeft: 4 }}>{header}</Eyebrow>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
        {rows.map((r, i) => (
          <button key={r.t} onClick={r.onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "14px 15px", background: "none", border: "none", borderTop: i ? "1px solid var(--line)" : "none", cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--surface2)", color: "var(--amber2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={r.ic} size={18} /></div>
            <span style={{ flex: 1, fontFamily: "var(--sans)", fontSize: 14.5, color: "var(--tx)" }}>{r.t}</span>
            {r.d && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx3)" }}>{r.d}</span>}
            <Icon name="chevron" size={16} style={{ color: "var(--tx3)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Settings() {
  const { closeSettings, resetOnboarding } = useWN();
  const configured = isSyncConfigured();
  const [account, setAccount] = useState(() => getAccount());
  const [busy, setBusy] = useState(false);
  const [synced, setSynced] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { void lastSyncedAt().then(setSynced); }, [account]);

  const connect = async () => {
    setBusy(true); setMsg(null);
    try {
      await signIn();
      setAccount(getAccount());
      await syncNow();
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
      setMsg(out === "pulled" ? "Data opgehaald van OneDrive." : "Gesynchroniseerd.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Sync mislukt.");
    } finally { setBusy(false); }
  };

  const disconnect = async () => {
    setBusy(true);
    try { await signOut(); setAccount(null); setSynced(null); } finally { setBusy(false); }
  };

  const isConnected = !!account;

  return (
    <div className="wn-scroll" style={{ position: "absolute", inset: 0, background: "var(--bg)", zIndex: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "52px 18px 18px" }}>
        <button onClick={closeSettings} style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--line)", color: "var(--tx)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="back" size={22} /></button>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 22, color: "var(--tx)" }}>Sync & instellingen</div>
      </div>

      <div style={{ padding: "0 18px 40px" }}>
        <div style={{ background: "linear-gradient(150deg, var(--surface2), var(--surface))", border: "1px solid var(--line2)", borderRadius: 18, padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(80,140,255,0.14)", color: "#7eb0ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="cloud" size={26} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 16, color: "var(--tx)" }}>OneDrive</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: isConnected ? "#7fd99a" : "var(--tx3)", marginTop: 3, display: "flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: isConnected ? "#7fd99a" : "var(--tx3)", display: "inline-block", flexShrink: 0 }} />
                {!configured ? "Sync niet geconfigureerd" : isConnected ? `Verbonden · ${account?.username ?? ""}` : "Niet verbonden"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--tx3)" }}>Laatste sync · {relTime(synced)}</div>
            {isConnected
              ? <GlowButton size="s" variant="ghost" icon="refresh" onClick={() => void sync()}>{busy ? "Bezig…" : "Nu syncen"}</GlowButton>
              : <GlowButton size="s" variant={configured ? "amber" : "dark"} icon="cloud" onClick={() => configured && void connect()} style={{ opacity: configured ? 1 : 0.5 }}>{busy ? "Bezig…" : "Verbinden"}</GlowButton>}
          </div>
          {msg && <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--tx2)", marginTop: 12 }}>{msg}</div>}
        </div>

        <SettingsGroup header="App" rows={[
          { t: "Kijkprofiel opnieuw instellen", ic: "refresh", onClick: resetOnboarding },
          ...(isConnected ? [{ t: "OneDrive ontkoppelen", ic: "close", onClick: () => void disconnect() }] : []),
          { t: "Over WhatNow", d: "v1.0", ic: "film" },
        ]} />

        <div style={{ background: "rgba(255,138,43,0.07)", border: "1px solid rgba(255,138,43,0.25)", borderRadius: 18, padding: 18, marginTop: 18, textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(120deg, var(--amber1), var(--amber2))", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a0e02", margin: "0 auto 12px" }}><Icon name="gift" size={24} /></div>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 17, color: "var(--tx)" }}>Steun WhatNow</div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--tx2)", marginTop: 6, lineHeight: 1.45 }}>WhatNow is gratis, onafhankelijk en advertentievrij. Een kleine donatie houdt de aanbevelingen scherp.</div>
          <div style={{ marginTop: 16 }}><GlowButton size="m" icon="heart">Doneer een koffie</GlowButton></div>
        </div>

        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tx3)", textAlign: "center", marginTop: 22, lineHeight: 1.5 }}>
          Filmdata via TMDB & OMDb. Dit product gebruikt de TMDB-API maar is niet door TMDB onderschreven of gecertificeerd.
        </div>
      </div>
    </div>
  );
}
