import React from 'react';

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
      <div className="max-w-2xl">
        <span className="pill border-accent/40 text-accent bg-accent-soft">Soroban · Testnet</span>
        <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight mt-4 leading-[1.1] text-chalk">
          Put money where your
          <span className="block text-accent">study habit is.</span>
        </h1>
        <p className="text-chalk/60 mt-4 text-base sm:text-lg leading-relaxed">
          Everyone in the group stakes the same amount. Show up to sessions, keep your stake.
          Miss too many, and whoever finishes the syllabus splits what you left behind.
        </p>
      </div>
    </section>
  );
}
