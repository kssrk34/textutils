import React, { useMemo } from 'react';
import Icon from './Icon';
import { GROUPS, TRANSFORMS } from '../utils/transforms';
import { fmtTime, getKeywords } from '../utils/text';

const TABS = [
  ['tools', 'Tools'],
  ['insights', 'Insights'],
  ['style', 'Style'],
];

const FONT_OPTIONS = [
  ['serif', 'Serif'],
  ['sans', 'Sans'],
  ['mono', 'Mono'],
];

function Toggle({ label, checked, onChange }) {
  return (
    <div className="row">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch${checked ? ' on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

function Range({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="range">
      <span className="row">
        <span>{label}</span>
        <b>{format ? format(value) : value}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Tools({ onTransform, actions }) {
  return (
    <div className="panel-body">
      <p className="hint">Transforms apply to your selection, or to the whole document when nothing is selected.</p>
      <section>
        <h3>File</h3>
        <div className="chips">
          <button className="chip" onClick={actions.import}>
            <Icon name="upload" size={14} /> Import
          </button>
          <button className="chip" onClick={() => actions.export('txt')}>
            <Icon name="download" size={14} /> Export .txt
          </button>
          <button className="chip" onClick={() => actions.export('md')}>
            <Icon name="file" size={14} /> Export .md
          </button>
          <button className="chip" onClick={actions.copy}>
            <Icon name="copy" size={14} /> Copy all
          </button>
          <button className="chip danger" onClick={actions.clear}>
            <Icon name="trash" size={14} /> Clear
          </button>
        </div>
      </section>
      {GROUPS.map((g) => (
        <section key={g}>
          <h3>{g}</h3>
          <div className="chips">
            {TRANSFORMS.filter((t) => t.group === g).map((t) => (
              <button key={t.id} className="chip" onClick={() => onTransform(t)}>
                {t.label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Insights({ text, stats, goal, onKeyword }) {
  const keywords = useMemo(() => getKeywords(text), [text]);
  const pct = goal > 0 ? Math.min(stats.words / goal, 1) : 0;
  const R = 34;
  const C = 2 * Math.PI * R;

  const tiles = [
    ['Words', stats.words.toLocaleString()],
    ['Characters', stats.chars.toLocaleString()],
    ['No spaces', stats.noSpaces.toLocaleString()],
    ['Lines', stats.lines.toLocaleString()],
    ['Sentences', stats.sentences.toLocaleString()],
    ['Paragraphs', stats.paragraphs.toLocaleString()],
    ['Reading', fmtTime(stats.readMin)],
    ['Speaking', fmtTime(stats.speakMin)],
  ];

  return (
    <div className="panel-body">
      <section className="goal">
        <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`${Math.round(pct * 100)}% of word goal`}>
          <circle cx="42" cy="42" r={R} className="ring-bg" />
          <circle
            cx="42"
            cy="42"
            r={R}
            className="ring"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90 42 42)"
          />
          <text x="42" y="47" textAnchor="middle" className="ring-text">
            {Math.round(pct * 100)}%
          </text>
        </svg>
        <div>
          <h3>Word goal</h3>
          <p className="goal-count">
            {stats.words.toLocaleString()} / {goal.toLocaleString()}
          </p>
        </div>
      </section>
      <section>
        <div className="tiles">
          {tiles.map(([k, v]) => (
            <div className="tile" key={k}>
              <b>{v}</b>
              <span>{k}</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3>Top keywords</h3>
        {keywords.length === 0 ? (
          <p className="hint">Repeated words will show up here as you write.</p>
        ) : (
          <div className="chips">
            {keywords.map(([w, n]) => (
              <button key={w} className="chip" onClick={() => onKeyword(w)} title="Find in document">
                {w} <em>{n}</em>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Style({ settings, set }) {
  return (
    <div className="panel-body">
      <section>
        <h3>Typeface</h3>
        <div className="seg" role="group" aria-label="Typeface">
          {FONT_OPTIONS.map(([k, label]) => (
            <button key={k} className={settings.font === k ? 'on' : ''} onClick={() => set('font', k)} aria-pressed={settings.font === k}>
              {label}
            </button>
          ))}
        </div>
      </section>
      <section className="stackgap">
        <Range label="Font size" value={settings.size} min={13} max={30} step={1} onChange={(v) => set('size', v)} format={(v) => `${v}px`} />
        <Range label="Line height" value={settings.lineHeight} min={1.3} max={2.2} step={0.05} onChange={(v) => set('lineHeight', v)} format={(v) => v.toFixed(2)} />
        <Range label="Page width" value={settings.measure} min={480} max={1100} step={20} onChange={(v) => set('measure', v)} format={(v) => `${v}px`} />
        <Range label="Word goal" value={settings.goal} min={50} max={5000} step={50} onChange={(v) => set('goal', v)} />
      </section>
      <section className="stackgap">
        <Toggle label="Wrap long lines" checked={settings.wrap && !settings.numbers} onChange={(v) => set('wrap', v)} />
        <Toggle label="Line numbers (no wrap)" checked={settings.numbers} onChange={(v) => set('numbers', v)} />
        <Toggle label="Spell check" checked={settings.spellcheck} onChange={(v) => set('spellcheck', v)} />
      </section>
    </div>
  );
}

export default function Sidebar({ open, tab, setTab, text, stats, settings, set, onTransform, actions, onKeyword, onClose }) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Tools">
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
        <button className="icon-btn sm close-mobile" onClick={onClose} aria-label="Close panel">
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="panel-scroll">
        {tab === 'tools' && <Tools onTransform={onTransform} actions={actions} />}
        {tab === 'insights' && <Insights text={text} stats={stats} goal={settings.goal} onKeyword={onKeyword} />}
        {tab === 'style' && <Style settings={settings} set={set} />}
      </div>
    </aside>
  );
}
