/* Discover-feed (TikTok-variant + rijen-variant) — geport uit screens-discover.jsx.
 * De verticale TikTok-feed is gevirtualiseerd: alleen een klein venster van slides rond de actieve
 * index wordt gerenderd (zie TikTokFeed), zodat ~5000 films niet allemaal tegelijk in de DOM staan. */
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWN } from "../state/AppContext";
import { Icon, Poster, ScorePill, scoreEntries, ThemeChip, GlowButton, Eyebrow } from "../components/ui";
import { getCatalog } from "../data/catalog";
import { personalFeed, seedChain, seedWhy } from "../reco/reco";
import { tmdbImage } from "../utils/img";
import type { CatalogFilm } from "../data/types";

type Pointer = React.TouchEvent | React.MouseEvent;
const px = (e: Pointer) => ("touches" in e ? e.touches[0] : e);

// ── Herbruikbare film-tegel (respecteert cardStyle) ───────────────────
export function FilmTile({ film, onClick, w = 132, style = "poster" }: { film: CatalogFilm; onClick?: () => void; w?: number; style?: string }) {
  const { tr } = useWN();
  if (style === "minimal") {
    return (
      <button onClick={onClick} style={{ width: w, textAlign: "left", cursor: "pointer", background: "none", border: "none", padding: 0, flexShrink: 0 }}>
        <div style={{ width: w, height: w * 1.5 }}><Poster film={film} showText={false} rounded={12} /></div>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 13, color: "var(--tx)", marginTop: 8, lineHeight: 1.15 }}>{film.title}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)", marginTop: 2 }}>{film.year}</div>
      </button>
    );
  }
  if (style === "editorial") {
    return (
      <button onClick={onClick} style={{ width: w * 1.6, display: "flex", gap: 11, textAlign: "left", cursor: "pointer", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 9, flexShrink: 0 }}>
        <div style={{ width: 52, height: 78, flexShrink: 0 }}><Poster film={film} showText={false} rounded={9} size="w185" /></div>
        <div style={{ minWidth: 0, paddingTop: 2 }}>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 13.5, color: "var(--tx)", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{film.title}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--tx3)", marginTop: 3 }}>{film.year} · {film.runtime}m</div>
          <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
            {film.themes.slice(0, 2).map((t) => <span key={t} style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--amber2)", background: "rgba(255,138,43,0.1)", padding: "2px 6px", borderRadius: 5 }}>{tr(t)}</span>)}
          </div>
        </div>
      </button>
    );
  }
  return (
    <button onClick={onClick} style={{ width: w, cursor: "pointer", background: "none", border: "none", padding: 0, flexShrink: 0 }}>
      <div style={{ width: w, height: w * 1.5, boxShadow: "0 8px 22px rgba(0,0,0,0.4)", borderRadius: 13 }}><Poster film={film} rounded={13} /></div>
      <div style={{ display: "flex", gap: 5, marginTop: 8, alignItems: "center" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: "#f5c518" }}>★ {(film.scores.imdb ?? film.scores.tmdb ?? 0).toFixed(1)}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--tx3)" }}>{film.genres[0]}</span>
      </div>
    </button>
  );
}

function RailBtn({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: 0 }}>
      <div style={{ width: 46, height: 46, borderRadius: "50%", background: active ? "linear-gradient(120deg, var(--amber1), var(--amber2))" : "rgba(20,20,24,0.55)", backdropFilter: "blur(8px)", border: active ? "none" : "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: active ? "#1a0e02" : "#fff", boxShadow: active ? "0 4px 16px rgba(255,138,43,0.4)" : "none" }}>
        <Icon name={icon} size={22} />
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, color: "rgba(255,255,255,0.85)" }}>{label}</span>
    </button>
  );
}

