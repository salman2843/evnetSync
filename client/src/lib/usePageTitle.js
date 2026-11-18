import { useEffect } from 'react';

// One title per screen; the browser tab should say where the planner is.
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · EventSync` : 'EventSync';
  }, [title]);
}
