import { useCallback, useEffect, useState } from 'react';

// Confirmation and failure notices clear themselves. Screens render the text
// through <Toast>, never through window.alert.
export default function useToast(timeout = 5000) {
  const [notice, setNotice] = useState({ text: '', tone: 'muted' });

  useEffect(() => {
    if (!notice.text) return undefined;
    const timer = setTimeout(() => setNotice({ text: '', tone: 'muted' }), timeout);
    return () => clearTimeout(timer);
  }, [notice, timeout]);

  const notify = useCallback((text, tone = 'muted') => setNotice({ text, tone }), []);

  return { notice, notify };
}
