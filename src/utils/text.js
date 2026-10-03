const STOP = new Set(
  (
    'the and for are but not you all can had her was one our out has have this that with from they been were will your what when ' +
    'there their them then than which would about into more some could other these those also just like over such only very ' +
    'its his she him how who why where while being does did doing both each most much many any because'
  ).split(' ')
);

export function countWords(t) {
  const m = t.match(/\S+/g);
  return m ? m.length : 0;
}

export function getStats(t) {
  const trimmed = t.trim();
  const words = countWords(t);
  const sentences = trimmed ? (trimmed.match(/[.!?]+(?=\s|$)/g) || []).length || 1 : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  return {
    words,
    chars: t.length,
    noSpaces: t.replace(/\s/g, '').length,
    lines: t ? t.split('\n').length : 0,
    sentences,
    paragraphs,
    readMin: words / 225,
    speakMin: words / 130,
  };
}

export function getKeywords(t, limit = 8) {
  const freq = new Map();
  (t.toLowerCase().match(/[\p{L}\p{N}'’]+/gu) || []).forEach((w) => {
    if (w.length > 3 && !STOP.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
  });
  return [...freq.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

export function fmtTime(min) {
  if (min <= 0) return '0 min';
  if (min < 1) return '< 1 min';
  return `${Math.round(min)} min`;
}

export const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const MAX_MATCHES = 10000;

export function findMatches(text, query, { caseSensitive, regex }) {
  if (!query) return { matches: [], error: '' };
  let re;
  try {
    re = new RegExp(regex ? query : escapeRegExp(query), caseSensitive ? 'g' : 'gi');
  } catch (e) {
    return { matches: [], error: 'Invalid pattern' };
  }
  const matches = [];
  let m;
  while ((m = re.exec(text)) !== null && matches.length < MAX_MATCHES) {
    if (m[0] === '') {
      re.lastIndex++;
      continue;
    }
    matches.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return { matches, error: '' };
}

// Index in `to` where the edit that turned `from` into `to` ends — used to park the caret after undo/redo.
export function changeEnd(from, to) {
  const max = Math.min(from.length, to.length);
  let p = 0;
  while (p < max && from[p] === to[p]) p++;
  let q = 0;
  while (q < max - p && from[from.length - 1 - q] === to[to.length - 1 - q]) q++;
  return to.length - q;
}

export const slugify = (s) =>
  s
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
