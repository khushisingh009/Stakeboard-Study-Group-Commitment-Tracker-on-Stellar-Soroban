import React from 'react';

const STATUS_STYLES = {
  Active: 'border-good/40 text-good bg-good/10',
  Dropped: 'border-bad/40 text-bad bg-bad/10',
};

/**
 * The signature UI element: a syllabus progress board — a row of milestone
 * dots showing how many sessions have closed, paired with a member roster
 * where each row shows miss count and status. This reads like a classroom
 * gradebook, not a generic list, because the whole point of the product is
 * visible collective progress plus individual accountability side by side.
 */
export default function SyllabusBoard({ cohort, onCloseMilestone, onFinalize, actionLoading }) {
  if (!cohort) {
    return (
      <div className="card p-8 text-center">
        <p className="text-chalk/40 text-sm">No cohort loaded. Start one or paste a Cohort ID to inspect.</p>
      </div>
    );
  }

  const allClosed = cohort.milestones_closed >= cohort.milestone_count;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-rule">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-semibold text-chalk">{cohort.title}</h3>
          <span className="pill border-rule text-chalk/60">
            {cohort.milestones_closed} / {cohort.milestone_count} sessions
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: cohort.milestone_count }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${i < cohort.milestones_closed ? 'bg-accent' : 'bg-rule'}`}
            />
          ))}
        </div>
      </div>

      <div className="divide-y divide-rule">
        {cohort.members.length === 0 && (
          <p className="px-5 sm:px-6 py-4 text-sm text-chalk/40">No members have joined yet.</p>
        )}
        {cohort.members.map((m, i) => (
          <div key={i} className="px-5 sm:px-6 py-3 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-chalk/60 truncate">{m.address}</span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-mono text-chalk/40">{m.misses} miss{m.misses !== 1 ? 'es' : ''}</span>
              <span className={`pill ${STATUS_STYLES[m.status] || STATUS_STYLES.Active}`}>{m.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 sm:px-6 py-4 border-t border-rule flex flex-wrap gap-2">
        {!allClosed && (
          <button
            className="btn-secondary text-xs py-2"
            disabled={actionLoading}
            onClick={() => onCloseMilestone(cohort.milestones_closed)}
          >
            Close session {cohort.milestones_closed + 1}
          </button>
        )}
        {allClosed && !cohort.finalized && (
          <button className="btn-primary text-xs py-2" disabled={actionLoading} onClick={onFinalize}>
            Finalize &amp; split the pool
          </button>
        )}
        {cohort.finalized && <p className="text-xs text-chalk/40 italic">Cohort finalized — stakes distributed.</p>}
      </div>
    </div>
  );
}
