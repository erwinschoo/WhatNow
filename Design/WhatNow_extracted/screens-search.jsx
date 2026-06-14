// screens-search.jsx — Seed search overlay: enter a film, get a thematic chain
const { useState: useStateS, useRef: useRefS, useEffect: useEffectS } = React;

function Search() {
  const { closeSearch, setSeed, openFilm } = useWN();
  const [q, setQ] = useStateS('');
  const inputRef = useRefS(null);
  useEffectS(() => { const id = setTimeout(() => inputRef.current && inputRef.current.focus(), 350); return () => clearTimeout(id); }, []);

  const query = q.trim().toLowerCase();
  const results = query
    ? FILMS.filter(f =>
        f.title.toLowerCase().includes(query) ||
        f.dir.toLowerCase().includes(query) ||
        f.themes.some(t => t.toLowerCase().includes(query)) ||
        f.genres.some(g => g.toLowerCase().includes(query)))
    : [];

  const suggestions = ['intowild', 'br2049', 'parasite', 'itmfl', 'drive', 'arrival'].map(id => FILM_BY_ID[id]);
  const surprise = () => setSeed(FILMS[Math.floor(Math.random() * FILMS.length)].id);

  const Row = ({ f }) => (
    <button onClick={() => setSeed(f.id)} style={{ display: 'flex', gap: 13, alignItems: 'center', width: '100%', textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
      <div style={{ width: 44, height: 66, flexShrink: 0, borderRadius: 9 }}><Poster film={f} showText={false} rounded={9} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 15, color: 'var(--tx)' }}>{f.title}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--tx3)', marginTop: 3 }}>{f.year} · {f.dir}</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
          {f.themes.slice(0, 2).map(t => <span key={t} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--amber2)', background: 'rgba(255,138,43,0.1)', padding: '2px 7px', borderRadius: 5 }}>{t}</span>)}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--amber2)', border: '1px solid rgba(255,138,43,0.4)', borderRadius: 999, padding: '5px 10px', flexShrink: 0 }}>Als seed</div>
    </button>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', zIndex: 45, display: 'flex', flexDirection: 'column', animation: 'wnFade .2s' }}>
      {/* header */}
      <div style={{ padding: '52px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={closeSearch} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--line)', color: 'var(--tx)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="back" size={22} /></button>
          <div>
            <Eyebrow>De thematische keten</Eyebrow>
            <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 21, color: 'var(--tx)', lineHeight: 1, marginTop: 2 }}>Vind films zoals…</div>
          </div>
        </div>
        {/* input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', border: '1px solid var(--line2)', borderRadius: 14, padding: '0 14px', height: 52 }}>
          <Icon name="search" size={20} style={{ color: 'var(--tx3)', flexShrink: 0 }} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Noem een film die je raakte…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--tx)', fontFamily: 'var(--sans)', fontSize: 16 }} />
          {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', padding: 2, display: 'flex' }}><Icon name="close" size={18} /></button>}
        </div>
      </div>

      <div className="wn-scroll" style={{ flex: 1, padding: '4px 18px 24px' }}>
        {query ? (
          results.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Eyebrow style={{ marginBottom: 2 }}>{results.length} resultaten</Eyebrow>
              {results.map(f => <Row key={f.id} f={f} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--tx3)' }}>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--tx2)' }}>Niets gevonden voor "{q}"</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, marginTop: 6 }}>Probeer een titel, regisseur of thema</div>
            </div>
          )
        ) : (
          <>
            <button onClick={surprise} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(120deg, rgba(255,122,24,0.14), rgba(255,179,71,0.07))', border: '1px solid rgba(255,138,43,0.3)', borderRadius: 14, padding: 15, cursor: 'pointer', marginBottom: 22 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(120deg, var(--amber1), var(--amber2))', color: '#1a0e02', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="discover" size={22} /></div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 15, color: 'var(--tx)' }}>Verras me</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>Start vanaf een willekeurige film</div>
              </div>
            </button>
            <Eyebrow style={{ marginBottom: 12 }}>Probeer een seed</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {suggestions.map(f => (
                <button key={f.id} onClick={() => setSeed(f.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                  <div style={{ width: '100%', aspectRatio: '2/3', borderRadius: 11, boxShadow: '0 6px 18px rgba(0,0,0,0.4)' }}><Poster film={f} rounded={11} /></div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

window.Search = Search;
