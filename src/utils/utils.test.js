import { TRANSFORMS } from './transforms';
import { changeEnd, findMatches, getStats, slugify } from './text';

const t = (id, input) => TRANSFORMS.find((x) => x.id === id).run(input);

test('case transforms', () => {
  expect(t('title', 'the quick brown fox')).toBe('The Quick Brown Fox');
  expect(t('sentence', 'HELLO there. how ARE you?')).toBe('Hello there. How are you?');
  expect(t('camel', 'hello world-foo_bar')).toBe('helloWorldFooBar');
  expect(t('pascal', 'hello world')).toBe('HelloWorld');
  expect(t('snake', 'Hello World')).toBe('hello_world');
  expect(t('kebab', 'helloWorld Foo')).toBe('hello-world-foo');
  expect(t('constant', 'hello world')).toBe('HELLO_WORLD');
});

test('line transforms', () => {
  expect(t('sortAsc', 'b\na\nc')).toBe('a\nb\nc');
  expect(t('dedupe', 'a\nb\na')).toBe('a\nb');
  expect(t('removeEmpty', 'a\n\n \nb')).toBe('a\nb');
  expect(t('numberLines', 'a\nb')).toBe('1. a\n2. b');
});

test('cleanup transforms', () => {
  expect(t('extraSpaces', '  a   b \t c  ')).toBe('a b c');
  expect(t('collapseBlank', 'a\n\n\n\nb')).toBe('a\n\nb');
  expect(t('smartQuotes', '"hi" it\'s')).toBe('“hi” it’s');
});

test('encode transforms round-trip, including unicode', () => {
  const s = 'héllo wörld ✓';
  expect(t('b64dec', t('b64enc', s))).toBe(s);
  expect(t('urldec', t('urlenc', s))).toBe(s);
  expect(() => t('b64dec', '%%%')).toThrow();
});

test('stats', () => {
  const s = getStats('Hello world. Second sentence here!\n\nNew paragraph.');
  expect(s.words).toBe(7);
  expect(s.sentences).toBe(3);
  expect(s.paragraphs).toBe(2);
  expect(getStats('').words).toBe(0);
});

test('findMatches handles plain, regex, case and invalid patterns', () => {
  expect(findMatches('a.b a.b', 'a.b', { caseSensitive: false, regex: false }).matches).toHaveLength(2);
  expect(findMatches('Cat cat', 'cat', { caseSensitive: true, regex: false }).matches).toHaveLength(1);
  expect(findMatches('a1 b22', '\\d+', { caseSensitive: false, regex: true }).matches).toHaveLength(2);
  expect(findMatches('abc', '(', { caseSensitive: false, regex: true }).error).toBe('Invalid pattern');
  // zero-length regex matches must not hang
  expect(findMatches('abc', 'x*', { caseSensitive: false, regex: true }).matches).toHaveLength(0);
});

test('helpers', () => {
  expect(changeEnd('hello world', 'hello brave world')).toBe(12);
  expect(slugify('My  Great Doc!')).toBe('my-great-doc');
});
