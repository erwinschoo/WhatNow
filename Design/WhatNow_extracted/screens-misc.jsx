// screens-misc.jsx — Onboarding, Watchlist & history, Profile, Settings
const { useState: useStateM } = React;

// ── Onboarding (kijkprofiel) ─────────────────────────────────────────
function Onboarding() {
  const { finishOnboarding } = useWN();
  const [step, setStep] = useStateM(0);
  const [level, setLevel] = useStateM(null);
  const [genres, setGenres] = useStateM([]);
  const [themes, setThemes] = useStateM([]);
  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const canNext = step === 0 ? !!level : step === 1 ? genres.length >= 1 : themes.length >= 2;

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(700px 520px at 50% -5%, rgba(255,138,43,0.14), transparent 60%), var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div className="wn-scroll" style={{ flex: 1, padding: '58px 22px 8px' }}>
        {/* progress */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 30 }}>
          {[0, 1, 2].map(s => <div key={s} style={{ flex: 1, height: 5, borderRadius: 999, background: s <= step ? 'linear-gradient(90deg, var(--amber1), var(--amber2))' : 'var(--surface3)', transition: 'background .3s' }} />)}
        </div>

        {step === 0 && (
          <div style={{ animation: 'wnFadeUp .35s' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: 2, color: 'var(--amber2)' }}>STAP 1 · KIJKPROFIEL</div>
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 30, lineHeight: 1.05, color: 'var(--tx)', marginTop: 12, textWrap: 'balance' }}>Hoe vaak duik je in een film?</div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 14.5, color: 'var(--tx2)', marginTop: 10, lineHeight: 1.45 }}>Zo stemmen we het ritme van je aanbevelingen af.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 26 }}>
              {WATCH_LEVELS.map(l => {
                const on = level === l.id;
                return (
                  <button key={l.id} onClick={() => setLevel(l.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', padding: 16, borderRadius: 16, cursor: 'pointer', background: on ? 'rgba(255,138,43,0.1)' : 'var(--surface)', border: `1.5px solid ${on ? 'var(--amber)' : 'var(--line)'}`, transition: 'all .18s' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 17, color: on ? 'var(--amber2)' : 'var(--tx)' }}>{l.label}</div>
                      <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--tx2)', marginTop: 2 }}>{l.sub}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx3)' }}>{l.films}</span>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${on ? 'var(--amber)' : 'var(--surface3)'}`, background: on ? 'var(--amber)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a0e02', flexShrink: 0 }}>{on && <Icon name="check" size={14} stroke={3} />}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <ChipStep title="Welke genres trekken je?" sub="Kies er minstens één — je kunt dit later bijstellen." eyebrow="STAP 2 · GENRES" items={ONB_GENRES} selected={genres} onToggle={v => toggle(genres, setGenres, v)} />
        )}
        {step === 2 && (
          <ChipStep title="En welke thema's raken je?" sub="Hierop bouwen we de thematische ketens. Kies er twee of meer." eyebrow="STAP 3 · THEMA'S" items={ONB_THEMES} selected={themes} onToggle={v => toggle(themes, setThemes, v)} />
        )}
      </div>

      <div style={{ padding: '12px 22px 30px', display: 'flex', gap: 12, alignItems: 'center' }}>
        {step > 0 && <button onClick={() => setStep(step - 1)} style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--line)', color: 'var(--tx)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Icon name="back" size={22} /></button>}
        <GlowButton size="l" full variant={canNext ? 'amber' : 'dark'} icon={step === 2 ? 'play' : 'chevron'} onClick={() => { if (!canNext) return; step === 2 ? finishOnboarding({ level, genres, themes }) : setStep(step + 1); }} style={{ opacity: canNext ? 1 : 0.5 }}>
          {step === 2 ? 'Start met ontdekken' : 'Verder'}
        </GlowButton>
      </div>
    </div>
  );
}

function ChipStep({ title, sub, eyebrow, items, selected, onToggle }) {
  return (
    <div style={{ animation: 'wnFadeUp .35s' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: 2, color: 'var(--amber2)' }}>{eyebrow}</div>
      <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 30, lineHeight: 1.05, color: 'var(--tx)', marginTop: 12, textWrap: 'balance' }}>{title}</div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 14.5, color: 'var(--tx2)', marginTop: 10, lineHeight: 1.45 }}>{sub}</div>
      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 26 }}>
        {items.map(it => <ThemeChip key={it} label={it} active={selected.includes(it)} onClick={() => onToggle(it)} />)}
      </div>
    </div>
  );
}

// ── Watchlist & history ──────────────────────────────────────────────
function Watchlist() {
  const { watchlist, seen, openFilm } = useWN();
  const [tab, setTab] = useStateM('watchlist');
  const tabs = [
    { id: 'watchlist', label: 'Watchlist', ids: watchlist },
    { id: 'seen', label: 'Gezien', ids: seen },
    { id: 'history', label: 'Geschiedenis', ids: ['drive', 'parasite', 'her', 'ncfom', 'arrival'].filter(x => !watchlist.includes(x)) },
  ];
  const active = tabs.find(t => t.id === tab);
  const films = active.ids.map(id => FILM_BY_ID[id]).filter(Boolean);
  return (
    <div className="wn-scroll" style={{ position: 'absolute', inset: 0, padding: '60px 18px 100px' }}>
      <Eyebrow>Jouw collectie</Eyebrow>
      <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 27, color: 'var(--tx)', lineHeight: 1, marginTop: 3, marginBottom: 18 }}>Bewaard</div>
      {/* tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, padding: '10px 6px', borderRadius: 11, cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 13, background: tab === tb.id ? 'var(--surface2)' : 'transparent', border: `1px solid ${tab === tb.id ? 'var(--line2)' : 'transparent'}`, color: tab === tb.id ? 'var(--tx)' : 'var(--tx3)' }}>
            {tb.label}<span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: tab === tb.id ? 'var(--amber2)' : 'var(--tx3)', marginLeft: 5 }}>{tb.ids.length}</span>
          </button>
        ))}
      </div>
      {films.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--tx3)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--tx3)' }}><Icon name="bookmark" size={28} /></div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--tx2)' }}>Nog niets hier</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, marginTop: 6 }}>Veeg in Ontdek naar rechts om te bewaren</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {films.map((f, i) => (
            <button key={f.id} onClick={() => openFilm(f.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', animation: `wnFadeUp .4s ${i * 0.04}s both` }}>
              <div style={{ width: '100%', aspectRatio: '2/3', borderRadius: 11, boxShadow: '0 6px 18px rgba(0,0,0,0.4)' }}><Poster film={f} rounded={11} /></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profile ──────────────────────────────────────────────────────────
function Profile() {
  const { openSettings, watchlist, seen } = useWN();
  const p = PROFILE;
  const maxBar = Math.max(...p.genreBars.map(g => g.n));
  return (
    <div className="wn-scroll" style={{ position: 'absolute', inset: 0, padding: '54px 18px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <Eyebrow>Profiel</Eyebrow>
        <button onClick={openSettings} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--line)', color: 'var(--tx2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="settings" size={21} /></button>
      </div>

      {/* identity + level ring */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 26 }}>
        <div style={{ position: 'relative' }}>
          <StatRing pct={p.levelPct} size={104} stroke={7} value="" sub="" />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(150deg, #3a1d4d, #0b1230)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 26, color: '#fff' }}>MD</div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 22, color: 'var(--tx)' }}>{p.name}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>{p.handle}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 10, padding: '5px 11px', borderRadius: 999, background: 'rgba(255,138,43,0.12)', border: '1px solid rgba(255,138,43,0.3)' }}>
            <Icon name="flame" size={14} fill="var(--amber2)" style={{ color: 'var(--amber2)' }} /><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber2)' }}>{p.level} · {Math.round(p.levelPct * 100)}%</span>
          </div>
        </div>
      </div>

      {/* stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 26 }}>
        {[{ v: seen.length + p.stats.seen, l: 'gezien' }, { v: watchlist.length || p.stats.watchlist, l: 'watchlist' }, { v: p.stats.hours + 'u', l: 'kijktijd' }].map(s => (
          <div key={s.l} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 23, color: 'var(--tx)', lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--tx3)', marginTop: 5 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* genre bar chart */}
      <Eyebrow style={{ marginBottom: 14 }}>Meest gekeken genres</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height: 120, padding: '0 2px', marginBottom: 26 }}>
        {p.genreBars.map((g, i) => (
          <div key={g.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--tx2)' }}>{g.n}</div>
            <div style={{ width: '100%', height: (g.n / maxBar) * 88, borderRadius: '6px 6px 3px 3px', background: i === 0 ? 'linear-gradient(0deg, var(--amber1), var(--amber2))' : 'var(--surface3)', animation: `wnGrow .6s ${i * 0.06}s both`, transformOrigin: 'bottom' }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--tx3)', writingMode: 'horizontal-tb', textAlign: 'center' }}>{g.label}</div>
          </div>
        ))}
      </div>

      {/* top themes */}
      <Eyebrow style={{ marginBottom: 12 }}>Je terugkerende thema's</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 26 }}>
        {p.topThemes.map(th => (
          <div key={th.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--tx2)', width: 92, flexShrink: 0 }}>{th.label}</span>
            <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--surface3)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(th.n / p.topThemes[0].n) * 100}%`, background: 'linear-gradient(90deg, var(--amber1), var(--amber2))', borderRadius: 999, animation: 'wnFade .8s' }} />
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber2)', width: 20, textAlign: 'right' }}>{th.n}</span>
          </div>
        ))}
      </div>

      {/* badges */}
      <Eyebrow style={{ marginBottom: 12 }}>Badges</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {BADGES.map(b => (
          <div key={b.id} style={{ background: 'var(--surface)', border: `1px solid ${b.earned ? 'rgba(255,138,43,0.3)' : 'var(--line)'}`, borderRadius: 14, padding: '15px 8px', textAlign: 'center', opacity: b.earned ? 1 : 0.4 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: b.earned ? 'linear-gradient(120deg, var(--amber1), var(--amber2))' : 'var(--surface3)', color: b.earned ? '#1a0e02' : 'var(--tx3)' }}><Icon name={b.icon} size={22} fill={b.earned ? '#1a0e02' : 'none'} /></div>
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 11.5, color: 'var(--tx)', lineHeight: 1.1 }}>{b.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--tx3)', marginTop: 4, lineHeight: 1.2 }}>{b.sub}</div>
          </div>
        ))}
      </div>
      <style>{`@keyframes wnGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}`}</style>
    </div>
  );
}

