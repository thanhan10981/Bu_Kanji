export interface KanaState { value: string; caret: number; nn?: number }

const syllables: Record<string, string> = {};
for (const [prefix, kana] of Object.entries({
  '': 'あいうえお', k: 'かきくけこ', g: 'がぎぐげご', s: 'さしすせそ', z: 'ざじずぜぞ',
  t: 'たちつてと', d: 'だぢづでど', n: 'なにぬねの', h: 'はひふへほ', b: 'ばびぶべぼ',
  p: 'ぱぴぷぺぽ', m: 'まみむめも', r: 'らりるれろ', w: 'わゐうゑを',
  x: 'ぁぃぅぇぉ', l: 'ぁぃぅぇぉ', v: 'ゔぁゔぃゔゔぇゔぉ',
})) {
  if (prefix === 'v') continue;
  [...'aiueo'].forEach((vowel, i) => { syllables[prefix + vowel] = [...kana][i]; });
}
for (const [prefix, kana] of Object.entries({ ky: 'き', gy: 'ぎ', sy: 'し', sh: 'し', zy: 'じ', jy: 'じ', j: 'じ', ty: 'ち', ch: 'ち', cy: 'ち', dy: 'ぢ', ny: 'に', hy: 'ひ', by: 'び', py: 'ぴ', my: 'み', ry: 'り' })) {
  for (const [vowel, small] of Object.entries({ a: 'ゃ', u: 'ゅ', o: 'ょ' })) syllables[prefix + vowel] = kana + small;
}
Object.assign(syllables, { shi: 'し', chi: 'ち', tsu: 'つ', fu: 'ふ', ji: 'じ', ya: 'や', yu: 'ゆ', yo: 'よ', ye: 'いぇ', wo: 'を',
  fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ', va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ',
  xtsu: 'っ', ltsu: 'っ', xtu: 'っ', ltu: 'っ', xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ', lya: 'ゃ', lyu: 'ゅ', lyo: 'ょ', '-': 'ー',
  she: 'しぇ', che: 'ちぇ', je: 'じぇ', ti: 'ち', di: 'ぢ', du: 'づ', wi: 'うぃ', we: 'うぇ' });

function convert(raw: string) {
  let value = ''; let nn = false;
  raw = raw.toLowerCase();
  for (let i = 0; i < raw.length;) {
    const rest = raw.slice(i);
    if (rest.startsWith('nn')) { value += 'ん'; i += 2; nn = i === raw.length; continue; }
    if (rest.startsWith("n'")) { value += 'ん'; i += 2; continue; }
    if (rest.length > 1 && rest[0] === rest[1] && /[bcdfghjklmpqrstvwxyz]/.test(rest[0])) { value += 'っ'; i++; continue; }
    if (rest[0] === 'n' && rest.length > 1 && !/[aeiouyn]/.test(rest[1])) { value += 'ん'; i++; continue; }
    let found = false;
    for (let length = Math.min(4, rest.length); length > 0; length--) {
      const kana = syllables[rest.slice(0, length)];
      if (kana) { value += kana; i += length; found = true; break; }
    }
    if (!found) { value += raw[i]; i++; }
  }
  return { value, nn };
}

export function editKana(previous: KanaState, next: string, caret: number, inputType = 'insertText'): KanaState {
  if (inputType.startsWith('delete')) return { value: next, caret };
  let before = next.slice(0, caret);
  const after = next.slice(caret);
  if (previous.nn === previous.caret && inputType === 'insertText' && caret === previous.caret + 1
    && next.slice(0, previous.caret) === previous.value.slice(0, previous.caret)
    && next.slice(caret) === previous.value.slice(previous.caret)
    && /[aeiouy]/i.test(next[previous.caret])) {
    before = before.slice(0, previous.caret) + 'n' + before.slice(previous.caret);
  }
  const run = before.match(/[a-z'-]+$/i);
  if (!run) return { value: next, caret };
  const converted = convert(run[0]);
  const prefix = before.slice(0, -run[0].length) + converted.value;
  return { value: prefix + after, caret: prefix.length, ...(converted.nn ? { nn: prefix.length } : {}) };
}

export function finalizeKana(value: string) { return value.replace(/n$/i, 'ん'); }
