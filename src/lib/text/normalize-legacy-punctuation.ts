const legacyPunctuation: Record<string, string> = {
  "\u0085": "…",
  "\u0091": "‘",
  "\u0092": "’",
  "\u0093": "“",
  "\u0094": "”",
  "\u0096": "–",
  "\u0097": "—",
};

export function normalizeLegacyPunctuation(value: string) {
  return value.replace(/[\u0085\u0091-\u0094\u0096\u0097]/g, (character) => {
    return legacyPunctuation[character] ?? character;
  });
}
