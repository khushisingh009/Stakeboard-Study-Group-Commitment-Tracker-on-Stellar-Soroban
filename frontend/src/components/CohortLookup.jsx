import React, { useState } from 'react';

export default function CohortLookup({ onLookup, onJoin, loading, joinLoading }) {
  const [cohortId, setCohortId] = useState('');

  return (
    <div className="card p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-chalk mb-3">Find a cohort</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={cohortId}
          onChange={(e) => setCohortId(e.target.value)}
          placeholder="Cohort ID (e.g. 0)"
          className="flex-1 bg-slate_bg border border-rule rounded-card px-3 py-2 text-sm font-mono text-chalk focus:border-accent/60 outline-none"
        />
        <button onClick={() => onLookup(cohortId)} disabled={loading || cohortId === ''} className="btn-secondary text-sm">
          {loading ? 'Loading…' : 'Load cohort'}
        </button>
        <button onClick={() => onJoin(cohortId)} disabled={joinLoading || cohortId === ''} className="btn-primary text-sm">
          {joinLoading ? 'Posting stake…' : 'Join & post stake'}
        </button>
      </div>
    </div>
  );
}
