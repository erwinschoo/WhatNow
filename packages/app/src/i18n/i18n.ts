/* Vertaallaag — geport uit het prototype (i18n.jsx: makeTr).
 * Nederlandse bronstrings zijn de sleutels. Bij taal 'nl', een onbekende taal, of een ontbrekende
 * sleutel valt de output terug op de bronstring, zodat de UI altijd rendert. {var}-tokens worden
 * door waarden uit `vars` vervangen. */
import { DICT, type LangId } from "./dict";

export type Tr = (s: string, vars?: Record<string, string | number>) => string;

export function makeTr(lang: LangId): Tr {
  const d = lang === "nl" ? null : (DICT[lang] ?? null);
  return (s, vars) => {
    let out = d == null || d[s] == null ? s : d[s];
    if (vars) for (const k in vars) out = out.split("{" + k + "}").join(String(vars[k]));
    return out;
  };
}
