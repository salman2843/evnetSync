import { useCallback, useEffect, useState } from 'react';
import { listClients } from '../api/clients.js';
import getErrorMessage from '../lib/apiError.js';

export const CLIENTS_PAGE_SIZE = 9;

// One request fills the client grid. Changing a filter clears the old cards so
// nobody mistakes stale results for new ones; a manual reload keeps them on
// screen while the fresh list arrives.
export default function useClients({ search = '', status = 'All', sort = 'recent', page = 1 } = {}) {
  const key = JSON.stringify({ search, status, sort, page });
  const [state, setState] = useState({
    key: null,
    clients: [],
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
      clients: current.key === key ? current.clients : [],
      pagination: current.key === key ? current.pagination : null,
      loading: true,
      error: ''
    }));

    listClients(
      {
        search,
        status: status === 'All' ? '' : status,
        sort,
        page,
        limit: CLIENTS_PAGE_SIZE
      },
      controller.signal
    )
      .then((data) => {
        if (!active) return;
        setState({
          key,
          clients: data.clients,
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
          error: getErrorMessage(error, 'Could not load your clients. Try again.')
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
    // `key` already contains search, status, sort and page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadKey]);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  // Lets the status pill update one card immediately, before the server answers.
  const patchClient = useCallback((id, changes) => {
    setState((current) => ({
      ...current,
      clients: current.clients.map((client) =>
        client._id === id ? { ...client, ...changes } : client
      )
    }));
  }, []);

  return { ...state, reload, patchClient };
}