function FeedSlide({ film, onOpen, onWatchlist, onSeen, inList, motion, whyText }: {
  film: CatalogFilm; onOpen: (id: string) => void; onWatchlist: (id: string) => void; onSeen: (id: string) => void; inList: boolean; motion: boolean; whyText: string;
}) {
  const { tr } = useWN();
  const [dx, setDx] = useState(0);
  const [flash, setFlash] = useState(false);
  const start = useRef<{ x: number; y: number; lock: "h" | "v" | null } | null>(null);

  const down = (e: Pointer) => { const p = px(e); start.current = { x: p.clientX, y: p.clientY, lock: null }; };
  const move = (e: Pointer) => {
    if (!start.current) return;
    const p = px(e);
    const mx = p.clientX - start.current.x, my = p.clientY - start.current.y;
    if (start.current.lock === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) start.current.lock = Math.abs(mx) > Math.abs(my) ? "h" : "v";
    if (start.current.lock === "h" && mx > 0) setDx(Math.min(mx, 150));
  };
  const up = () => {
    if (dx > 90 && !inList) { onWatchlist(film.id); setFlash(true); setTimeout(() => setFlash(false), 700); }
    setDx(0); start.current = null;
  };
  const [a, b] = film.grad;
  return (
    <div style={{ height: "100%", scrollSnapAlign: "start", position: "relative", overflow: "hidden" }}>
      <div
        onTouchStart={down} onTouchMove={move} onTouchEnd={up}
        onMouseDown={down} onMouseMove={(e) => start.current && move(e)} onMouseUp={up} onMouseLeave={() => start.current && up()}
        style={{ position: "absolute", inset: 0, transform: `translateX(${dx}px)`, transition: dx === 0 ? `transform ${motion ? ".4s" : "0s"} cubic-bezier(.2,.8,.2,1)` : "none" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${a}, ${b})` }} />
        {film.backdropUrl && <img src={tmdbImage(film.backdropUrl, "w780")} alt="" loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, opacity: 0.45, mixBlendMode: "soft-light", backgroundImage: "repeating-linear-gradient(112deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 6px)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120, background: "linear-gradient(180deg, rgba(0,0,0,0.55), transparent)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "62%", background: "linear-gradient(0deg, rgba(0,0,0,0.9) 12%, rgba(0,0,0,0.5) 50%, transparent)" }} />

        {/* actie-rail */}
        <div style={{ position: "absolute", right: 14, bottom: 188, display: "flex", flexDirection: "column", gap: 18, alignItems: "center", zIndex: 3 }}>
          <RailBtn icon={inList ? "heart_fill" : "heart"} active={inList} label={inList ? tr("Bewaard") : tr("Bewaar")} onClick={() => onWatchlist(film.id)} />
          <RailBtn icon="eye" label={tr("Gezien")} onClick={() => onSeen(film.id)} />
          <RailBtn icon="share" label={tr("Deel")} />
        </div>

        {/* content */}
        <div style={{ position: "absolute", left: 18, right: 78, bottom: 26, zIndex: 3 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {film.themes.slice(0, 3).map((t) => <ThemeChip key={t} label={tr(t)} size="s" />)}
          </div>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 34, lineHeight: 0.98, color: "#fff", letterSpacing: -0.5 }}>{film.title}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "rgba(255,255,255,0.75)", marginTop: 9 }}>{film.year} · {film.dir} · {film.runtime}m</div>
          <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
            {scoreEntries(film.scores).map((e) => <ScorePill key={e.src} src={e.src} value={e.value} compact />)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "flex-start" }}>
            <div style={{ width: 3, alignSelf: "stretch", borderRadius: 3, background: "linear-gradient(var(--amber1), var(--amber2))", flexShrink: 0 }} />
            <div style={{ fontFamily: "var(--sans)", fontSize: 13.5, color: "rgba(255,255,255,0.92)", lineHeight: 1.35 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: 1, color: "var(--amber2)", display: "block", marginBottom: 3 }}>{tr("WAAROM VOOR JOU")}</span>
              {whyText || film.why}
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <GlowButton size="m" icon="play" onClick={() => onOpen(film.id)}>{tr("Bekijk details")}</GlowButton>
          </div>
        </div>

        {/* swipe-affordance */}
        <div style={{ position: "absolute", left: 16, top: "46%", display: "flex", alignItems: "center", gap: 8, opacity: Math.min(dx / 90, 1), zIndex: 4, pointerEvents: "none" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(120deg, var(--amber1), var(--amber2))", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a0e02", transform: `scale(${0.6 + Math.min(dx / 90, 1) * 0.4})` }}><Icon name="bookmark" size={24} fill="#1a0e02" /></div>
        </div>
        {flash && <div style={{ position: "absolute", inset: 0, animation: "wnFade .3s", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, pointerEvents: "none" }}>
          <div style={{ padding: "12px 22px", borderRadius: 999, background: "rgba(10,10,12,0.85)", border: "1px solid var(--amber)", color: "var(--amber2)", fontFamily: "var(--mono)", fontSize: 13, display: "flex", gap: 8, alignItems: "center", animation: "wnPop .3s" }}><Icon name="check" size={18} /> {tr("Toegevoegd aan watchlist")}</div>
        </div>}
      </div>
    </div>
  );
}

/* Gevirtualiseerde verticale feed: rendert alleen een venster van slides rond de actieve index,
 * met boven-/onder-spacers zodat de scrollhoogte en native scroll-snap intact blijven. Houdt de
 * DOM klein (~4 slides) i.p.v. ~5000. */
function TikTokFeed({ films, renderSlide }: { films: CatalogFilm[]; renderSlide: (f: CatalogFilm) => React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [slideH, setSlideH] = useState(0);
  const [active, setActive] = useState(0);
  const ticking = useRef(false);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setSlideH(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onScroll = () => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      const el = scrollRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / (el.clientHeight || 1));
      setActive((prev) => (idx === prev ? prev : idx));
    });
  };

  const N = films.length;
  const start = Math.max(0, active - 1);
  const end = Math.min(N, active + 3);

  return (
    <div ref={scrollRef} onScroll={onScroll} className="wn-scroll" style={{ height: "100%", scrollSnapType: "y mandatory" }}>
      {start > 0 && <div style={{ height: start * slideH }} />}
      {films.slice(start, end).map((f) => (
        <div key={f.id} style={{ height: slideH || "100%", scrollSnapAlign: "start", scrollSnapStop: "always" }}>{renderSlide(f)}</div>
      ))}
      {end < N && <div style={{ height: (N - end) * slideH }} />}
    </div>
  );
}

export function Discover() {
  const ctx = useWN();
  const { t, tr, watchlist, toggleWatchlist, toggleSeen, openFilm, openTune, openSearch, seed, clearSeed, favoriteThemes, feelTarget, seen } = ctx;
  const { byId } = getCatalog();
  const motion = !t.reduceMotion;
  const seedFilm = seed ? byId[seed] ?? null : null;
  // Met seed: thematische keten. Zonder seed: profiel-gewogen "voor jou"-feed.
  // Gememoïseerd: sorteert anders ~5000 films bij elke render (watchlist-toggle, enz.).
  const films = useMemo(
    () => (seedFilm ? seedChain(seedFilm) : personalFeed({ favoriteThemes, feelTarget, seen })),
    [seedFilm, favoriteThemes, feelTarget, seen],
  );

  if (t.feedLayout === "tiktok") {
    return (
      <div style={{ position: "absolute", inset: 0, paddingBottom: 88 }}>
        <TikTokFeed
          key={seed || "all"}
          films={films}
          renderSlide={(f) => (
            <FeedSlide film={f} onOpen={openFilm} onWatchlist={toggleWatchlist} onSeen={toggleSeen} inList={watchlist.includes(f.id)} motion={motion} whyText={seedFilm ? seedWhy(seedFilm, f) : f.why} />
          )}
        />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "50px 16px 0", display: "flex", flexDirection: "column", gap: 9, pointerEvents: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
            {seedFilm ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, height: 46, padding: "0 6px 0 14px", borderRadius: 999, background: "rgba(20,20,24,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,138,43,0.45)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--amber2)", flexShrink: 0 }} />
                <div onClick={openSearch} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 8.5, letterSpacing: 1, color: "rgba(255,255,255,0.6)" }}>{tr("ZOALS")}</div>
                  <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 14, color: "#fff", lineHeight: 1, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seedFilm.title}</div>
                </div>
                <button onClick={clearSeed} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="close" size={17} /></button>
              </div>
            ) : (
              <button onClick={openSearch} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, height: 46, padding: "0 16px", borderRadius: 999, background: "rgba(20,20,24,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.72)", cursor: "pointer" }}>
                <Icon name="search" size={19} />
                <span style={{ fontFamily: "var(--sans)", fontSize: 14.5 }}>{tr("Noem een film die je raakte…")}</span>
              </button>
            )}
            <button onClick={openTune} style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(20,20,24,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <Icon name="sliders" size={21} />
            </button>
          </div>
          {seedFilm && <div style={{ pointerEvents: "auto", fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: 1, color: "var(--amber2)", paddingLeft: 4 }}>{tr("{n} aanbevelingen in deze keten", { n: films.length })}</div>}
        </div>
      </div>
    );
  }

  return <DiscoverRows seedFilm={seedFilm} films={films} />;
}

function DiscoverRows({ seedFilm, films }: { seedFilm: CatalogFilm | null; films: CatalogFilm[] }) {
  const { t, tr, openFilm, openTune, openSearch, clearSeed } = useWN();
  const { byId, films: all } = getCatalog();
  const cardStyle = t.cardStyle;
  const chainIds = seedFilm ? seedFilm.chain ?? [] : [];
  const hero = seedFilm ? films[0] : all[0];
  const personalRows = [
    { title: "Omdat je van herinnering houdt", sub: "Thematische match", films: ["eternal", "her", "itmfl", "arrival", "mulholland"] },
    { title: "Cult-favorieten", sub: "Door de community geliefd", films: ["drive", "2001", "mulholland", "master", "parasite"] },
    { title: "Magistrale cinematografie", sub: "Voor het oog", films: ["twbb", "itmfl", "br2049", "2001", "master"] },
    { title: "Strak & spannend", sub: "Hoog tempo", films: ["ncfom", "parasite", "drive", "arrival"] },
  ];
  const seedRows = seedFilm
    ? [
        { title: tr("Thematisch verwant aan {title}", { title: seedFilm.title }), sub: "Dezelfde thema's", films: chainIds },
        { title: "Ook qua sfeer dichtbij", sub: "Match op feel", films: films.filter((f) => !chainIds.includes(f.id) && f.id !== hero.id).slice(0, 6).map((f) => f.id) },
      ]
    : personalRows;
  return (
    <div className="wn-scroll" style={{ position: "absolute", inset: 0, paddingBottom: 96 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "58px 18px 12px" }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: 2, color: "var(--tx3)" }}>WHATNOW</div>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 27, color: "var(--tx)", lineHeight: 1, marginTop: 3 }}>{tr("Ontdek")}</div>
        </div>
        <button onClick={openTune} style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--line)", color: "var(--tx)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="sliders" size={22} /></button>
      </div>

      <div style={{ padding: "0 18px 6px" }}>
        {seedFilm ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(120deg, rgba(255,122,24,0.12), rgba(255,179,71,0.05))", border: "1px solid rgba(255,138,43,0.35)", borderRadius: 16, padding: 10 }}>
            <div style={{ width: 40, height: 60, flexShrink: 0, borderRadius: 8 }}><Poster film={seedFilm} showText={false} rounded={8} size="w185" /></div>
            <div onClick={openSearch} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: 1, color: "var(--amber2)" }}>{tr("OP BASIS VAN")}</div>
              <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 15.5, color: "var(--tx)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seedFilm.title}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--tx3)", marginTop: 2 }}>{tr("Tik om te wijzigen")}</div>
            </div>
            <button onClick={clearSeed} style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--line)", color: "var(--tx2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="close" size={17} /></button>
          </div>
        ) : (
          <button onClick={openSearch} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, height: 48, padding: "0 16px", borderRadius: 14, background: "var(--surface2)", border: "1px solid var(--line2)", color: "var(--tx3)", cursor: "pointer" }}>
            <Icon name="search" size={20} />
            <span style={{ fontFamily: "var(--sans)", fontSize: 14.5 }}>{tr("Noem een film die je raakte…")}</span>
          </button>
        )}
      </div>

      <button onClick={() => openFilm(hero.id)} style={{ display: "block", width: "calc(100% - 36px)", margin: "8px 18px 8px", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <div style={{ position: "relative", height: 250, borderRadius: 20, overflow: "hidden" }}>
          <Poster film={hero} showText={false} rounded={20} size="w500" />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.88), transparent 58%)" }} />
          <div style={{ position: "absolute", top: 12, left: 12, fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: 1.5, color: "var(--amber2)", background: "rgba(10,10,12,0.6)", padding: "4px 9px", borderRadius: 7 }}>{seedFilm ? tr("BESTE MATCH") : tr("TOPAANBEVELING")}</div>
          <div style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 26, color: "#fff", lineHeight: 1 }}>{hero.title}</div>
            {seedFilm ? (
              <div style={{ fontFamily: "var(--sans)", fontSize: 12.5, color: "rgba(255,255,255,0.85)", marginTop: 8, lineHeight: 1.35 }}>{seedWhy(seedFilm, hero)}</div>
            ) : (
              <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "rgba(255,255,255,0.8)", marginTop: 7 }}>{hero.year} · {hero.dir}</div>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 11 }}>{hero.themes.slice(0, 3).map((x) => <ThemeChip key={x} label={tr(x)} size="s" />)}</div>
          </div>
        </div>
      </button>

      {seedRows.map((row) => (
        <div key={row.title} style={{ marginTop: 22 }}>
          <div style={{ padding: "0 18px", marginBottom: 12 }}>
            <Eyebrow>{tr(row.sub)}</Eyebrow>
            <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 17, color: "var(--tx)", marginTop: 3 }}>{tr(row.title)}</div>
          </div>
          <div className="wn-hscroll" style={{ display: "flex", gap: 13, padding: "0 18px 4px" }}>
            {row.films.map((id) => byId[id] && <FilmTile key={id} film={byId[id]} style={cardStyle} onClick={() => openFilm(id)} />)}
          </div>
        </div>
      ))}
      <div style={{ height: 12 }} />
    </div>
  );
}
