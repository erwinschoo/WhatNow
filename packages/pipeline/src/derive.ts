/* Automatische afleiding van thema- en feel-scores (0–10) uit de film-embeddings.
 * Per as embedden we een rijke Nederlandse descriptor-zin; de cosine-similarity van elke film met
 * die descriptor wordt per as percentiel-genormaliseerd over de hele catalogus → 0–10. Zo krijgt
 * elke dimensie een volle spreiding (goed voor de gradient en de sliders). Gratis en schaalbaar. */
import { cosine, embedMany } from "./embed.js";
import type { FeelKey, ThemeKey } from "./types.js";

export const THEME_DESCRIPTORS: Record<ThemeKey, string> = {
  herinnering: "Een film over herinnering en geheugen, het verleden dat terugkomt, nostalgie, en wat we ons herinneren of juist vergeten.",
  identiteit: "Een film over identiteit, wie iemand werkelijk is, de zoektocht naar jezelf, zelfbeeld en innerlijke transformatie.",
  eenzaamheid: "Een film over eenzaamheid en isolatie, alleen zijn, vervreemding, en het verlangen naar verbinding met anderen.",
  tijd: "Een film over tijd, het verstrijken van de jaren, vergankelijkheid, en de onomkeerbaarheid van het bestaan.",
  klasse: "Een film over klasse en sociale ongelijkheid, arm tegenover rijk, status, macht en maatschappelijke kloof.",
  verlangen: "Een film over verlangen en begeerte, onvervulde of verboden liefde, passie en hunkering.",
  lot: "Een film over het lot en het noodlot, toeval, onontkoombaarheid en krachten buiten iemands controle.",
  dromen: "Een film over dromen en het onderbewuste, surrealisme, fantasie, en de grens tussen droom en werkelijkheid.",
  technologie: "Een film over technologie en kunstmatige intelligentie, de toekomst, machines, en de invloed van techniek op de mens.",
  geweld: "Een film over geweld en wreedheid, wraak, misdaad en de gevolgen van bloedvergieten.",
  familie: "Een film over familie, ouders en kinderen, broers en zussen, familiebanden en gezinsconflicten.",
  hebzucht: "Een film over hebzucht en ambitie, geldzucht, macht, en de prijs van het najagen van rijkdom en succes.",
  geloof: "Een film over geloof en religie, God, twijfel, moraal en de zoektocht naar zingeving.",
  verlies: "Een film over verlies en rouw, de dood van een dierbare, afscheid en verdriet.",
};

export const FEEL_DESCRIPTORS: Record<FeelKey, string> = {
  cinematography: "Een visueel beeldschone, schilderachtige film met prachtige cinematografie, sterke beeldtaal en zorgvuldige compositie.",
  intrigue: "Een raadselachtige, mysterieuze film vol wendingen en geheimen, een complexe puzzel die je aan het denken zet.",
  comedic: "Een grappige, speelse en lichtvoetige film met humor, komedie en absurde situaties.",
  emotional: "Een hartverscheurende, emotioneel diepe film die ontroert, raakt en tranen oproept.",
  pace: "Een strakke, snelle en spannende film met hoog tempo, veel actie en weinig stilstand.",
};

/* Rang-percentiel → 0–10 (gelijkmatige spreiding per as). */
function percentile(values: number[]): number[] {
  const order = values.map((v, i) => [v, i] as [number, number]).sort((a, b) => a[0] - b[0]);
  const out = new Array<number>(values.length);
  const n = values.length;
  order.forEach(([, i], rank) => { out[i] = n <= 1 ? 5 : Math.round((rank / (n - 1)) * 10); });
  return out;
}

/* Score elke film op elke as (themes of feels) → array van Records (per film), 0–10 per as.
 *
 * Twee normalisaties tegen "hubness" (sommige films lijken op álle descriptors door een rijke/lange
 * plottekst en zouden anders overal hoog scoren):
 *  1) per film: trek het gemiddelde over de assen af → houdt over wélke thema's er voor déze film
 *     uitspringen, niet hoe "generiek cinematografisch" de tekst is.
 *  2) per as: rang-percentiel over alle films → volle 0–10-spreiding per dimensie. */
export async function scoreAxes<K extends string>(
  filmVectors: number[][],
  descriptors: Record<K, string>,
): Promise<Record<K, number>[]> {
  const keys = Object.keys(descriptors) as K[];
  const axisVectors = await embedMany(keys.map((k) => descriptors[k]));

  // raw[film][as]
  const raw = filmVectors.map((fv) => axisVectors.map((av) => cosine(fv, av)));
  // 1) per film centreren (rij-gemiddelde eraf)
  for (const row of raw) {
    const mean = row.reduce((a, b) => a + b, 0) / row.length;
    for (let ai = 0; ai < row.length; ai++) row[ai] -= mean;
  }
  // 2) per as percentiel over films
  const result: Record<K, number>[] = filmVectors.map(() => ({} as Record<K, number>));
  keys.forEach((k, ai) => {
    percentile(raw.map((row) => row[ai])).forEach((s, fi) => { result[fi][k] = s; });
  });
  return result;
}
