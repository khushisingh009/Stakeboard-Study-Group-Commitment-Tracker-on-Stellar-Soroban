import React from 'react';

export default function Skeleton() {
  return (
    <div className="card p-6 space-y-4 animate-pulse" role="status" aria-label="Loading cohort data">
      <div className="h-4 w-32 bg-rule rounded" />
      <div className="h-2 w-full bg-rule rounded-full" />
      <div className="space-y-3 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-rule/60 rounded" />
        ))}
      </div>
    </div>
  );
}
