import { useCallback, useEffect, useState } from 'react';
import { getSummary } from '../api/dashboard.js';
import getErrorMessage from '../lib/apiError.js';

// One request fills the dashboard, so one hook owns its loading, error and
// refresh states. A refresh keeps the current data on screen instead of
// flashing a skeleton.
export default function useDashboardSummary() {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((current) => ({ ...current, loading: !current.data, error: '' }));

    getSummary(controller.signal)
      .then((summary) => {
        if (active) setState({ data: summary, loading: false, error: '' });
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(error, 'Could not load your dashboard. Try again.')
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { ...state, reload };
}
