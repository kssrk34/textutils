import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';

export default function CommandPalette({ commands, onRun, onClose }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  const results = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return commands;
    return commands.filter((c) => {
      const hay = `${c.group} ${c.label}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [commands, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current && listRef.current.querySelector('.pal-item.active');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) onRun(results[active]);
    }
  };

  return (
    <div className="palette-scrim" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="pal-search">
          <Icon name="search" size={18} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command…  e.g. “snake”, “theme”, “export”"
            aria-label="Search commands"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="pal-list" ref={listRef} role="listbox">
          {results.length === 0 && <div className="pal-empty">No matching commands</div>}
          {results.map((c, i) => (
            <button
              key={c.id}
              role="option"
              aria-selected={i === active}
              className={`pal-item${i === active ? ' active' : ''}`}
              onMouseMove={() => setActive(i)}
              onClick={() => onRun(c)}
            >
              <span className="pal-label">{c.label}</span>
              {c.hint && <kbd>{c.hint}</kbd>}
              <span className="pal-group">{c.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
