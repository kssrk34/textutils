import './App.css';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Editor from './components/Editor';
import FindBar from './components/FindBar';
import CommandPalette from './components/CommandPalette';
import Sidebar from './components/Sidebar';
import Icon from './components/Icon';
import useHistory from './hooks/useHistory';
import useLocalStorage from './hooks/useLocalStorage';
import { TRANSFORMS } from './utils/transforms';
import { changeEnd, countWords, escapeRegExp, findMatches, fmtTime, getStats, slugify } from './utils/text';

const TEXT_KEY = 'inkwell.text';

const WELCOME = `Welcome to Inkwell.

A quiet place to write, reshape and polish text.

• Press Ctrl+K (or ⌘K) to open the command palette — every tool lives there.
• Select any text and use the Tools panel to change its case, sort lines, clean spacing or encode it. With no selection, the whole document is transformed.
• Ctrl+F finds, Ctrl+H replaces. Regular expressions are supported.
• Ctrl+Z / Ctrl+Shift+Z undo and redo — every transform is reversible.
• Ctrl+. enters focus mode. Press Esc to come back.
• Your work is saved in this browser automatically.

Delete all of this and start writing.`;

const DEFAULTS = {
  theme: 'obsidian',
  font: 'serif',
  size: 19,
  lineHeight: 1.75,
  measure: 760,
  wrap: true,
  numbers: false,
  spellcheck: true,
  goal: 500,
};

const THEMES = [
  ['obsidian', 'Obsidian'],
  ['paper', 'Paper'],
  ['aurora', 'Aurora'],
];

const FONTS = {
  serif: "'Newsreader', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  sans: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Cascadia Code', Consolas, Menlo, monospace",
};

const loadText = () => {
  try {
    const v = localStorage.getItem(TEXT_KEY);
    return v === null ? WELCOME : v;
  } catch (e) {
    return WELCOME;
  }
};

