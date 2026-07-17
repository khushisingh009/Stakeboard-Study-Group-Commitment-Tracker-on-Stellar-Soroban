import React from 'react';

function truncate(address) {
  if (!address) return '';
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function NavBar({ wallet, view, onViewChange }) {
  const tabs = [
    { id: 'create', label: 'Start a cohort' },
    { id: 'cohort', label: 'My cohort' },
    { id: 'checkin', label: 'Check in' },
  ];
  return (
    <header className="sticky top-0 z-30 bg-slate_bg/90 backdrop-blur border-b border-rule">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-card bg-accent-soft border border-accent/40 flex items-center justify-center">
            <span className="font-display font-bold text-accent text-sm">S</span>
          </div>
          <span className="font-display font-semibold text-chalk tracking-tight">Stakeboard</span>
          <span className="hidden sm:inline text-[10px] font-mono text-chalk/40 border border-rule rounded px-1.5 py-0.5 ml-1 uppercase">
            testnet
          </span>
        </div>

        <nav className="hidden sm:flex items-center gap-1">
          {tabs.map((v) => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={`text-sm px-3 py-1.5 rounded-card transition-colors ${
                view === v.id ? 'bg-accent-soft border border-accent/30 text-accent' : 'text-chalk/60 hover:text-chalk'
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>

        {wallet.isConnected ? (
          <button onClick={wallet.disconnect} className="btn-secondary text-sm font-mono flex items-center gap-2">
            <span>{wallet.balance !== null ? `${wallet.balance} XLM` : '...'}</span>
            <span className="text-chalk/40">|</span>
            <span>{truncate(wallet.address)}</span>
          </button>
        ) : (
          <button onClick={wallet.connect} disabled={wallet.connecting} className="btn-primary text-sm">
            {wallet.connecting ? 'Connecting…' : 'Connect wallet'}
          </button>
        )}
      </div>

      <div className="sm:hidden flex border-t border-rule">
        {tabs.map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={`flex-1 text-xs py-2.5 ${view === v.id ? 'text-accent border-b-2 border-accent' : 'text-chalk/40'}`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </header>
  );
}
