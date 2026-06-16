/* Quiz-hub, quiz-flow (tap + swipe) en resultaat met badge — geport uit screens-quiz.jsx. */
import { useEffect, useRef, useState } from "react";
import { useWN } from "../state/AppContext";
import { Icon, Poster, GlowButton, Eyebrow, StatRing } from "../components/ui";
import { getCatalog } from "../data/catalog";
import type { QuizQuestion } from "../data/types";

type Pointer = React.TouchEvent | React.MouseEvent;
const px = (e: Pointer) => ("touches" in e ? e.touches[0] : e);

function MiniStat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 15px" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: 1, color: "var(--tx3)" }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 26, color: "var(--amber2)", marginTop: 6, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--tx3)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export function QuizHub() {
  const { startQuiz, lastQuizScore, tr } = useWN();
  const { quiz } = getCatalog();
  return (
    <div className="wn-scroll" style={{ position: "absolute", inset: 0, padding: "60px 18px 100px" }}>
      <Eyebrow>{tr("Speel & ontdek")}</Eyebrow>
      <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 27, color: "var(--tx)", lineHeight: 1, marginTop: 3, marginBottom: 22 }}>{tr("Quiz")}</div>

      <button onClick={() => startQuiz("all")} style={{ display: "block", width: "100%", textAlign: "left", cursor: "pointer", border: "1px solid var(--line2)", borderRadius: 22, padding: 22, position: "relative", overflow: "hidden", background: "linear-gradient(150deg, #2a1606, #120a04)" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,138,43,0.32), transparent 70%)" }} />
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: 1.5, color: "var(--amber2)" }}>{tr("DAGELIJKSE QUIZ")}</div>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 24, color: "#fff", marginTop: 8, lineHeight: 1.05 }}>{tr("Hoe goed ken jij de cinema?")}</div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 13.5, color: "rgba(255,255,255,0.7)", marginTop: 10 }}>{tr("{n} vragen · trivia per film · amber-feedback", { n: quiz.length })}</div>
        <div style={{ marginTop: 18 }}><GlowButton size="m" icon="play">{tr("Start quiz")}</GlowButton></div>
      </button>

      <div style={{ display: "flex", gap: 11, marginTop: 16 }}>
        <MiniStat label={tr("Beste reeks")} value="9" sub={tr("op rij goed")} />
        <MiniStat label={tr("Gemiddelde")} value={(lastQuizScore != null ? lastQuizScore : 84) + "%"} sub={tr("laatste 7")} />
      </div>

      <Eyebrow style={{ marginTop: 26, marginBottom: 12 }}>{tr("Themaquizzen")}</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { t: "Trivia uit je watchlist", s: "12 films klaar", ic: "bookmark" },
          { t: "Decennium-duel · 2000s", s: "Plaats de films op tijd", ic: "clock" },
          { t: "Raad de regisseur", s: "Aan beeld & stijl", ic: "film" },
        ].map((row) => (
          <button key={row.t} onClick={() => startQuiz("all")} style={{ display: "flex", alignItems: "center", gap: 13, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 14, cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,138,43,0.12)", color: "var(--amber2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={row.ic} size={21} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15, color: "var(--tx)" }}>{tr(row.t)}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)", marginTop: 2 }}>{tr(row.s)}</div>
            </div>
            <Icon name="chevron" size={18} style={{ color: "var(--tx3)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function TapOptions({ q, picked, correct, onPick }: { q: QuizQuestion; picked: number | null; correct: boolean; onPick: (i: number) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
      {q.options.map((opt, idx) => {
        const isPicked = picked === idx;
        const isAnswer = idx === q.answer;
        let bg = "var(--surface)", bd = "var(--line2)", col = "var(--tx)";
        if (picked != null) {
          if (isAnswer) { bg = "rgba(255,138,43,0.22)"; bd = "var(--amber)"; col = "var(--amber2)"; }
          else if (isPicked) { bg = "rgba(255,90,70,0.12)"; bd = "rgba(255,90,70,0.6)"; col = "#ff9b8f"; }
          else { col = "var(--tx3)"; }
        }
        return (
          <button key={idx} onClick={() => onPick(idx)} style={{ minHeight: 86, borderRadius: 16, padding: 15, background: bg, border: `1.5px solid ${bd}`, color: col, cursor: picked == null ? "pointer" : "default", textAlign: "left", fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15.5, lineHeight: 1.15, display: "flex", alignItems: "flex-end", transition: "all .2s", animation: isPicked && !correct ? "wnShake .4s" : "none" }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SwipeOptions({ q, picked, onPick }: { q: QuizQuestion; picked: number | null; onPick: (i: number) => void }) {
  const { tr } = useWN();
  const [top, setTop] = useState(0);
  const order = useRef(q.options.map((_, i) => i));
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  if (picked != null) {
    return (
      <div style={{ textAlign: "center", padding: 10 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--tx3)", letterSpacing: 1 }}>{tr("JOUW ANTWOORD")}</div>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 18, color: picked === q.answer ? "var(--amber2)" : "#ff9b8f", marginTop: 6 }}>{q.options[picked]}</div>
      </div>
    );
  }
  const cur = order.current[top];
  const down = (e: Pointer) => { start.current = px(e).clientX; };
  const move = (e: Pointer) => { if (start.current == null) return; setDx(px(e).clientX - start.current); };
  const up = () => {
    if (dx > 80) onPick(cur);
    else if (dx < -80) setTop((tt) => (tt + 1) % order.current.length);
    setDx(0); start.current = null;
  };
  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)", textAlign: "center", marginBottom: 14, letterSpacing: 0.5 }}>
        VEEG <span style={{ color: "var(--amber2)" }}>→ rechts</span> om te kiezen · <span style={{ color: "var(--tx2)" }}>← links</span> om door te bladeren
      </div>
      <div style={{ position: "relative", height: 130 }}>
        {[2, 1, 0].map((depth) => {
          const oi = order.current[(top + depth) % order.current.length];
          const isTop = depth === 0;
          return (
            <div key={depth + "-" + oi}
              onTouchStart={isTop ? down : undefined} onTouchMove={isTop ? move : undefined} onTouchEnd={isTop ? up : undefined}
              onMouseDown={isTop ? down : undefined} onMouseMove={isTop ? (e) => start.current != null && move(e) : undefined} onMouseUp={isTop ? up : undefined} onMouseLeave={isTop ? () => start.current != null && up() : undefined}
              style={{ position: "absolute", left: 0, right: 0, top: 0, height: 110, transformOrigin: "bottom center",
                transform: `translateY(${depth * 9}px) scale(${1 - depth * 0.05}) translateX(${isTop ? dx : 0}px) rotate(${isTop ? dx * 0.03 : 0}deg)`,
                transition: isTop && dx !== 0 ? "none" : "all .3s cubic-bezier(.2,.8,.2,1)", zIndex: 5 - depth,
                borderRadius: 18, padding: 18, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "grab",
                background: isTop ? "linear-gradient(150deg, var(--surface2), var(--surface))" : "var(--surface)",
                border: `1.5px solid ${dx > 40 && isTop ? "var(--amber)" : "var(--line2)"}`,
                boxShadow: isTop ? "0 14px 32px rgba(0,0,0,0.4)" : "none" }}>
              <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 18, color: "var(--tx)" }}>{q.options[oi]}</span>
              {isTop && dx > 40 && <div style={{ position: "absolute", right: 14, top: 14, color: "var(--amber2)" }}><Icon name="check" size={24} stroke={2.6} /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuizResult({ score, total, onClose, questions }: { score: number; total: number; onClose: (retry?: boolean) => void; questions: QuizQuestion[] }) {
  const pct = Math.round((score / total) * 100);
  const tier = pct === 100 ? { t: "Perfecte score!", b: "Quizmeester", ic: "star" } : pct >= 60 ? { t: "Knap gedaan", b: "Cinefiel in opmars", ic: "film" } : { t: "Blijf kijken", b: "Leerling", ic: "eye" };
  const { saveQuizScore, tr } = useWN();
  const { byId } = getCatalog();
  useEffect(() => { saveQuizScore(pct); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="wn-scroll" style={{ position: "absolute", inset: 0, background: "radial-gradient(700px 500px at 50% 8%, rgba(255,138,43,0.18), transparent 60%), var(--bg)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", animation: "wnFade .3s", padding: "70px 22px 24px" }}>
      <Eyebrow>{tr(tier.t)}</Eyebrow>
      <div style={{ position: "relative", marginTop: 22, animation: "wnPop .5s" }}>
        <StatRing pct={score / total} size={172} stroke={12} value={`${score}/${total}`} sub={`${pct}%`} />
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginTop: 26, padding: "10px 18px", borderRadius: 999, background: "linear-gradient(120deg, var(--amber1), var(--amber2))", color: "#1a0e02", boxShadow: "0 8px 26px rgba(255,138,43,0.4)" }}>
        <Icon name={tier.ic} size={20} fill="#1a0e02" /><span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 15 }}>{tr(tier.b)}</span>
      </div>
      <div style={{ width: "100%", marginTop: 30 }}>
        <Eyebrow style={{ marginBottom: 12 }}>{tr("Wat je leerde")}</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {questions.map((q, i) => (
            <div key={i} style={{ display: "flex", gap: 11, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 11 }}>
              {byId[q.film] && <div style={{ width: 32, height: 48, flexShrink: 0, borderRadius: 7 }}><Poster film={byId[q.film]} showText={false} rounded={7} /></div>}
              <div style={{ fontFamily: "var(--sans)", fontSize: 12, lineHeight: 1.38, color: "var(--tx2)" }}>{q.fact}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 22 }}>
        <GlowButton size="m" variant="ghost" icon="refresh" full onClick={() => onClose(true)}>{tr("Opnieuw")}</GlowButton>
        <GlowButton size="m" full icon="check" onClick={() => onClose(false)}>{tr("Klaar")}</GlowButton>
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}

export function QuizFlow() {
  const { t, tr, quizScope, endQuiz } = useWN();
  const { quiz } = getCatalog();
  const questions = (() => {
    if (quizScope && quizScope !== "all") { const f = quiz.filter((q) => q.film === quizScope); if (f.length) return f; }
    return quiz;
  })();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = questions[i];
  const correct = picked === q.answer;

  const choose = (idx: number) => {
    if (picked != null) return;
    setPicked(idx);
    if (idx === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (i < questions.length - 1) { setI(i + 1); setPicked(null); }
    else setDone(true);
  };

  if (done) return <QuizResult score={score} total={questions.length} onClose={endQuiz} questions={questions} />;

  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, var(--bg2), var(--bg))", zIndex: 50, display: "flex", flexDirection: "column", animation: "wnFade .25s" }}>
      <div style={{ padding: "52px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => endQuiz()} style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--line)", color: "var(--tx2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="close" size={19} /></button>
          <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--surface3)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((i + (picked != null ? 1 : 0)) / questions.length) * 100}%`, background: "linear-gradient(90deg, var(--amber1), var(--amber2))", borderRadius: 999, transition: "width .4s cubic-bezier(.2,.8,.2,1)" }} />
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--tx2)" }}>{i + 1}/{questions.length}</span>
        </div>
      </div>

      <div className="wn-scroll" style={{ flex: 1, padding: "28px 20px 16px", display: "flex", flexDirection: "column" }}>
        <Eyebrow>{tr("Vraag {n}", { n: i + 1 })}</Eyebrow>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 25, lineHeight: 1.15, color: "var(--tx)", marginTop: 10 }}>{q.q}</div>

        <div style={{ flex: 1 }} />

        {t.quizStyle === "swipe"
          ? <SwipeOptions key={i} q={q} picked={picked} onPick={choose} />
          : <TapOptions q={q} picked={picked} correct={correct} onPick={choose} />}

        {picked != null && (
          <div style={{ marginTop: 18, animation: "wnFadeUp .3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: correct ? "linear-gradient(120deg, var(--amber1), var(--amber2))" : "var(--surface3)", color: correct ? "#1a0e02" : "var(--tx2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={correct ? "check" : "close"} size={18} stroke={2.4} /></div>
              <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 16, color: correct ? "var(--amber2)" : "var(--tx)" }}>{correct ? tr("Goed!") : tr("Helaas")}</span>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 14, display: "flex", gap: 11 }}>
              {getCatalog().byId[q.film] && <div style={{ width: 38, height: 56, flexShrink: 0, borderRadius: 8 }}><Poster film={getCatalog().byId[q.film]} showText={false} rounded={8} /></div>}
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: 1, color: "var(--amber2)" }}>{tr("WIST JE DAT?")}</div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.4, color: "var(--tx2)", marginTop: 5 }}>{q.fact}</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}><GlowButton size="l" full icon="chevron" onClick={next}>{i < questions.length - 1 ? tr("Volgende vraag") : tr("Naar uitslag")}</GlowButton></div>
          </div>
        )}
      </div>
    </div>
  );
}
