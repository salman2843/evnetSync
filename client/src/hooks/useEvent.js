import { useCallback, useEffect, useState } from 'react';
import { getEvent } from '../api/events.js';
import getErrorMessage from '../lib/apiError.js';

// One event with its task list. `status` carries the HTTP code so the page can
// tell a missing event (404) from a network problem.
export default function useEvent(id) {
  const [state, setState] = useState({
    event: null,
    tasks: [],
    loading: true,
    error: '',
    status: 0
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((current) => ({ ...current, loading: true, error: '', status: 0 }));

    getEvent(id, controller.signal)
      .then((data) => {
        if (!active) return;
        setState({
          event: data.event,
          tasks: data.tasks || [],
          loading: false,
          error: '',
          status: 200
        });
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(error, 'Could not load this event. Try again.'),
          status: error.response?.status || 0
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id, reloadKey]);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  return { ...state, reload };
}
