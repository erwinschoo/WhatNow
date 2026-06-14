// screens-detail.jsx — Film detail + thematic chain + trivia, and the Tune sheet
const { useState: useStateF, useRef: useRefF } = React;

// ── Swipeable trivia cards ───────────────────────────────────────────
function TriviaDeck({ film }) {
  const [i, setI] = useStateF(0);
  const start = useRefF(null);
  const [dx, setDx] = useStateF(0);
  const cards = film.trivia;
  const down = e => { const p = e.touches ? e.touches[0] : e; start.current = p.clientX; };
  const move = e => { if (start.current == null) return; const p = e.touches ? e.touches[0] : e; setDx(p.clientX - start.current); };
  const up = () => {
    if (dx < -55 && i < cards.length - 1) setI(i + 1);
    else if (dx > 55 && i > 0) setI(i - 1);
    setDx(0); start.current = null;
  };
  return (
    <div>
      <div style={{ position: 'relative', height: 158 }}
        onTouchStart={down} onTouchMove={move} onTouchEnd={up}
        onMouseDown={down} onMouseMove={e => start.current != null && move(e)} onMouseUp={up} onMouseLeave={() => start.current != null && up()}>
        {cards.map((c, idx) => {
          const off = idx - i;
          if (off < 0 || off > 2) return null;
          return (
            <div key={idx} style={{
              position: 'absolute', inset: 0, transformOrigin: 'top center',
              transform: `translateY(${off * 12}px) scale(${1 - off * 0.05}) translateX(${off === 0 ? dx : 0}px) rotate(${off === 0 ? dx * 0.02 : 0}deg)`,
              opacity: off > 1 ? 0 : 1, zIndex: 10 - off,
              transition: off === 0 && dx !== 0 ? 'none' : 'all .35s cubic-bezier(.2,.8,.2,1)',
            }}>
              <div style={{ height: 158, borderRadius: 18, padding: 18, background: 'linear-gradient(150deg, var(--surface2), var(--surface))', border: '1px solid var(--line2)', boxShadow: '0 12px 30px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,138,43,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber2)' }}><Icon name="star" size={15} /></div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 1.4, color: 'var(--amber2)' }}>WIST JE DAT?</div>
                </div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 15.5, lineHeight: 1.4, color: 'var(--tx)', marginTop: 13, flex: 1, textWrap: 'pretty' }}>{c}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14 }}>
        {cards.map((_, idx) => <div key={idx} onClick={() => setI(idx)} style={{ width: idx === i ? 20 : 6, height: 6, borderRadius: 999, background: idx === i ? 'var(--amber)' : 'var(--surface3)', cursor: 'pointer', transition: 'all .25s' }} />)}
      </div>
    </div>
  );
}

