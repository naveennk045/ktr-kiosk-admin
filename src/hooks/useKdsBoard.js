import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api';
import { formatApiError } from '../utils/formatApiError';

const EMPTY = { board: null, error: null, loading: false, updatedAt: null };

/**
 * Polls the live kitchen board for the selected store. Read-only.
 * Polling stops while the browser tab is hidden and resumes (with an immediate refresh) when it is shown.
 */
export function useKdsBoard({ enabled = true, intervalMs = 10000, maxRows = 60 } = {}) {
  const [state, setState] = useState({ ...EMPTY, loading: enabled });
  const inFlight = useRef(false);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setState((cur) => ({ ...cur, loading: true }));
    try {
      const res = await api.get('/kds/board', { params: { max_rows: maxRows } });
      if (alive.current) setState({ board: res.data, error: null, loading: false, updatedAt: Date.now() });
    } catch (err) {
      // Keep the last good board on screen; the caller shows that it is stale.
      if (alive.current) setState((cur) => ({ ...cur, error: formatApiError(err), loading: false }));
    } finally {
      inFlight.current = false;
    }
  }, [maxRows]);

  useEffect(() => {
    alive.current = true;
    if (!enabled) {
      setState(EMPTY);
      return () => {
        alive.current = false;
      };
    }
    let timer = null;
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      if (document.hidden) return;
      refresh();
      timer = setInterval(refresh, intervalMs);
    };
    start();
    document.addEventListener('visibilitychange', start);
    return () => {
      alive.current = false;
      stop();
      document.removeEventListener('visibilitychange', start);
    };
  }, [enabled, intervalMs, refresh]);

  return { ...state, refresh };
}

/** A clock that re-renders the caller every `stepMs` (for live timers). Paused while the tab is hidden. */
export function useNow(stepMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let timer = null;
    const start = () => {
      clearInterval(timer);
      if (document.hidden) return;
      setNow(Date.now());
      timer = setInterval(() => setNow(Date.now()), stepMs);
    };
    start();
    document.addEventListener('visibilitychange', start);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', start);
    };
  }, [stepMs]);
  return now;
}

/** True when a single store is selected (the board needs `X-Store-Id`). */
export function hasSingleStore(isMultiStore, singleStoreCode) {
  if (isMultiStore) return false;
  const fromEnv = String(import.meta.env.VITE_DEFAULT_STORE_ID ?? '').trim();
  return Boolean(String(singleStoreCode || '').trim() || fromEnv);
}
