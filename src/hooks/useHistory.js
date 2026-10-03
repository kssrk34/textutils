import { useCallback, useRef, useState } from 'react';

const LIMIT = 300;
const GROUP_MS = 900;

// Text state with an undo/redo stack. Consecutive typing (`group: true`) is merged into one step.
export default function useHistory(initial) {
  const [text, setText] = useState(initial);
  const cur = useRef(initial);
  const past = useRef([]);
  const future = useRef([]);
  const last = useRef(0);

  const set = useCallback((next, { group = false } = {}) => {
    if (next === cur.current) return;
    const now = Date.now();
    if (!group || now - last.current > GROUP_MS) {
      past.current.push(cur.current);
      if (past.current.length > LIMIT) past.current.shift();
    }
    last.current = group ? now : 0;
    future.current = [];
    cur.current = next;
    setText(next);
  }, []);

  const undo = useCallback(() => {
    if (!past.current.length) return null;
    const from = cur.current;
    const to = past.current.pop();
    future.current.push(from);
    cur.current = to;
    last.current = 0;
    setText(to);
    return { from, to };
  }, []);

  const redo = useCallback(() => {
    if (!future.current.length) return null;
    const from = cur.current;
    const to = future.current.pop();
    past.current.push(from);
    cur.current = to;
    last.current = 0;
    setText(to);
    return { from, to };
  }, []);

  return {
    text,
    set,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
