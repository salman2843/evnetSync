import { useCallback, useEffect, useState } from 'react';
import { listEvents } from '../api/events.js';
import getErrorMessage from '../lib/apiError.js';

// The calendar is small enough for one request. Changing a filter clears the
// old rows so nobody reads stale events as the new result; a manual reload keeps
// them on screen while the fresh list arrives.
export default function useEvents({ search = '', status = '', scope = 'upcoming' } = {}) {
  const key = JSON.stringify({ search, status, scope });
  const [state, setState] = useState({
    key: null,
    events: [],
    loading: true,
    error: ''
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((current) => ({
      ...current,
      key,
      events: current.key === key ? current.events : [],
      loading: true,
      error: ''
    }));

    listEvents({ search, status, scope }, controller.signal)
      .then((data) => {
        if (!active) return;
        setState({ key, events: data.events, loading: false, error: '' });
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(error, 'Could not load your events. Try again.')
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
    // `key` already contains search, status and scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadKey]);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  return { ...state, reload };
}
