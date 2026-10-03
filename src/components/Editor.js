import React, { forwardRef, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

const MAX_HIGHLIGHTS = 2000;

// A textarea with an optional line-number gutter and a transparent "mirror" layer behind it that paints search highlights.
const Editor = forwardRef(function Editor(
  { value, onChange, onSelect, onKeyDown, onDropFile, wrap, numbers, spellCheck, matches, current, revealKey },
  ref
) {
  const mirrorRef = useRef(null);
  const gutterRef = useRef(null);

  const highlighted = matches.length > 0;

  const parts = useMemo(() => {
    if (!matches.length) return null;
    const out = [];
    let pos = 0;
    matches.slice(0, MAX_HIGHLIGHTS).forEach((m, i) => {
      out.push(value.slice(pos, m.start));
      out.push(
        <mark key={i} className={i === current ? 'cur' : undefined}>
          {value.slice(m.start, m.end)}
        </mark>
      );
      pos = m.end;
    });
    out.push(value.slice(pos));
    return out;
  }, [matches, current, value]);

  const gutterText = useMemo(() => {
    if (!numbers) return '';
    const n = value.split('\n').length;
    return Array.from({ length: n }, (_, i) => i + 1).join('\n');
  }, [numbers, value]);

  const syncScroll = (e) => {
    const { scrollTop, scrollLeft } = e.target;
    if (mirrorRef.current) {
      mirrorRef.current.scrollTop = scrollTop;
      mirrorRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = scrollTop;
  };

  // Keep the mirror aligned when it first appears or the layout mode changes.
  useLayoutEffect(() => {
    const ta = ref && ref.current;
    if (ta && mirrorRef.current) {
      mirrorRef.current.scrollTop = ta.scrollTop;
      mirrorRef.current.scrollLeft = ta.scrollLeft;
    }
    if (ta && gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  }, [highlighted, numbers, wrap, ref]);

  // Scroll the current match into view when the user navigates.
  useEffect(() => {
    if (!revealKey) return;
    const ta = ref && ref.current;
    const el = mirrorRef.current && mirrorRef.current.querySelector('mark.cur');
    if (!ta || !el) return;
    const top = el.offsetTop;
    if (top < ta.scrollTop + 24 || top > ta.scrollTop + ta.clientHeight - 80) {
      ta.scrollTop = Math.max(0, top - ta.clientHeight / 3);
    }
    if (!wrap) {
      const left = el.offsetLeft;
      if (left < ta.scrollLeft || left > ta.scrollLeft + ta.clientWidth - 60) {
        ta.scrollLeft = Math.max(0, left - ta.clientWidth / 3);
      }
    }
  }, [revealKey, wrap, ref]);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) onDropFile(file);
  };

  return (
    <div
      className={`editor${numbers ? ' with-gutter' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {numbers && (
        <pre className="gutter" ref={gutterRef} aria-hidden="true">
          {gutterText}
        </pre>
      )}
      <div className="stack">
        {highlighted && (
          <div className={`mirror editor-text${wrap ? '' : ' nowrap'}`} ref={mirrorRef} aria-hidden="true">
            {parts}
            {'​'}
          </div>
        )}
        <textarea
          ref={ref}
          className={`editor-text input${wrap ? '' : ' nowrap'}`}
          value={value}
          onChange={onChange}
          onSelect={onSelect}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
          wrap={wrap ? 'soft' : 'off'}
          spellCheck={spellCheck}
          placeholder="Start writing…"
          aria-label="Document"
          autoFocus
        />
      </div>
    </div>
  );
});

export default Editor;
