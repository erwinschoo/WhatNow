// app.jsx — shell: routing, state, tab bar, install prompt, Tweaks, mount
const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "feedLayout": "tiktok",
  "cardStyle": "poster",
  "tuneStyle": "sheet",
  "quizStyle": "tap",
  "amber": ["#FF7A18", "#FFB347"],
  "reduceMotion": false
}/*EDITMODE-END*/;

const LS_KEY = 'whatnow_state_v1';
function loadState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const saved = useRefA(loadState()).current;

  const [onboarded, setOnboarded] = useStateA(saved.onboarded || false);
  const [tab, setTab] = useStateA('discover');
  const [filmId, setFilmId] = useStateA(null);
  const [tuneOpen, setTuneOpen] = useStateA(false);
  const [settingsOpen, setSettingsOpen] = useStateA(false);
  const [quizActive, setQuizActive] = useStateA(false);
  const [quizScope, setQuizScope] = useStateA('all');
  const [searchOpen, setSearchOpen] = useStateA(false);
  const [seed, setSeedState] = useStateA(saved.seed || null);
  const [watchlist, setWatchlist] = useStateA(saved.watchlist || ['eternal', 'arrival']);
  const [seen, setSeen] = useStateA(saved.seen || ['drive', 'parasite']);
  const [feelTarget, setFeelTarget] = useStateA(saved.feelTarget || { cinematography: 8, intrigue: 7, comedic: 3, emotional: 7, pace: 4 });
  const [tuneFacets, setTuneFacets] = useStateA(saved.tuneFacets || { genres: [], decades: [], cult: false });
  const [lastQuizScore, setLastQuizScore] = useStateA(saved.lastQuizScore ?? null);
  const [showInstall, setShowInstall] = useStateA(false);

  // persist
  useEffectA(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ onboarded, watchlist, seen, feelTarget, tuneFacets, lastQuizScore, seed }));
  }, [onboarded, watchlist, seen, feelTarget, tuneFacets, lastQuizScore, seed]);

  // amber theming via CSS vars
  useEffectA(() => {
    const root = document.documentElement;
    const [a, b] = t.amber || TWEAK_DEFAULTS.amber;
    root.style.setProperty('--amber1', a);
    root.style.setProperty('--amber2', b);
    root.style.setProperty('--amber', a);
  }, [t.amber]);

  // install prompt appears once, shortly after onboarding
  useEffectA(() => {
    if (!onboarded) return;
    if (saved.installDismissed) return;
    const id = setTimeout(() => setShowInstall(true), 3500);
    return () => clearTimeout(id);
  }, [onboarded]);

  const toggleWatchlist = id => setWatchlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
  const toggleSeen = id => setSeen(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const ctx = {
    t,
    tab, setTab,
    filmId, openFilm: id => { setFilmId(id); }, closeFilm: () => setFilmId(null),
    tuneOpen, openTune: () => setTuneOpen(true), closeTune: () => setTuneOpen(false),
    settingsOpen, openSettings: () => setSettingsOpen(true), closeSettings: () => setSettingsOpen(false),
    quizActive, quizScope,
    startQuiz: scope => { setQuizScope(scope || 'all'); setQuizActive(true); },
    openFilmQuiz: id => { setQuizScope(id); setQuizActive(true); },
    endQuiz: retry => { setQuizActive(false); if (retry) setTimeout(() => setQuizActive(true), 80); },
    saveQuizScore: pct => setLastQuizScore(pct),
    lastQuizScore,
    searchOpen, openSearch: () => setSearchOpen(true), closeSearch: () => setSearchOpen(false),
    seed,
    setSeed: id => { setSeedState(id); setSearchOpen(false); setTab('discover'); setFilmId(null); },
    clearSeed: () => setSeedState(null),
    watchlist, toggleWatchlist, seen, toggleSeen,
    feelTarget, setFeelTarget, tuneFacets, setTuneFacets,
    finishOnboarding: () => { setOnboarded(true); setTab('discover'); },
    resetOnboarding: () => { setSettingsOpen(false); setOnboarded(false); },
  };

  const TABS = [
    { id: 'discover', label: 'Ontdek', icon: 'discover' },
    { id: 'watchlist', label: 'Watchlist', icon: 'bookmark' },
    { id: 'quiz', label: 'Quiz', icon: 'quiz' },
    { id: 'profile', label: 'Profiel', icon: 'profile' },
  ];

  // overlays that take over the full screen (hide tab bar)
  const fullOverlay = !onboarded || filmId || quizActive || settingsOpen || searchOpen;

  const screen = (
    <div style={{ position: 'absolute', inset: 0 }} key={tab}>
      {tab === 'discover' && <Discover />}
      {tab === 'watchlist' && <Watchlist />}
      {tab === 'quiz' && <QuizHub />}
      {tab === 'profile' && <Profile />}
    </div>
  );

  return (
    <WN.Provider value={ctx}>
      <IOSDevice dark>
        <div className="wn-root" style={{ position: 'relative', height: '100%', width: '100%', background: 'var(--bg)', overflow: 'hidden', fontFamily: 'var(--sans)', color: 'var(--tx)' }}>
          {/* base tab screens */}
          <div style={{ position: 'absolute', inset: 0, animation: t.reduceMotion ? 'none' : 'wnFade .3s' }}>{screen}</div>

          {/* install toast */}
          {showInstall && !fullOverlay && tab === 'discover' && !seed && (
            <div style={{ position: 'absolute', left: 14, right: 14, top: 98, zIndex: 30, animation: 'wnFadeUp .4s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(20,20,24,0.92)', backdropFilter: 'blur(12px)', border: '1px solid var(--line2)', borderRadius: 16, padding: '12px 14px', boxShadow: '0 14px 36px rgba(0,0,0,0.5)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, var(--amber1), var(--amber2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a0e02', flexShrink: 0, boxShadow: '0 0 18px rgba(255,138,43,0.4)' }}><Icon name="play" size={20} fill="#1a0e02" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 14, color: 'var(--tx)' }}>Installeer WhatNow</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>Op je beginscherm · werkt offline</div>
                </div>
                <GlowButton size="s" onClick={() => { setShowInstall(false); }}>Installeer</GlowButton>
                <button onClick={() => { setShowInstall(false); }} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', padding: 4 }}><Icon name="close" size={18} /></button>
              </div>
            </div>
          )}

          {/* bottom tab bar */}
          {!fullOverlay && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 25, paddingBottom: 22, paddingTop: 9, background: 'linear-gradient(0deg, var(--bg) 62%, transparent)', }}>
              <div style={{ margin: '0 14px', display: 'flex', background: 'rgba(22,22,26,0.86)', backdropFilter: 'blur(16px)', border: '1px solid var(--line)', borderRadius: 20, padding: '7px 6px' }}>
                {TABS.map(tb => {
                  const on = tab === tb.id;
                  return (
                    <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 0', color: on ? 'var(--amber2)' : 'var(--tx3)', position: 'relative' }}>
                      {on && <div style={{ position: 'absolute', top: -7, width: 26, height: 3, borderRadius: 3, background: 'linear-gradient(90deg, var(--amber1), var(--amber2))' }} />}
                      <Icon name={tb.icon} size={23} fill={on ? 'currentColor' : 'none'} stroke={on ? 1.6 : 1.8} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 0.3 }}>{tb.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* overlays */}
          {filmId && <Detail id={filmId} />}
          {tuneOpen && <Tune />}
          {settingsOpen && <Settings />}
          {searchOpen && <Search />}
          {quizActive && <QuizFlow />}
          {!onboarded && <Onboarding />}
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Discover" />
        <TweakRadio label="Feed-layout" value={t.feedLayout} options={['tiktok', 'rows']} onChange={v => setTweak('feedLayout', v)} />
        <TweakSelect label="Film-kaart" value={t.cardStyle} options={['poster', 'editorial', 'minimal']} onChange={v => setTweak('cardStyle', v)} />

        <TweakSection label="Tune & Quiz" />
        <TweakRadio label="Tune-paneel" value={t.tuneStyle} options={['sheet', 'fullscreen']} onChange={v => setTweak('tuneStyle', v)} />
        <TweakRadio label="Quiz-interactie" value={t.quizStyle} options={['tap', 'swipe']} onChange={v => setTweak('quizStyle', v)} />

        <TweakSection label="Sfeer" />
        <TweakColor label="Amber-accent" value={t.amber} options={[['#FF7A18', '#FFB347'], ['#FFB347', '#FFB347'], ['#FF5E2B', '#FF9D4D'], ['#FF8A3D', '#FFD27A']]} onChange={v => setTweak('amber', v)} />
        <TweakToggle label="Beweging beperken" value={t.reduceMotion} onChange={v => setTweak('reduceMotion', v)} />
      </TweaksPanel>
    </WN.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