export default function App() {
  const [settings, setSettings] = useLocalStorage('inkwell.settings', DEFAULTS);
  const [title, setTitle] = useLocalStorage('inkwell.title', 'Untitled');
  const [initialText] = useState(loadText);
  const { text, set: setText, undo: histUndo, redo: histRedo, canUndo, canRedo } = useHistory(initialText);

  const [sel, setSel] = useState({ start: 0, end: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 900);
  const [tab, setTab] = useState('tools');
  const [focusMode, setFocusMode] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const [findOpen, setFindOpen] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [query, setQuery] = useState('');
  const [repl, setRepl] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [regex, setRegex] = useState(false);
  const [current, setCurrent] = useState(0);
  const [focusKey, setFocusKey] = useState(0);
  const [revealKey, setRevealKey] = useState(0);

  const taRef = useRef(null);
  const fileRef = useRef(null);
  const pendingSel = useRef(null);
  const toastTimer = useRef(null);

  const setSetting = useCallback((k, v) => setSettings((s) => ({ ...s, [k]: v })), [setSettings]);

  // ---- persistence & document chrome ----
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(TEXT_KEY, text);
      } catch (e) {
        // storage unavailable — editing still works
      }
    }, 300);
    return () => clearTimeout(id);
  }, [text]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    document.title = `${title.trim() || 'Untitled'} — Inkwell`;
  }, [title]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const toast = useCallback((msg) => {
    setToastMsg({ msg, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  // ---- editing primitives ----
  // Restore the caret/selection after a programmatic edit, once React has committed the new value.
  useLayoutEffect(() => {
    const p = pendingSel.current;
    const ta = taRef.current;
    if (!p || !ta) return;
    pendingSel.current = null;
    ta.setSelectionRange(p[0], p[1]);
    setSel({ start: p[0], end: p[1] });
    ta.focus();
  }, [text]);

  const commit = useCallback(
    (next, range) => {
      if (next === text) return false;
      pendingSel.current = range;
      setText(next);
      return true;
    },
    [text, setText]
  );

  const undo = () => {
    const r = histUndo();
    if (r) {
      const p = changeEnd(r.from, r.to);
      pendingSel.current = [p, p];
    }
  };

  const redo = () => {
    const r = histRedo();
    if (r) {
      const p = changeEnd(r.from, r.to);
      pendingSel.current = [p, p];
    }
  };

  const syncSel = (e) => setSel({ start: e.target.selectionStart, end: e.target.selectionEnd });

  const onChange = (e) => {
    setText(e.target.value, { group: true });
    syncSel(e);
  };

  const runTransform = (t) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const hasSel = e > s;
    let next;
    let range;
    try {
      if (hasSel) {
        const mid = t.run(text.slice(s, e));
        next = text.slice(0, s) + mid + text.slice(e);
        range = [s, s + mid.length];
      } else {
        next = t.run(text);
        const p = Math.min(s, next.length);
        range = [p, p];
      }
    } catch (err) {
      toast(`${t.label} can't be applied to this text`);
      return;
    }
    if (!commit(next, range)) {
      toast('Nothing to change');
      ta.focus();
      return;
    }
    toast(`${t.label} · ${hasSel ? 'selection' : 'document'}`);
  };

  const handleTab = (shift) => {
    const ta = taRef.current;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const multi = text.slice(s, e).includes('\n');
    if (!shift && !multi) {
      commit(text.slice(0, s) + '  ' + text.slice(e), [s + 2, s + 2]);
      return;
    }
    const ls = text.lastIndexOf('\n', s - 1) + 1;
    let le = text.indexOf('\n', e);
    if (le === -1) le = text.length;
    if (e > s && text[e - 1] === '\n') le = e - 1;
    const lines = text.slice(ls, le).split('\n');
    const out = lines.map((l) => (shift ? l.replace(/^( {1,2}|\t)/, '') : '  ' + l)).join('\n');
    const removed = le - ls - out.length;
    const range = s === e ? [Math.max(ls, s - removed), Math.max(ls, s - removed)] : [ls, ls + out.length];
    commit(text.slice(0, ls) + out + text.slice(le), range);
  };

  const onEditorKeyDown = (e) => {
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      handleTab(e.shiftKey);
    }
  };

  // ---- files & clipboard ----
  const exportFile = (ext) => {
    const name = `${slugify(title) || 'untitled'}.${ext}`;
    const blob = new Blob([text], { type: ext === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Saved ${name}`);
  };

  const importFile = async (file) => {
    try {
      const content = await file.text();
      if (content.includes('\u0000')) {
        toast("That doesn't look like a text file");
        return;
      }
      setText(content);
      pendingSel.current = [0, 0];
      const base = file.name.replace(/\.[^.]+$/, '');
      if (base) setTitle(base);
      toast(`Opened ${file.name}`);
    } catch (e) {
      toast("Couldn't read that file");
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard');
    } catch (e) {
      toast('Clipboard unavailable in this browser');
    }
  };

  const clearAll = () => {
    if (!text) return;
    setText('');
    pendingSel.current = [0, 0];
    toast('Cleared · Ctrl+Z to undo');
  };

  // ---- find & replace ----
  const { matches, error: findError } = useMemo(
    () => (findOpen ? findMatches(text, query, { caseSensitive, regex }) : { matches: [], error: '' }),
    [findOpen, text, query, caseSensitive, regex]
  );
  const safeCurrent = matches.length ? Math.min(current, matches.length - 1) : 0;

  const goTo = (i) => {
    if (!matches.length) return;
    setCurrent(((i % matches.length) + matches.length) % matches.length);
    setRevealKey((k) => k + 1);
  };

  const openFind = (withReplace = false, seed) => {
    const ta = taRef.current;
    let nextQuery = seed;
    if (nextQuery === undefined && ta && ta.selectionEnd > ta.selectionStart) {
      const picked = text.slice(ta.selectionStart, ta.selectionEnd);
      if (picked.length <= 80 && !picked.includes('\n')) nextQuery = picked;
    }
    if (nextQuery !== undefined) {
      setQuery(nextQuery);
      setCurrent(0);
    }
    setFindOpen(true);
    setShowReplace((r) => withReplace || r);
    setFocusKey((k) => k + 1);
    setRevealKey((k) => k + 1);
  };

  const closeFind = () => {
    setFindOpen(false);
    if (taRef.current) taRef.current.focus();
  };

  const replaceOne = () => {
    const m = matches[safeCurrent];
    if (!m) return;
    let rep = repl;
    if (regex) {
      try {
        rep = m.text.replace(new RegExp(query, caseSensitive ? '' : 'i'), repl);
      } catch (e) {
        return;
      }
    }
    const p = m.start + rep.length;
    pendingSel.current = [p, p];
    setText(text.slice(0, m.start) + rep + text.slice(m.end));
  };

  const replaceAll = () => {
    if (!matches.length) return;
    const re = new RegExp(regex ? query : escapeRegExp(query), caseSensitive ? 'g' : 'gi');
    const n = matches.length;
    setText(text.replace(re, regex ? repl : () => repl));
    toast(`Replaced ${n} match${n === 1 ? '' : 'es'}`);
  };

  // ---- derived ----
  const stats = useMemo(() => getStats(text), [text]);
  const cursor = useMemo(() => {
    const before = text.slice(0, sel.start);
    const line = before.split('\n').length;
    const col = sel.start - (before.lastIndexOf('\n') + 1) + 1;
    return { line, col };
  }, [text, sel.start]);
  const selWords = sel.end > sel.start ? countWords(text.slice(sel.start, sel.end)) : 0;
  const goalPct = settings.goal > 0 ? Math.min(100, Math.round((stats.words / settings.goal) * 100)) : 0;
  const effectiveWrap = settings.wrap && !settings.numbers;

  // ---- command palette ----
  const buildCommands = () => [
    ...TRANSFORMS.map((t) => ({ id: `t-${t.id}`, group: t.group, label: t.label, run: () => runTransform(t) })),
    { id: 'undo', group: 'Edit', label: 'Undo', hint: 'Ctrl Z', run: undo },
    { id: 'redo', group: 'Edit', label: 'Redo', hint: 'Ctrl ⇧ Z', run: redo },
    { id: 'find', group: 'Edit', label: 'Find', hint: 'Ctrl F', run: () => openFind(false) },
    { id: 'replace', group: 'Edit', label: 'Find and replace', hint: 'Ctrl H', run: () => openFind(true) },
    { id: 'selectall', group: 'Edit', label: 'Select all', run: () => taRef.current && (taRef.current.focus(), taRef.current.select()) },
    { id: 'clear', group: 'Edit', label: 'Clear document', run: clearAll },
    { id: 'copy', group: 'File', label: 'Copy all text', run: copyAll },
    { id: 'import', group: 'File', label: 'Import a text file…', run: () => fileRef.current && fileRef.current.click() },
    { id: 'export-txt', group: 'File', label: 'Export as .txt', hint: 'Ctrl S', run: () => exportFile('txt') },
    { id: 'export-md', group: 'File', label: 'Export as .md', run: () => exportFile('md') },
    { id: 'focus', group: 'View', label: 'Toggle focus mode', hint: 'Ctrl .', run: () => setFocusMode((f) => !f) },
    { id: 'sidebar', group: 'View', label: 'Toggle side panel', run: () => setSidebarOpen((o) => !o) },
    { id: 'wrap', group: 'View', label: 'Toggle line wrap', run: () => setSettings((s) => ({ ...s, wrap: !s.wrap, numbers: false })) },
    { id: 'numbers', group: 'View', label: 'Toggle line numbers', run: () => setSettings((s) => ({ ...s, numbers: !s.numbers })) },
    { id: 'spell', group: 'View', label: 'Toggle spell check', run: () => setSettings((s) => ({ ...s, spellcheck: !s.spellcheck })) },
    ...THEMES.map(([k, label]) => ({ id: `theme-${k}`, group: 'Theme', label: `${label} theme`, run: () => setSetting('theme', k) })),
    ...['serif', 'sans', 'mono'].map((k) => ({
      id: `font-${k}`,
      group: 'Typeface',
      label: `${k[0].toUpperCase()}${k.slice(1)} typeface`,
      run: () => setSetting('font', k),
    })),
  ];

  const runCommand = (c) => {
    setPaletteOpen(false);
    // Let the palette unmount first so focus returns to the editor before the command runs.
    setTimeout(c.run, 0);
  };

  // ---- global shortcuts (re-bound every render so handlers always see fresh state) ----
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      const t = e.target;
      const inOtherField =
        t instanceof HTMLElement && t !== taRef.current && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
      if (mod && k === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (mod && k === 'f') {
        e.preventDefault();
        openFind(false);
      } else if (mod && k === 'h') {
        e.preventDefault();
        openFind(true);
      } else if (mod && k === 's') {
        e.preventDefault();
        exportFile('txt');
      } else if (mod && k === '.') {
        e.preventDefault();
        setFocusMode((f) => !f);
      } else if (mod && k === 'z' && !inOtherField) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && k === 'y' && !inOtherField) {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        if (paletteOpen) setPaletteOpen(false);
        else if (findOpen) closeFind();
        else if (focusMode) setFocusMode(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const appStyle = {
    '--ed-font': FONTS[settings.font] || FONTS.serif,
    '--ed-size': `${settings.size}px`,
    '--ed-lh': settings.lineHeight,
    '--measure': `${settings.measure}px`,
  };

  const actions = { import: () => fileRef.current && fileRef.current.click(), export: exportFile, copy: copyAll, clear: clearAll };

  return (
    <div className={`app${focusMode ? ' focus' : ''}`} style={appStyle}>
      <header className="header">
        <div className="brand">
          <span className="logo">
            <Icon name="feather" size={17} />
          </span>
          <span className="brand-name">Inkwell</span>
        </div>
        <input
          className="doc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          aria-label="Document title"
          maxLength={80}
        />
        <div className="header-actions">
          <button className="icon-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
            <Icon name="undo" />
          </button>
          <button className="icon-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
            <Icon name="redo" />
          </button>
          <button className="icon-btn" onClick={() => openFind(false)} title="Find (Ctrl+F)" aria-label="Find">
            <Icon name="search" />
          </button>
          <span className="divider" />
          <div className="themes" role="group" aria-label="Theme">
            {THEMES.map(([k, label]) => (
              <button
                key={k}
                className={`swatch sw-${k}${settings.theme === k ? ' on' : ''}`}
                onClick={() => setSetting('theme', k)}
                title={`${label} theme`}
                aria-label={`${label} theme`}
                aria-pressed={settings.theme === k}
              />
            ))}
          </div>
          <span className="divider" />
          <button className="pill" onClick={() => setPaletteOpen(true)} title="Command palette (Ctrl+K)">
            <Icon name="command" size={14} /> <span>Commands</span>
          </button>
          <button className="icon-btn" onClick={() => setFocusMode(true)} title="Focus mode (Ctrl+.)" aria-label="Focus mode">
            <Icon name="focus" />
          </button>
          <button
            className={`icon-btn${sidebarOpen ? ' active' : ''}`}
            onClick={() => setSidebarOpen((o) => !o)}
            title="Toggle side panel"
            aria-label="Toggle side panel"
            aria-pressed={sidebarOpen}
          >
            <Icon name="sidebar" />
          </button>
        </div>
      </header>

      <div className="main">
        <main className="canvas">
          {findOpen && (
            <FindBar
              query={query}
              setQuery={(v) => {
                setQuery(v);
                setCurrent(0);
                setRevealKey((k) => k + 1);
              }}
              repl={repl}
              setRepl={setRepl}
              caseSensitive={caseSensitive}
              setCaseSensitive={setCaseSensitive}
              regex={regex}
              setRegex={setRegex}
              showReplace={showReplace}
              setShowReplace={setShowReplace}
              count={matches.length}
              current={safeCurrent}
              error={findError}
              focusKey={focusKey}
              onNext={() => goTo(safeCurrent + 1)}
              onPrev={() => goTo(safeCurrent - 1)}
              onReplace={replaceOne}
              onReplaceAll={replaceAll}
              onClose={closeFind}
            />
          )}
          <Editor
            ref={taRef}
            value={text}
            onChange={onChange}
            onSelect={syncSel}
            onKeyDown={onEditorKeyDown}
            onDropFile={importFile}
            wrap={effectiveWrap}
            numbers={settings.numbers}
            spellCheck={settings.spellcheck}
            matches={matches}
            current={safeCurrent}
            revealKey={revealKey}
          />
          {focusMode && (
            <div className="focus-hud">
              <span>{stats.words.toLocaleString()} words</span>
              <span className="dot" />
              <button onClick={() => setFocusMode(false)}>Exit focus · Esc</button>
            </div>
          )}
        </main>

        {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}
        <Sidebar
          open={sidebarOpen}
          tab={tab}
          setTab={setTab}
          text={text}
          stats={stats}
          settings={settings}
          set={setSetting}
          onTransform={runTransform}
          actions={actions}
          onKeyword={(w) => {
            setRegex(false);
            openFind(false, w);
          }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <footer className="statusbar">
        <span>
          Ln {cursor.line}, Col {cursor.col}
          {selWords > 0 && <em> · {sel.end - sel.start} chars, {selWords} words selected</em>}
        </span>
        <span className="status-mid">
          <span className="bar" aria-hidden="true">
            <i style={{ width: `${goalPct}%` }} />
          </span>
          {goalPct}% of {settings.goal.toLocaleString()} words
        </span>
        <span>
          {stats.words.toLocaleString()} words · {stats.chars.toLocaleString()} chars · {fmtTime(stats.readMin)} read
          <span className="saved">
            <i className="dot" /> Autosaved
          </span>
        </span>
      </footer>

      {paletteOpen && <CommandPalette commands={buildCommands()} onRun={runCommand} onClose={() => setPaletteOpen(false)} />}
      {toastMsg && (
        <div className="toast" key={toastMsg.id} role="status">
          {toastMsg.msg}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".txt,.md,.markdown,.csv,.json,.log,text/*"
        hidden
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) importFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