// ── Detail screen ────────────────────────────────────────────────────
function Detail({ id }) {
  const ctx = useWN();
  const { closeFilm, openFilm, openFilmQuiz, watchlist, toggleWatchlist, seen, toggleSeen, setSeed } = ctx;
  const film = FILM_BY_ID[id];
  const inList = watchlist.includes(id);
  const isSeen = seen.includes(id);
  const chain = (CHAINS[id] || []).map(x => FILM_BY_ID[x]);
  const [a, b] = film.grad;

  return (
    <div className="wn-scroll" style={{ position: 'absolute', inset: 0, background: 'var(--bg)' }}>
      {/* backdrop */}
      <div style={{ position: 'relative', height: 380 }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${a}, ${b})` }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.45, mixBlendMode: 'soft-light', backgroundImage: 'repeating-linear-gradient(112deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 6px)' }} />
        <div style={{ position: 'absolute', right: -50, top: 60, width: 230, height: 230, borderRadius: '50%', border: `1.5px solid ${film.ink}`, opacity: 0.22 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, var(--bg) 4%, transparent 55%)' }} />
        {/* nav */}
        <div style={{ position: 'absolute', top: 50, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', zIndex: 3 }}>
          <CircBtn icon="back" onClick={closeFilm} />
          <CircBtn icon={inList ? 'heart_fill' : 'heart'} active={inList} onClick={() => toggleWatchlist(id)} />
        </div>
        {/* poster + title */}
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 14, display: 'flex', gap: 15, alignItems: 'flex-end', zIndex: 2 }}>
          <div style={{ width: 104, height: 156, flexShrink: 0, borderRadius: 12, boxShadow: '0 14px 32px rgba(0,0,0,0.5)' }}><Poster film={film} showText={false} rounded={12} /></div>
          <div style={{ paddingBottom: 4 }}>
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 27, lineHeight: 0.98, color: '#fff', letterSpacing: -0.5, textWrap: 'balance' }}>{film.title}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,255,255,0.78)', marginTop: 8 }}>{film.year} · {film.runtime}m · {film.genres.join(' / ')}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber2)', marginTop: 4 }}>{film.dir}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '6px 18px 30px' }}>
        {/* scores */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['imdb', 'rt', 'mc'].map(s => <ScorePill key={s} src={s} value={film.scores[s]} />)}
          {film.cult && <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 11px', borderRadius: 999, border: '1px solid var(--amber)', color: 'var(--amber2)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: 0.5 }}>CULT</div>}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 9, marginBottom: 22 }}>
          <GlowButton size="m" full icon={inList ? 'check' : 'plus'} variant={inList ? 'dark' : 'amber'} onClick={() => toggleWatchlist(id)}>{inList ? 'Op watchlist' : 'Watchlist'}</GlowButton>
          <GlowButton size="m" variant={isSeen ? 'amber' : 'ghost'} icon="eye" onClick={() => toggleSeen(id)} style={{ flexShrink: 0 }}>Gezien</GlowButton>
        </div>

        {/* themes */}
        <Eyebrow style={{ marginBottom: 10 }}>Thema's</Eyebrow>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 22 }}>
          {film.themes.map(th => <ThemeChip key={th} label={th} />)}
        </div>

        {/* synopsis */}
        <Eyebrow style={{ marginBottom: 9 }}>Synopsis</Eyebrow>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 15, lineHeight: 1.55, color: 'var(--tx2)', margin: '0 0 24px', textWrap: 'pretty' }}>{film.synopsis}</p>

        {/* trivia */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <Eyebrow>Trivia · veeg</Eyebrow>
          <button onClick={() => openFilmQuiz(id)} style={{ background: 'none', border: 'none', color: 'var(--amber2)', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>Quiz hierover <Icon name="chevron" size={13} /></button>
        </div>
        <TriviaDeck film={film} />

        {/* more like this — the thematic chain */}
        <div style={{ marginTop: 30 }}>
          <Eyebrow style={{ marginBottom: 3 }}>De thematische keten</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 18, color: 'var(--tx)' }}>Meer zoals dit</div>
            <button onClick={() => setSeed(id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,138,43,0.12)', border: '1px solid rgba(255,138,43,0.4)', color: 'var(--amber2)', borderRadius: 999, padding: '7px 12px', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10.5, flexShrink: 0 }}><Icon name="discover" size={15} /> Maak dit je seed</button>
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--tx3)', marginBottom: 14, marginTop: 4 }}>Verbonden via {film.themes[0].toLowerCase()} & {film.themes[1].toLowerCase()}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chain.map((cf, idx) => (
              <button key={cf.id} onClick={() => openFilm(cf.id)} style={{ display: 'flex', gap: 13, alignItems: 'center', textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 10, cursor: 'pointer', animation: `wnFadeUp .4s ${idx * 0.05}s both` }}>
                <div style={{ width: 46, height: 68, flexShrink: 0, borderRadius: 9 }}><Poster film={cf} showText={false} rounded={9} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 14.5, color: 'var(--tx)' }}>{cf.title}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--tx3)', marginTop: 3 }}>{cf.year} · ★ {cf.scores.imdb.toFixed(1)}</div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
                    {cf.themes.filter(x => film.themes.includes(x)).slice(0, 2).map(x => <span key={x} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--amber2)', background: 'rgba(255,138,43,0.1)', padding: '2px 7px', borderRadius: 5 }}>{x}</span>)}
                  </div>
                </div>
                <Icon name="chevron" size={18} style={{ color: 'var(--tx3)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CircBtn({ icon, onClick, active }) {
  return (
    <button onClick={onClick} style={{ width: 42, height: 42, borderRadius: '50%', background: active ? 'linear-gradient(120deg, var(--amber1), var(--amber2))' : 'rgba(10,10,12,0.5)', backdropFilter: 'blur(10px)', border: active ? 'none' : '1px solid rgba(255,255,255,0.2)', color: active ? '#1a0e02' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: active ? '0 4px 16px rgba(255,138,43,0.4)' : 'none' }}>
      <Icon name={icon} size={22} />
    </button>
  );
}

// ── Tune sheet (feel sliders + facets + live counter) ────────────────
function Tune() {
  const ctx = useWN();
  const { t, feelTarget, setFeelTarget, tuneFacets, setTuneFacets, closeTune } = ctx;
  const [local, setLocal] = useStateF(feelTarget);
  const [facets, setFacets] = useStateF(tuneFacets);
  const fullscreen = t.tuneStyle === 'fullscreen';

  const toggleFacet = (group, val) => setFacets(f => {
    const cur = f[group] || [];
    return { ...f, [group]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] };
  });

  // live result count
  const matches = FILMS.filter(f => {
    if ((facets.genres || []).length && !facets.genres.some(g => f.genres.includes(g))) return false;
    if ((facets.decades || []).length && !facets.decades.includes(f.decade)) return false;
    if (facets.cult && !f.cult) return false;
    if (feelMatch(local, f.feel) < 55) return false;
    return true;
  });

  const apply = () => { setFeelTarget(local); setTuneFacets(facets); closeTune(); };

  const body = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <Eyebrow>Stem af op je stemming</Eyebrow>
          <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 22, color: 'var(--tx)', marginTop: 2 }}>Tune</div>
        </div>
        <button onClick={closeTune} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--line)', color: 'var(--tx2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="close" size={20} /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18 }}>
        {FEELS.map(f => <FeelSlider key={f.key} feel={f} value={local[f.key] ?? 5} onChange={v => setLocal(s => ({ ...s, [f.key]: v }))} />)}
      </div>

      <div style={{ height: 1, background: 'var(--line)', margin: '22px 0 18px' }} />

      <Eyebrow style={{ marginBottom: 11 }}>Genre</Eyebrow>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {GENRES.map(g => <FacetChip key={g} label={g} active={(facets.genres || []).includes(g)} onClick={() => toggleFacet('genres', g)} />)}
      </div>
      <Eyebrow style={{ marginBottom: 11 }}>Decennium</Eyebrow>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {DECADES.map(d => <FacetChip key={d} label={d} active={(facets.decades || []).includes(d)} onClick={() => toggleFacet('decades', d)} />)}
        <FacetChip label="Alleen cult" active={!!facets.cult} onClick={() => setFacets(f => ({ ...f, cult: !f.cult }))} />
      </div>
    </>
  );

  const footer = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 22, color: 'var(--amber2)', lineHeight: 1 }}>{matches.length}<span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--tx3)', fontWeight: 400 }}> films</span></div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--tx3)', marginTop: 3 }}>komen overeen</div>
      </div>
      <GlowButton size="m" icon="check" onClick={apply}>Toon resultaten</GlowButton>
    </div>
  );

  if (fullscreen) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', zIndex: 40, display: 'flex', flexDirection: 'column', animation: 'wnFade .25s' }}>
        <div className="wn-scroll" style={{ flex: 1, padding: '54px 18px 16px' }}>{body}</div>
        {footer}
        <div style={{ height: 22 }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
      <div onClick={closeTune} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', animation: 'wnFade .25s' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%', background: 'var(--surface)', borderRadius: '26px 26px 0 0', border: '1px solid var(--line2)', borderBottom: 'none', display: 'flex', flexDirection: 'column', animation: 'wnSlideUp .34s cubic-bezier(.2,.85,.2,1)', boxShadow: '0 -20px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}><div style={{ width: 40, height: 5, borderRadius: 999, background: 'var(--surface3)' }} /></div>
        <div className="wn-scroll" style={{ flex: 1, padding: '14px 18px 8px' }}>{body}</div>
        {footer}
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

Object.assign(window, { Detail, Tune, TriviaDeck });
