import { useCallback, useEffect, useState } from 'react';
import { listVendors } from '../api/vendors.js';
import getErrorMessage from '../lib/apiError.js';

export const VENDORS_PAGE_SIZE = 9;

// The vendor book is small enough for one request per page. Filters clear the
// old cards; a manual reload keeps them visible while the fresh list arrives.
export default function useVendors({ search = '', category = '', page = 1 } = {}) {
  const key = JSON.stringify({ search, category, page });
  const [state, setState] = useState({
    key: null,
    vendors: [],
    pagination: null,
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
      vendors: current.key === key ? current.vendors : [],
      pagination: current.key === key ? current.pagination : null,
      loading: true,
      error: ''
    }));

    listVendors({ search, category, page, limit: VENDORS_PAGE_SIZE }, controller.signal)
      .then((data) => {
        if (!active) return;
        setState({
          key,
          vendors: data.vendors,
          pagination: data.pagination || null,
          loading: false,
          error: ''
        });
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setState((current) => ({
          ...current,
          loading: false,
          error: getErrorMessage(error, 'Could not load your vendors. Try again.')
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
    // `key` already contains search, category and page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadKey]);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  return { ...state, reload };
}
