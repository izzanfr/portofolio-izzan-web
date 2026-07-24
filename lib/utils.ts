/**
 * Chooses "a" or "an" for the word that follows.
 *
 * English picks the article by SOUND, not spelling, so this splits into two
 * cases. When the phrase opens with an acronym read letter-by-letter ("AI" →
 * "ay-eye", "IT" → "eye-tee", "SPBE" → "es-…"), the sound is the NAME of its
 * first letter, and the letters A E F H I L M N O R S X are all spoken starting
 * on a vowel — so those take "an" even though most are consonants. For an
 * ordinary word the first letter is the sound, minus the vowels that are read as
 * consonants ("University" → "you", "one" → "wun").
 *
 * Current roles: "IT …" and "AI …" → an; "Data …" → a.
 */
const ACRONYM_VOWEL_SOUND = new Set(["A", "E", "F", "H", "I", "L", "M", "N", "O", "R", "S", "X"]);
const WORD_VOWELS = new Set(["a", "e", "i", "o", "u"]);
// Ordinary words opening on a vowel letter but a consonant sound.
const CONSONANT_SOUND_PREFIXES = ["uni", "use", "usu", "eu", "ewe", "one", "once"];

export function indefiniteArticle(phrase: string): "a" | "an" {
  const word = phrase.trim().split(/\s+/)[0] ?? "";
  if (!word) return "a";

  // Acronym read letter-by-letter: two or more letters, all uppercase.
  if (word.length >= 2 && /^[A-Z]+$/.test(word)) {
    return ACRONYM_VOWEL_SOUND.has(word[0]) ? "an" : "a";
  }

  const lower = word.toLowerCase();
  if (CONSONANT_SOUND_PREFIXES.some((prefix) => lower.startsWith(prefix))) return "a";
  return WORD_VOWELS.has(lower[0]) ? "an" : "a";
}

type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Tiny classnames joiner — keeps component markup readable without a dependency. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(" ");
}
