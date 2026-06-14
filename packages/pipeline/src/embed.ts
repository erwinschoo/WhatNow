/* Lokale embeddings (gratis, @xenova/transformers). Eén keer per film berekend en hergebruikt voor
 * zowel thema-/feel-scoring als de thematische ketens.
 *
 * Meertalig model: onze plotteksten én thema-descriptors zijn Nederlands. Een Engels-getraind model
 * (all-MiniLM-L6-v2) geeft zwakke Nederlandse semantiek; paraphrase-multilingual-MiniLM-L12-v2 lijnt
 * Nederlandse zinnen correct uit en verbetert zowel thema-scores als ketens aanzienlijk. */
import { pipeline } from "@xenova/transformers";

const MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

type Extractor = (text: string, opts: { pooling: "mean"; normalize: boolean }) => Promise<{ data: Float32Array }>;
let extractor: Extractor | null = null;

async function getExtractor(): Promise<Extractor> {
  if (!extractor) extractor = (await pipeline("feature-extraction", MODEL)) as unknown as Extractor;
  return extractor;
}

/* Embed een lijst teksten → genormaliseerde vectoren. */
export async function embedMany(texts: string[]): Promise<number[][]> {
  const ex = await getExtractor();
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    const r = await ex(texts[i] || " ", { pooling: "mean", normalize: true });
    out.push(Array.from(r.data));
    if (texts.length > 200 && i % 200 === 0 && i) process.stdout.write(`    …embedded ${i}/${texts.length}\n`);
  }
  return out;
}

/* Cosine-similarity van genormaliseerde vectoren = dotproduct. */
export function cosine(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/* Top-N dichtstbijzijnde buren (exclusief de film zelf) per film. */
export function computeChains(ids: string[], vectors: number[][], topN = 6): Record<string, string[]> {
  const chains: Record<string, string[]> = {};
  for (let i = 0; i < ids.length; i++) {
    chains[ids[i]] = ids
      .map((id, j) => ({ id, sim: i === j ? -1 : cosine(vectors[i], vectors[j]) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, topN)
      .map((x) => x.id);
  }
  return chains;
}
