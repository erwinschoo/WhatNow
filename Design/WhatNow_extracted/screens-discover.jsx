// screens-discover.jsx — Discover feed (TikTok + rows variants), film tiles, Tune sheet
const { useState: useStateD, useRef: useRefD, useEffect: useEffectD } = React;

// ── Reusable film tile (respects cardStyle tweak) ────────────────────
function FilmTile({ film, onClick, w = 132, style = 'poster' }) {
  const seen = false;
  if (style === 'minimal') {
    return (
      <button onClick={onClick} style={{ width: w, textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', padding: 0, flexShrink: 0 }}>
        <div style={{ width: w, height: w * 1.5 }}><Poster film={film} showText={false} rounded={12} /></div>
        <div style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 13, color: 'var(--tx)', marginTop: 8, lineHeight: 1.15 }}>{film.title}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>{film.year}</div>
      </button>
    );
  }
  if (style === 'editorial') {
    return (
      <button onClick={onClick} style={{ width: w * 1.6, display: 'flex', gap: 11, textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 9, flexShrink: 0 }}>
        <div style={{ width: 52, height: 78, flexShrink: 0 }}><Poster film={film} showText={false} rounded={9} /></div>
        <div style={{ minWidth: 0, paddingTop: 2 }}>
          <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13.5, color: 'var(--tx)', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{film.title}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--tx3)', marginTop: 3 }}>{film.year} · {film.runtime}m</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            {film.themes.slice(0, 2).map(t => <span key={t} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--amber2)', background: 'rgba(255,138,43,0.1)', padding: '2px 6px', borderRadius: 5 }}>{t}</span>)}
          </div>
        </div>
      </button>
    );
  }
  // poster (default) — artwork with embedded title
  return (
    <button onClick={onClick} style={{ width: w, cursor: 'pointer', background: 'none', border: 'none', padding: 0, flexShrink: 0 }}>
      <div style={{ width: w, height: w * 1.5, boxShadow: '0 8px 22px rgba(0,0,0,0.4)', borderRadius: 13 }}><Poster film={film} rounded={13} /></div>
      <div style={{ display: 'flex', gap: 5, marginTop: 8, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#f5c518' }}>★ {film.scores.imdb.toFixed(1)}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--tx3)' }}>{film.genres[0]}</span>
      </div>
    </button>
  );
}

// ── A single full-screen feed slide with swipe-right-to-watchlist ────
function FeedSlide({ film, onOpen, onWatchlist, inList, motion, whyText }) {
  const [dx, setDx] = useStateD(0);
  const [flash, setFlash] = useStateD(false);
  const start = useRefD(null);

  const down = e => { const p = e.touches ? e.touches[0] : e; start.current = { x: p.clientX, y: p.clientY, lock: null }; };
  const move = e => {
    if (!start.current) return;
    const p = e.touches ? e.touches[0] : e;
    const mx = p.clientX - start.current.x, my = p.clientY - start.current.y;
    if (start.current.lock === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) start.current.lock = Math.abs(mx) > Math.abs(my) ? 'h' : 'v';
    if (start.current.lock === 'h' && mx > 0) setDx(Math.min(mx, 150));
  };
  const up = () => {
    if (dx > 90 && !inList) { onWatchlist(film.id); setFlash(true); setTimeout(() => setFlash(false), 700); }
    setDx(0); start.current = null;
  };
  const [a, b] = film.grad;
  return (
    <div style={{ height: '100%', scrollSnapAlign: 'start', position: 'relative', overflow: 'hidden' }}>
      <div
        onTouchStart={down} onTouchMove={move} onTouchEnd={up}
        onMouseDown={down} onMouseMove={e => start.current && move(e)} onMouseUp={up} onMouseLeave={() => start.current && up()}
        style={{ position: 'absolute', inset: 0, transform: `translateX(${dx}px)`, transition: dx === 0 ? `transform ${motion ? '.4s' : '0s'} cubic-bezier(.2,.8,.2,1)` : 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${a}, ${b})` }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.45, mixBlendMode: 'soft-light', backgroundImage: 'repeating-linear-gradient(112deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 6px)' }} />
        <div style={{ position: 'absolute', right: -60, top: 80, width: 240, height: 240, borderRadius: '50%', border: `1.5px solid ${film.ink}`, opacity: 0.22 }} />
        <div style={{ position: 'absolute', right: -20, top: 120, width: 160, height: 160, borderRadius: '50%', border: `1px solid ${film.ink}`, opacity: 0.16 }} />
        {/* top + bottom scrims */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '62%', background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 12%, rgba(0,0,0,0.5) 50%, transparent)' }} />

        {/* right action rail */}
        <div style={{ position: 'absolute', right: 14, bottom: 188, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', zIndex: 3 }}>
          <RailBtn icon={inList ? 'heart_fill' : 'heart'} active={inList} label={inList ? 'Bewaard' : 'Bewaar'} onClick={() => onWatchlist(film.id)} />
          <RailBtn icon="eye" label="Gezien" />
          <RailBtn icon="share" label="Deel" />
        </div>

        {/* content */}
        <div style={{ position: 'absolute', left: 18, right: 78, bottom: 26, zIndex: 3 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {film.themes.slice(0, 3).map(t => <ThemeChip key={t} label={t} size="s" />)}
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 34, lineHeight: 0.98, color: '#fff', letterSpacing: -0.5, textWrap: 'balance' }}>{film.title}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 9 }}>{film.year} · {film.dir} · {film.runtime}m</div>
          <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
            {['imdb', 'rt', 'mc'].map(s => <ScorePill key={s} src={s} value={film.scores[s]} compact />)}
          </div>
          {/* why recommended */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 3, background: 'linear-gradient(var(--amber1), var(--amber2))', flexShrink: 0 }} />
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'rgba(255,255,255,0.92)', lineHeight: 1.35 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: 1, color: 'var(--amber2)', display: 'block', marginBottom: 3 }}>WAAROM VOOR JOU</span>
              {whyText || film.why}
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <GlowButton size="m" icon="play" onClick={() => onOpen(film.id)}>Bekijk details</GlowButton>
          </div>
        </div>

        {/* swipe-right affordance */}
        <div style={{ position: 'absolute', left: 16, top: '46%', display: 'flex', alignItems: 'center', gap: 8, opacity: Math.min(dx / 90, 1), zIndex: 4, pointerEvents: 'none' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(120deg, var(--amber1), var(--amber2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a0e02', transform: `scale(${0.6 + Math.min(dx / 90, 1) * 0.4})` }}><Icon name="bookmark" size={24} fill="#1a0e02" /></div>
        </div>
        {flash && <div style={{ position: 'absolute', inset: 0, animation: 'wnFade .3s', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, pointerEvents: 'none' }}>
          <div style={{ padding: '12px 22px', borderRadius: 999, background: 'rgba(10,10,12,0.85)', border: '1px solid var(--amber)', color: 'var(--amber2)', fontFamily: 'var(--mono)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', animation: 'wnPop .3s' }}><Icon name="check" size={18} /> Toegevoegd aan watchlist</div>
        </div>}
      </div>
    </div>
  );
}

function RailBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 0 }}>
      <div style={{ width: 46, height: 46, borderRadius: '50%', background: active ? 'linear-gradient(120deg, var(--amber1), var(--amber2))' : 'rgba(20,20,24,0.55)', backdropFilter: 'blur(8px)', border: active ? 'none' : '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#1a0e02' : '#fff', boxShadow: active ? '0 4px 16px rgba(255,138,43,0.4)' : 'none' }}>
        <Icon name={icon} size={22} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'rgba(255,255,255,0.85)' }}>{label}</span>
    </button>
  );
}

// ── Discover screen ──────────────────────────────────────────────────
function Discover() {
  const ctx = useWN();
  const { t, watchlist, toggleWatchlist, openFilm, openTune, openSearch, seed, clearSeed } = ctx;
  const motion = !t.reduceMotion;
  const seedFilm = seed ? FILM_BY_ID[seed] : null;
  const films = seedFilm ? seedChain(seedFilm) : FILMS;

  if (t.feedLayout === 'tiktok') {
    return (
      <div style={{ position: 'absolute', inset: 0, paddingBottom: 88 }}>
        <div key={seed || 'all'} className="wn-scroll" style={{ height: '100%', scrollSnapType: 'y mandatory' }}>
          {films.map(f => (
            <FeedSlide key={f.id} film={f} onOpen={openFilm} onWatchlist={toggleWatchlist} inList={watchlist.includes(f.id)} motion={motion} whyText={seedFilm ? seedWhy(seedFilm, f) : f.why} />
          ))}
        </div>
        {/* floating header */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '50px 16px 0', display: 'flex', flexDirection: 'column', gap: 9, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
            {seedFilm ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, height: 46, padding: '0 6px 0 14px', borderRadius: 999, background: 'rgba(20,20,24,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,138,43,0.45)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber2)', flexShrink: 0 }} />
                <div onClick={openSearch} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: 1, color: 'rgba(255,255,255,0.6)' }}>ZOALS</div>
                  <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seedFilm.title}</div>
                </div>
                <button onClick={clearSeed} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Icon name="close" size={17} /></button>
              </div>
            ) : (
              <button onClick={openSearch} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 16px', borderRadius: 999, background: 'rgba(20,20,24,0.55)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.72)', cursor: 'pointer' }}>
                <Icon name="search" size={19} />
                <span style={{ fontFamily: 'var(--sans)', fontSize: 14.5 }}>Noem een film die je raakte…</span>
              </button>
            )}
            <button onClick={openTune} style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(20,20,24,0.55)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Icon name="sliders" size={21} />
            </button>
          </div>
          {seedFilm && <div style={{ pointerEvents: 'auto', fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: 1, color: 'var(--amber2)', paddingLeft: 4 }}>{films.length} aanbevelingen in deze keten</div>}
        </div>
      </div>
    );
  }

  return <DiscoverRows ctx={ctx} seedFilm={seedFilm} films={films} />;
}

function DiscoverRows({ ctx, seedFilm, films }) {
  const { t, openFilm, openTune, openSearch, clearSeed } = ctx;
  const cardStyle = t.cardStyle;
  const chainIds = seedFilm ? (CHAINS[seedFilm.id] || []) : [];
  const hero = seedFilm ? films[0] : FILMS[0];
  const personalRows = [
    { title: 'Omdat je van herinnering houdt', sub: 'Thematische match', films: ['eternal', 'her', 'itmfl', 'arrival', 'mulholland'] },
    { title: 'Cult-favorieten', sub: 'Door de community geliefd', films: ['drive', '2001', 'mulholland', 'master', 'parasite'] },
    { title: 'Magistrale cinematografie', sub: 'Voor het oog', films: ['twbb', 'itmfl', 'br2049', '2001', 'master'] },
    { title: 'Strak & spannend', sub: 'Hoog tempo', films: ['ncfom', 'parasite', 'drive', 'arrival'] },
  ];
  const seedRows = seedFilm ? [
    { title: `Thematisch verwant aan ${seedFilm.title}`, sub: 'Dezelfde thema\u2019s', films: chainIds },
    { title: 'Ook qua sfeer dichtbij', sub: 'Match op feel', films: films.filter(f => !chainIds.includes(f.id) && f.id !== hero.id).slice(0, 6).map(f => f.id) },
  ] : personalRows;
  return (
    <div className="wn-scroll" style={{ position: 'absolute', inset: 0, paddingBottom: 96 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '58px 18px 12px' }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: 2, color: 'var(--tx3)' }}>WHATNOW</div>
          <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 27, color: 'var(--tx)', lineHeight: 1, marginTop: 3 }}>Ontdek</div>
        </div>
        <button onClick={openTune} style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--line)', color: 'var(--tx)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="sliders" size={22} /></button>
      </div>

      {/* seed banner OR search bar */}
      <div style={{ padding: '0 18px 6px' }}>
        {seedFilm ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(120deg, rgba(255,122,24,0.12), rgba(255,179,71,0.05))', border: '1px solid rgba(255,138,43,0.35)', borderRadius: 16, padding: 10 }}>
            <div style={{ width: 40, height: 60, flexShrink: 0, borderRadius: 8 }}><Poster film={seedFilm} showText={false} rounded={8} /></div>
            <div onClick={openSearch} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1, color: 'var(--amber2)' }}>OP BASIS VAN</div>
              <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 15.5, color: 'var(--tx)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seedFilm.title}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--tx3)', marginTop: 2 }}>Tik om te wijzigen</div>
            </div>
            <button onClick={clearSeed} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--line)', color: 'var(--tx2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Icon name="close" size={17} /></button>
          </div>
        ) : (
          <button onClick={openSearch} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, height: 48, padding: '0 16px', borderRadius: 14, background: 'var(--surface2)', border: '1px solid var(--line2)', color: 'var(--tx3)', cursor: 'pointer' }}>
            <Icon name="search" size={20} />
            <span style={{ fontFamily: 'var(--sans)', fontSize: 14.5 }}>Noem een film die je raakte…</span>
          </button>
        )}
      </div>

      {/* hero */}
      <button onClick={() => openFilm(hero.id)} style={{ display: 'block', width: 'calc(100% - 36px)', margin: '8px 18px 8px', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <div style={{ position: 'relative', height: 250, borderRadius: 20, overflow: 'hidden' }}>
          <Poster film={hero} showText={false} rounded={20} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.88), transparent 58%)' }} />
          <div style={{ position: 'absolute', top: 12, left: 12, fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: 1.5, color: 'var(--amber2)', background: 'rgba(10,10,12,0.6)', padding: '4px 9px', borderRadius: 7 }}>{seedFilm ? 'BESTE MATCH' : 'TOPAANBEVELING'}</div>
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 26, color: '#fff', lineHeight: 1, textWrap: 'balance' }}>{hero.title}</div>
            {seedFilm ? (
              <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 8, lineHeight: 1.35 }}>{seedWhy(seedFilm, hero)}</div>
            ) : (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'rgba(255,255,255,0.8)', marginTop: 7 }}>{hero.year} · {hero.dir}</div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 11 }}>{hero.themes.slice(0, 3).map(x => <ThemeChip key={x} label={x} size="s" />)}</div>
          </div>
        </div>
      </button>

      {seedRows.map(row => (
        <div key={row.title} style={{ marginTop: 22 }}>
          <div style={{ padding: '0 18px', marginBottom: 12 }}>
            <Eyebrow>{row.sub}</Eyebrow>
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 17, color: 'var(--tx)', marginTop: 3 }}>{row.title}</div>
          </div>
          <div className="wn-hscroll" style={{ display: 'flex', gap: 13, padding: '0 18px 4px' }}>
            {row.films.map(id => <FilmTile key={id} film={FILM_BY_ID[id]} style={cardStyle} onClick={() => openFilm(id)} />)}
          </div>
        </div>
      ))}
      <div style={{ height: 12 }} />
    </div>
  );
}

window.FilmTile = FilmTile;
window.Discover = Discover;
