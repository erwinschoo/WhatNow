/* Lokale embeddings (gratis, via @xenova/transformers — all-MiniLM-L6-v2) om per film de
 * dichtstbijzijnde thematische buren te bepalen. Dit vervangt de hardgecodeerde CHAINS uit het
 * design door semantische gelijkenis over plot + thema's + keywords. */
import { pipeline } from "@xenova/transformers";

export interface EmbedInput {
  id: string;
  text: string;
}

/* Bouw per film een buren-keten (top-N) op cosine-similarity van genormaliseerde embeddings. */
export async function computeChains(items: EmbedInput[], topN = 6): Promise<Record<string, string[]>> {
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const vectors: number[][] = [];
  for (const it of items) {
    const out: any = await extractor(it.text, { pooling: "mean", normalize: true });
    vectors.push(Array.from(out.data as Float32Array));
  }

  const dot = (a: number[], b: number[]) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s; // genormaliseerd → dit is de cosine-similarity
  };

  const chains: Record<string, string[]> = {};
  for (let i = 0; i < items.length; i++) {
    const sims = items
      .map((other, j) => ({ id: other.id, sim: i === j ? -1 : dot(vectors[i], vectors[j]) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, topN)
      .map((x) => x.id);
    chains[items[i].id] = sims;
  }
  return chains;
}
