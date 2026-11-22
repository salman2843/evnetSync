import { useCallback, useEffect, useState } from 'react';
import { listActions } from '../api/actions.js';
import getErrorMessage from '../lib/apiError.js';

// The Action Center needs open and finished rows together for its counts, so it
// fetches them once with status=all and filters in the browser. A manual reload
// keeps the current list on screen while the fresh one arrives.
export default function useActionList() {
  const [state, setState] = useState({ actions: [], loading: true, error: '' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((current) => ({
      ...current,
      loading: current.actions.length === 0,
      error: ''
    }));

    listActions({ status: 'all' }, controller.signal)
      .then((actions) => {
        if (!active) return;
        setState({ actions, loading: false, error: '' });
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(error, 'Could not load your actions. Try again.')
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  return { ...state, reload };
}
