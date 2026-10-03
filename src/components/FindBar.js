import React, { useEffect, useRef } from 'react';
import Icon from './Icon';

export default function FindBar({
  query,
  setQuery,
  repl,
  setRepl,
  caseSensitive,
  setCaseSensitive,
  regex,
  setRegex,
  showReplace,
  setShowReplace,
  count,
  current,
  error,
  focusKey,
  onNext,
  onPrev,
  onReplace,
  onReplaceAll,
  onClose,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [focusKey]);

  const onQueryKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) onPrev();
      else onNext();
    }
  };

  const onReplKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onReplace();
    }
  };

  const status = error || (query ? (count ? `${current + 1} of ${count}` : 'No results') : '');

  return (
    <div className="findbar" role="search">
      <div className="find-row">
        <button
          className="icon-btn sm"
          onClick={() => setShowReplace(!showReplace)}
          title="Toggle replace"
          aria-label="Toggle replace"
          aria-expanded={showReplace}
        >
          <Icon name={showReplace ? 'down' : 'up'} size={15} />
        </button>
        <input
          ref={inputRef}
          className="find-input"
          placeholder="Find"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onQueryKey}
          aria-label="Find"
        />
        <span className={`find-status${error ? ' err' : ''}`}>{status}</span>
        <button
          className={`tog${caseSensitive ? ' on' : ''}`}
          onClick={() => setCaseSensitive(!caseSensitive)}
          title="Match case"
          aria-pressed={caseSensitive}
        >
          Aa
        </button>
        <button
          className={`tog${regex ? ' on' : ''}`}
          onClick={() => setRegex(!regex)}
          title="Regular expression"
          aria-pressed={regex}
        >
          .*
        </button>
        <button className="icon-btn sm" onClick={onPrev} disabled={!count} title="Previous (Shift+Enter)" aria-label="Previous match">
          <Icon name="up" size={15} />
        </button>
        <button className="icon-btn sm" onClick={onNext} disabled={!count} title="Next (Enter)" aria-label="Next match">
          <Icon name="down" size={15} />
        </button>
        <button className="icon-btn sm" onClick={onClose} title="Close (Esc)" aria-label="Close find">
          <Icon name="x" size={15} />
        </button>
      </div>
      {showReplace && (
        <div className="find-row">
          <span className="spacer-sm" />
          <input
            className="find-input"
            placeholder="Replace with"
            value={repl}
            onChange={(e) => setRepl(e.target.value)}
            onKeyDown={onReplKey}
            aria-label="Replace with"
          />
          <button className="btn sm" onClick={onReplace} disabled={!count}>
            Replace
          </button>
          <button className="btn sm" onClick={onReplaceAll} disabled={!count}>
            All
          </button>
        </div>
      )}
    </div>
  );
}