// ── Settings / sync ──────────────────────────────────────────────────
function Settings() {
  const { closeSettings, resetOnboarding } = useWN();
  const [synced, setSynced] = useStateM(true);
  return (
    <div className="wn-scroll" style={{ position: 'absolute', inset: 0, background: 'var(--bg)', zIndex: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 18px 18px' }}>
        <button onClick={closeSettings} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--line)', color: 'var(--tx)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="back" size={22} /></button>
        <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 22, color: 'var(--tx)' }}>Sync & instellingen</div>
      </div>

      <div style={{ padding: '0 18px 40px' }}>
        {/* OneDrive sync card */}
        <div style={{ background: 'linear-gradient(150deg, var(--surface2), var(--surface))', border: '1px solid var(--line2)', borderRadius: 18, padding: 18, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(80,140,255,0.14)', color: '#7eb0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="cloud" size={26} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 16, color: 'var(--tx)' }}>OneDrive</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: synced ? '#7fd99a' : 'var(--tx3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: synced ? '#7fd99a' : 'var(--tx3)', display: 'inline-block' }} />
                {synced ? 'Verbonden · mara@outlook.com' : 'Niet verbonden'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--tx3)' }}>Laatste sync · 2 min geleden</div>
            <GlowButton size="s" variant="ghost" icon="refresh" onClick={() => setSynced(s => !s)}>{synced ? 'Nu syncen' : 'Verbinden'}</GlowButton>
          </div>
        </div>

        <SettingsGroup header="Sync" rows={[
          { t: 'Watchlist & geschiedenis', d: 'Aan', ic: 'bookmark' },
          { t: 'Quiz-scores & badges', d: 'Aan', ic: 'star' },
          { t: 'Feel-voorkeuren', d: 'Aan', ic: 'sliders' },
        ]} />

        <SettingsGroup header="App" rows={[
          { t: 'Kijkprofiel opnieuw instellen', ic: 'refresh', onClick: resetOnboarding },
          { t: 'Meldingen', d: 'Wekelijks', ic: 'flame' },
          { t: 'Over WhatNow', d: 'v1.0', ic: 'film' },
        ]} />

        {/* install + support */}
        <div style={{ background: 'rgba(255,138,43,0.07)', border: '1px solid rgba(255,138,43,0.25)', borderRadius: 18, padding: 18, marginTop: 18, textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(120deg, var(--amber1), var(--amber2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a0e02', margin: '0 auto 12px' }}><Icon name="gift" size={24} /></div>
          <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 17, color: 'var(--tx)' }}>Steun WhatNow</div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--tx2)', marginTop: 6, lineHeight: 1.45 }}>WhatNow is onafhankelijk en advertentievrij. Een kleine donatie houdt de aanbevelingen scherp.</div>
          <div style={{ marginTop: 16 }}><GlowButton size="m" icon="heart">Doneer een koffie</GlowButton></div>
        </div>
      </div>
    </div>
  );
}

function SettingsGroup({ header, rows }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Eyebrow style={{ marginBottom: 10, paddingLeft: 4 }}>{header}</Eyebrow>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <button key={r.t} onClick={r.onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 15px', background: 'none', border: 'none', borderTop: i ? '1px solid var(--line)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface2)', color: 'var(--amber2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={r.ic} size={18} /></div>
            <span style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: 14.5, color: 'var(--tx)' }}>{r.t}</span>
            {r.d && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx3)' }}>{r.d}</span>}
            <Icon name="chevron" size={16} style={{ color: 'var(--tx3)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Onboarding, Watchlist, Profile, Settings });
