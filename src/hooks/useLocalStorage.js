import { useEffect, useState } from 'react';

// useState persisted to localStorage. Object defaults are merged with whatever was stored.
export default function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed = JSON.parse(raw);
      const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
      return isObj(initial) && isObj(parsed) ? { ...initial, ...parsed } : parsed;
    } catch (e) {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // storage unavailable (private mode / quota) — the app still works, just without persistence
    }
  }, [key, value]);

  return [value, setValue];
}
