'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error in candidates page:', error);
  }, [error]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Error loading candidates page</h2>
      <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
        {error.message}
      </pre>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
