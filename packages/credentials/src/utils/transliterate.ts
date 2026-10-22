// cspell:disable -- transliteration table and examples of names in other scripts
/*
 * ICAO Doc 9303 Part 3, section 6: the transliteration passports print in their Latin fields
 * and MRZ, so a name comes out the way the document itself spells it. Keys are uppercase; a
 * Latin letter missing here just loses its diacritics (Č -> C), as the standard prescribes.
 */
const ICAO: Record<string, string> = {
  // Latin letters with a transliteration of their own (Table A).
  Ä: "AE",
  Å: "AA",
  Æ: "AE",
  Ð: "D",
  Ö: "OE",
  Ø: "OE",
  Ü: "UE",
  Þ: "TH",
  ß: "SS",
  ẞ: "SS",
  Đ: "D",
  Ħ: "H",
  Ĳ: "IJ",
  Ŀ: "L",
  Ł: "L",
  Ŋ: "N",
  Œ: "OE",
  Ŧ: "T",

  // Cyrillic (Table B).
  А: "A",
  Б: "B",
  В: "V",
  Г: "G",
  Д: "D",
  Е: "E",
  Ё: "E",
  Ж: "ZH",
  З: "Z",
  И: "I",
  Й: "I",
  К: "K",
  Л: "L",
  М: "M",
  Н: "N",
  О: "O",
  П: "P",
  Р: "R",
  С: "S",
  Т: "T",
  У: "U",
  Ф: "F",
  Х: "KH",
  Ц: "TS",
  Ч: "CH",
  Ш: "SH",
  Щ: "SHCH",
  Ъ: "IE",
  Ы: "Y",
  Ь: "",
  Э: "E",
  Ю: "IU",
  Я: "IA",
  Ђ: "D",
  Ѓ: "G",
  Є: "IE",
  Ѕ: "DZ",
  І: "I",
  Ї: "I",
  Ј: "J",
  Љ: "LJ",
  Њ: "NJ",
  Ћ: "C",
  Ќ: "K",
  Ў: "U",
  Џ: "DZ",
  Ґ: "G",
};

function transliterateChar(char: string, next: string | undefined): string {
  const upper = char.toUpperCase();
  // `ß` is looked up as itself: its uppercase is the two letters `SS`.
  const latin = ICAO[char] ?? ICAO[upper];

  if (latin === undefined) return char.normalize("NFD").replace(/\p{M}/gu, "");
  if (char !== upper) return latin.toLowerCase();

  // A capital opening a lowercase word reads `Zh`, one inside an all-caps word `ZH`.
  return next !== undefined && next !== next.toUpperCase()
    ? latin.charAt(0) + latin.slice(1).toLowerCase()
    : latin;
}

/**
 * Transliterates `value` to ASCII Latin per ICAO 9303, keeping its letter case (`Жанна` ->
 * `Zhanna`, `Müller` -> `Mueller`). Returns `undefined` when a character has no transliteration,
 * rather than a half-Latin string.
 *
 * shortcut: Latin and Cyrillic only; Greek, Arabic, CJK and others yield `undefined`, add their
 * tables when a credential needs them.
 */
export function transliterateIcao(value: string): string | undefined {
  const chars = [...value.normalize("NFC")];
  const latin = chars.map((char, index) => transliterateChar(char, chars[index + 1])).join("");

  // oxlint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(latin) ? latin : undefined;
}

type TransliterationLoader = () => Promise<{ transliterate: (value: string) => string }>;

let loadLibrary: TransliterationLoader | undefined;

/**
 * Hands this package the `transliteration` library that `<field>Latin` reads. It is an
 * optional peer dependency this package never imports itself: its tables are ~55 KB gzipped,
 * and an import here would fail the build of every app that has not installed it. The app
 * owns the import, so its bundler splits the tables into a chunk loaded on first use:
 *
 * ```ts
 * registerTransliteration(() => import("transliteration"));
 * ```
 */
export function registerTransliteration(load: TransliterationLoader): void {
  loadLibrary = load;
}

/**
 * Transliterates `value` to the conventional Latin spelling a reader expects (`Юлия` ->
 * `Yuliya`), covering nearly every script. Needs `registerTransliteration()` first.
 */
export async function transliterateLatin(value: string): Promise<string> {
  if (!loadLibrary) {
    throw new Error(
      'Latin transliteration needs the "transliteration" package: install it, then call registerTransliteration(() => import("transliteration")) from @idos-network/credentials/utils once at startup',
    );
  }

  const { transliterate } = await loadLibrary();

  return transliterate(value);
}
