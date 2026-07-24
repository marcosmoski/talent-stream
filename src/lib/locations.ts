// Curated, Portugal-first city list + alias normalization.
//
// Recruiters were typing the same place different ways ("Lisbon" vs "Lisboa",
// "Oporto" vs "Porto", EN vs PT), which fragmented the board and reports. This
// gives a single canonical spelling per place and a normalizer that folds the
// common variants into it. Free text is still allowed — we only normalize what
// we recognize.

// Canonical display values. Portuguese spelling, "City, PT" for national ones,
// with a few nearshore hubs and Remote for distributed roles.
export const CITY_OPTIONS: string[] = [
  "Remote",
  "Lisboa, PT",
  "Porto, PT",
  "Braga, PT",
  "Coimbra, PT",
  "Aveiro, PT",
  "Faro, PT",
  "Setúbal, PT",
  "Leiria, PT",
  "Viseu, PT",
  "Guarda, PT",
  "Viana do Castelo, PT",
  "Vila Real, PT",
  "Bragança, PT",
  "Castelo Branco, PT",
  "Évora, PT",
  "Beja, PT",
  "Portalegre, PT",
  "Santarém, PT",
  "Funchal, PT",
  "Ponta Delgada, PT",
  "Matosinhos, PT",
  "Vila Nova de Gaia, PT",
  "Cascais, PT",
  "Sintra, PT",
  "Oeiras, PT",
  "Almada, PT",
  "Guimarães, PT",
  "Barcelos, PT",
  "Vila Nova de Famalicão, PT",
  "Figueira da Foz, PT",
  "Covilhã, PT",
  "Loulé, PT",
  "Portimão, PT",
  // Nearshore hubs
  "Madrid, ES",
  "Barcelona, ES",
  "London, UK",
];

// Lowercased alias -> canonical value. Keys are matched after stripping any
// trailing country token (", pt" / ", portugal") so "Lisbon, PT" folds too.
const ALIASES: Record<string, string> = {
  // Lisboa
  lisbon: "Lisboa, PT",
  lisboa: "Lisboa, PT",
  lisbonne: "Lisboa, PT",
  // Porto
  porto: "Porto, PT",
  oporto: "Porto, PT",
  // Others with EN/alt spellings
  coimbra: "Coimbra, PT",
  braga: "Braga, PT",
  aveiro: "Aveiro, PT",
  faro: "Faro, PT",
  setubal: "Setúbal, PT",
  evora: "Évora, PT",
  funchal: "Funchal, PT",
  madeira: "Funchal, PT",
  "ponta delgada": "Ponta Delgada, PT",
  azores: "Ponta Delgada, PT",
  acores: "Ponta Delgada, PT",
  gaia: "Vila Nova de Gaia, PT",
  famalicao: "Vila Nova de Famalicão, PT",
  guimaraes: "Guimarães, PT",
  covilha: "Covilhã, PT",
  loule: "Loulé, PT",
  portimao: "Portimão, PT",
  santarem: "Santarém, PT",
  braganca: "Bragança, PT",
  // Non-national
  madrid: "Madrid, ES",
  barcelona: "Barcelona, ES",
  london: "London, UK",
  londres: "London, UK",
  // Remote variants
  remote: "Remote",
  remoto: "Remote",
  "100% remote": "Remote",
};

// Strip accents so "Évora" / "evora" compare equal.
const COMBINING_MARKS = /[̀-ͯ]/g;
function fold(s: string): string {
  return s.normalize("NFD").replace(COMBINING_MARKS, "");
}

/**
 * Fold a free-typed location into its canonical spelling when we recognize it,
 * otherwise return the trimmed input untouched (custom places stay as typed).
 */
export function normalizeLocation(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Drop a trailing country token to match the city aliases.
  const cityPart = trimmed.replace(/,\s*(pt|portugal|es|spain|uk|united kingdom)\s*$/i, "").trim();
  const key = fold(cityPart).toLowerCase();

  return ALIASES[key] ?? trimmed;
}
