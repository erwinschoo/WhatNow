/* Claude-verrijking: per film de feel-sliders (0–10), thema's, 'waarom', NL-synopsis, trivia,
 * quizvragen en een posterkleur-gradient. Eén gestructureerde call per film (structured outputs). */
import Anthropic from "@anthropic-ai/sdk";
import type { Enrichment, RawFilm } from "./types.js";

const MODEL = process.env.WHATNOW_MODEL ?? "claude-opus-4-8";

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY ontbreekt (zie .env.example).");
  if (!client) client = new Anthropic();
  return client;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    feel: {
      type: "object",
      additionalProperties: false,
      properties: {
        cinematography: { type: "integer", description: "0=functioneel, 10=schilderachtig" },
        intrigue: { type: "integer", description: "0=rechttoe, 10=raadselachtig" },
        comedic: { type: "integer", description: "0=bloedserieus, 10=speels" },
        emotional: { type: "integer", description: "0=koel, 10=hartverscheurend" },
        pace: { type: "integer", description: "0=beschouwend/traag, 10=strak/snel" },
      },
      required: ["cinematography", "intrigue", "comedic", "emotional", "pace"],
    },
    themes: { type: "array", items: { type: "string" }, description: "3–4 kernthema's in het Nederlands, bv. Eenzaamheid, Zelfontdekking" },
    why: { type: "string", description: "Eén zin (NL) waarom iemand met deze smaak dit zou waarderen" },
    synopsis: { type: "string", description: "2–3 zinnen synopsis in het Nederlands, spoilervrij" },
    trivia: { type: "array", items: { type: "string" }, description: "2 'wist je dat'-feiten in het Nederlands" },
    quiz: {
      type: "array",
      description: "2 meerkeuzevragen (NL) over deze film",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          q: { type: "string" },
          options: { type: "array", items: { type: "string" }, description: "exact 4 opties" },
          answer: { type: "integer", description: "index 0-3 van het juiste antwoord" },
          fact: { type: "string", description: "korte toelichting (NL)" },
        },
        required: ["q", "options", "answer", "fact"],
      },
    },
    grad: { type: "array", items: { type: "string" }, description: "exact 2 donkere hex-kleuren voor een posterplaceholder-gradient, bv. #3a1d4d" },
    ink: { type: "string", description: "1 lichtere hex-accentkleur die bij de film past" },
  },
  required: ["feel", "themes", "why", "synopsis", "trivia", "quiz", "grad", "ink"],
} as const;

const SYSTEM =
  "Je bent een filmcurator voor WhatNow, een Nederlandstalige film-aanbevelingsapp. " +
  "Je beoordeelt films op 'feel'-dimensies (0–10), benoemt thema's, en schrijft beknopte, " +
  "spoilervrije teksten in natuurlijk Nederlands. Wees accuraat en specifiek per film.";

const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n)));

export async function enrich(raw: RawFilm): Promise<Enrichment> {
  const userText =
    `Film: ${raw.title} (${raw.year}), regie ${raw.dir}.\n` +
    `Genres: ${raw.genres.join(", ") || "onbekend"}.\n` +
    `TMDB-keywords: ${raw.keywords.slice(0, 25).join(", ") || "geen"}.\n` +
    `Beschrijving (TMDB): ${raw.overview || "geen"}.\n\n` +
    `Geef de verrijking volgens het schema.`;

  // output_config (structured outputs + effort) is GA op de API maar mogelijk nog niet getypeerd
  // in de vastgezette SDK-versie → cast naar any voor de request.
  const res = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    output_config: {
      format: { type: "json_schema", name: "enrichment", schema: SCHEMA },
      effort: "low",
    },
    messages: [{ role: "user", content: userText }],
  } as any);

  if (res.stop_reason === "refusal") throw new Error(`Claude weigerde verrijking voor ${raw.title}`);
  const textBlock = res.content.find((b: any): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error(`Geen tekst-output voor ${raw.title}`);
  const parsed = JSON.parse(textBlock.text) as Enrichment;

  // Clamp/normaliseer wat het model teruggaf.
  parsed.feel = {
    cinematography: clamp(parsed.feel.cinematography),
    intrigue: clamp(parsed.feel.intrigue),
    comedic: clamp(parsed.feel.comedic),
    emotional: clamp(parsed.feel.emotional),
    pace: clamp(parsed.feel.pace),
  };
  parsed.themes = parsed.themes.slice(0, 4);
  parsed.trivia = parsed.trivia.slice(0, 3);
  parsed.quiz = parsed.quiz
    .filter((q) => Array.isArray(q.options) && q.options.length >= 2)
    .map((q) => ({ ...q, options: q.options.slice(0, 4), answer: Math.max(0, Math.min(q.options.length - 1, q.answer)) }))
    .slice(0, 2);
  if (parsed.grad.length < 2) parsed.grad = ["#2a2a33", "#0d0d12"];
  parsed.grad = [parsed.grad[0], parsed.grad[1]] as [string, string];
  return parsed;
}
