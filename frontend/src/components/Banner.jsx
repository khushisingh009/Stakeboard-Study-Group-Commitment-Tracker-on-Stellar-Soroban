import React from 'react';

export default function Banner({ type = 'error', message, onDismiss }) {
  if (!message) return null;
  const styles = type === 'error'
    ? 'border-bad/40 bg-bad/10 text-bad'
    : 'border-good/40 bg-good/10 text-good';

  return (
    <div className={`border rounded-card px-4 py-3 text-sm flex items-start justify-between gap-3 ${styles}`}>
      <span className="leading-relaxed">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
