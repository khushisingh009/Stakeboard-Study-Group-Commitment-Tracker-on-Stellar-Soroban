import React from 'react';

const EVENT_LABELS = {
  cohort_created: 'Cohort created',
  member_joined: 'Member joined',
  milestone_closed: 'Session closed',
  member_dropped: 'Member dropped',
  cohort_finalized: 'Cohort finalized',
};

export default function EventFeed({ events, connected, error }) {
  return (
    <div className="card p-5 sm:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-chalk text-sm">Live activity</h3>
        <span className="flex items-center gap-1.5 text-xs font-mono text-chalk/50">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-good animate-pulse' : 'bg-chalk/20'}`} />
          {connected ? 'streaming' : 'connecting'}
        </span>
      </div>

      {error && <p className="text-xs text-bad mb-3 font-mono">{error}</p>}

      {events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-chalk/30 text-center max-w-[22ch]">
            Joins, closed sessions, and drops will appear here as they happen on-chain.
          </p>
        </div>
      ) : (
        <ul className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
          {events.map((e, idx) => (
            <li key={e.id || idx} className="text-xs border-l-2 border-accent/40 pl-3 py-0.5">
              <p className="text-chalk font-medium">{EVENT_LABELS[e.topic?.[0]] || 'Contract event'}</p>
              <p className="text-chalk/30 font-mono mt-0.5">ledger #{e.ledger}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
