// Pure text transforms. Each `run` takes a string and returns a string (or throws if the input is invalid).

const splitWords = (s) =>
  s
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

const perLine = (fn) => (s) => s.split('\n').map(fn).join('\n');
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);

const utf8ToBase64 = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
};

const base64ToUtf8 = (s) => {
  const bin = atob(s.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};

export const TRANSFORMS = [
  // Case
  { id: 'upper', group: 'Case', label: 'UPPERCASE', run: (s) => s.toUpperCase() },
  { id: 'lower', group: 'Case', label: 'lowercase', run: (s) => s.toLowerCase() },
  {
    id: 'title',
    group: 'Case',
    label: 'Title Case',
    run: (s) => s.toLowerCase().replace(/(^|[\s\-("“])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()),
  },
  {
    id: 'sentence',
    group: 'Case',
    label: 'Sentence case',
    run: (s) => s.toLowerCase().replace(/(^|[.!?]\s+|\n\s*)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()),
  },
  {
    id: 'camel',
    group: 'Case',
    label: 'camelCase',
    run: perLine((l) =>
      splitWords(l)
        .map((w, i) => (i ? cap(w.toLowerCase()) : w.toLowerCase()))
        .join('')
    ),
  },
  {
    id: 'pascal',
    group: 'Case',
    label: 'PascalCase',
    run: perLine((l) => splitWords(l).map((w) => cap(w.toLowerCase())).join('')),
  },
  {
    id: 'snake',
    group: 'Case',
    label: 'snake_case',
    run: perLine((l) => splitWords(l).map((w) => w.toLowerCase()).join('_')),
  },
  {
    id: 'kebab',
    group: 'Case',
    label: 'kebab-case',
    run: perLine((l) => splitWords(l).map((w) => w.toLowerCase()).join('-')),
  },
  {
    id: 'constant',
    group: 'Case',
    label: 'CONSTANT_CASE',
    run: perLine((l) => splitWords(l).map((w) => w.toUpperCase()).join('_')),
  },

  // Lines
  {
    id: 'sortAsc',
    group: 'Lines',
    label: 'Sort A → Z',
    run: (s) => s.split('\n').sort((a, b) => a.localeCompare(b)).join('\n'),
  },
  {
    id: 'sortDesc',
    group: 'Lines',
    label: 'Sort Z → A',
    run: (s) => s.split('\n').sort((a, b) => b.localeCompare(a)).join('\n'),
  },
  { id: 'reverseLines', group: 'Lines', label: 'Reverse lines', run: (s) => s.split('\n').reverse().join('\n') },
  {
    id: 'dedupe',
    group: 'Lines',
    label: 'Remove duplicate lines',
    run: (s) => [...new Set(s.split('\n'))].join('\n'),
  },
  {
    id: 'removeEmpty',
    group: 'Lines',
    label: 'Remove empty lines',
    run: (s) =>
      s
        .split('\n')
        .filter((l) => l.trim() !== '')
        .join('\n'),
  },
  {
    id: 'numberLines',
    group: 'Lines',
    label: 'Number lines',
    run: (s) =>
      s
        .split('\n')
        .map((l, i) => `${i + 1}. ${l}`)
        .join('\n'),
  },
  {
    id: 'bullets',
    group: 'Lines',
    label: 'Make bullet list',
    run: (s) =>
      s
        .split('\n')
        .map((l) => (l.trim() ? `- ${l}` : l))
        .join('\n'),
  },
  { id: 'reverseText', group: 'Lines', label: 'Reverse text', run: (s) => [...s].reverse().join('') },

  // Cleanup
  { id: 'trimLines', group: 'Cleanup', label: 'Trim line edges', run: perLine((l) => l.trim()) },
  {
    id: 'extraSpaces',
    group: 'Cleanup',
    label: 'Remove extra spaces',
    run: perLine((l) => l.replace(/[ \t]+/g, ' ').trim()),
  },
  {
    id: 'collapseBlank',
    group: 'Cleanup',
    label: 'Collapse blank lines',
    run: (s) => s.replace(/\n{3,}/g, '\n\n'),
  },
  {
    id: 'stripPunct',
    group: 'Cleanup',
    label: 'Strip punctuation',
    run: (s) => s.replace(/[^\p{L}\p{N}\s]/gu, ''),
  },
  {
    id: 'smartQuotes',
    group: 'Cleanup',
    label: 'Smart quotes',
    run: (s) =>
      s
        .replace(/(^|[\s([{])"/g, '$1“')
        .replace(/"/g, '”')
        .replace(/(^|[\s([{])'/g, '$1‘')
        .replace(/'/g, '’'),
  },

  // Encode
  { id: 'b64enc', group: 'Encode', label: 'Base64 encode', run: utf8ToBase64 },
  { id: 'b64dec', group: 'Encode', label: 'Base64 decode', run: base64ToUtf8 },
  { id: 'urlenc', group: 'Encode', label: 'URL encode', run: (s) => encodeURIComponent(s) },
  { id: 'urldec', group: 'Encode', label: 'URL decode', run: (s) => decodeURIComponent(s) },
];

export const GROUPS = ['Case', 'Lines', 'Cleanup', 'Encode'];
