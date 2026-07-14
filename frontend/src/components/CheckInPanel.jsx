import React, { useState } from 'react';

export default function CheckInPanel({ onCheckIn, loading }) {
  const [cohortId, setCohortId] = useState('');
  const [milestoneIndex, setMilestoneIndex] = useState('');

  const canSubmit = cohortId !== '' && milestoneIndex !== '';

  return (
    <div className="card p-5 sm:p-6 space-y-4">
      <h3 className="font-display text-lg font-semibold text-chalk">Check in for today's session</h3>
      <p className="text-xs text-chalk/50">
        Check in during the session window. The organizer closes each session afterward, which reads your
        check-in on-chain before deciding who stays active.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-chalk/50 mb-1.5">Cohort ID</label>
          <input
            value={cohortId}
            onChange={(e) => setCohortId(e.target.value)}
            placeholder="0"
            className="w-full bg-slate_bg border border-rule rounded-card px-3 py-2 text-sm font-mono text-chalk focus:border-accent/60 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-chalk/50 mb-1.5">Session #</label>
          <input
            value={milestoneIndex}
            onChange={(e) => setMilestoneIndex(e.target.value)}
            placeholder="0"
            className="w-full bg-slate_bg border border-rule rounded-card px-3 py-2 text-sm font-mono text-chalk focus:border-accent/60 outline-none"
          />
        </div>
      </div>
      <button
        onClick={() => onCheckIn(cohortId, milestoneIndex)}
        disabled={!canSubmit || loading}
        className="btn-primary text-sm w-full"
      >
        {loading ? 'Checking in…' : "I'm here — check in on-chain"}
      </button>
    </div>
  );
}
