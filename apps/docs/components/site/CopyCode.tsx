'use client';

import { useState } from 'react';

export function CopyCode({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="code">
      <code>{text}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          } catch {
            /* clipboard unavailable */
          }
        }}
      >
        {done ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
