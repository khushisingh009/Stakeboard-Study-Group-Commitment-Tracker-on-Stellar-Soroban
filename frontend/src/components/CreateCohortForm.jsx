import React, { useState } from 'react';

export default function CreateCohortForm({ onCreate, loading }) {
  const [title, setTitle] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [milestoneCount, setMilestoneCount] = useState('8');
  const [maxMisses, setMaxMisses] = useState('1');

  const canSubmit = title && stakeAmount;

  return (
    <form
      className="card p-5 sm:p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({
          title,
          stakeAmount: Number(stakeAmount),
          milestoneCount: Number(milestoneCount),
          maxMisses: Number(maxMisses),
        });
      }}
    >
      <h3 className="font-display text-lg font-semibold text-chalk">Start a study cohort</h3>

      <div>
        <label className="block text-xs text-chalk/50 mb-1.5">Syllabus title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Rust Study Group — Fall Cohort"
          className="w-full bg-slate_bg border border-rule rounded-card px-3 py-2 text-sm text-chalk focus:border-accent/60 outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-chalk/50 mb-1.5">Stake (each)</label>
          <input
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            type="number"
            min="0"
            placeholder="50"
            className="w-full bg-slate_bg border border-rule rounded-card px-3 py-2 text-sm font-mono text-chalk focus:border-accent/60 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-chalk/50 mb-1.5">Sessions</label>
          <input
            value={milestoneCount}
            onChange={(e) => setMilestoneCount(e.target.value)}
            type="number"
            min="1"
            className="w-full bg-slate_bg border border-rule rounded-card px-3 py-2 text-sm font-mono text-chalk focus:border-accent/60 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-chalk/50 mb-1.5">Max misses</label>
          <input
            value={maxMisses}
            onChange={(e) => setMaxMisses(e.target.value)}
            type="number"
            min="0"
            className="w-full bg-slate_bg border border-rule rounded-card px-3 py-2 text-sm font-mono text-chalk focus:border-accent/60 outline-none"
          />
        </div>
      </div>

      <button type="submit" disabled={!canSubmit || loading} className="btn-primary text-sm w-full">
        {loading ? 'Publishing…' : 'Create cohort on-chain'}
      </button>
    </form>
  );
}
