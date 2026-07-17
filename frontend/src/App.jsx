import React, { useState } from 'react';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
import CreateCohortForm from './components/CreateCohortForm';
import CohortLookup from './components/CohortLookup';
import SyllabusBoard from './components/SyllabusBoard';
import CheckInPanel from './components/CheckInPanel';
import EventFeed from './components/EventFeed';
import Banner from './components/Banner';
import Skeleton from './components/Skeleton';
import { useWallet } from './hooks/useWallet';
import { useContractEvents } from './hooks/useContractEvents';
import { cohortClient, attendanceClient } from './contracts/cohortClient';
import { CONTRACTS } from './contracts/config';

export default function App() {
  const wallet = useWallet();
  const { events, connected, error: eventError } = useContractEvents();

  const [view, setView] = useState('create');
  const [cohort, setCohort] = useState(null);
  const [currentCohortId, setCurrentCohortId] = useState(null);
  const [loadingCohort, setLoadingCohort] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleLookup(cohortId) {
    setError(null);
    setLoadingCohort(true);
    try {
      const result = await cohortClient.getCohort(cohortId, wallet.address);
      setCohort(result);
      setCurrentCohortId(cohortId);
    } catch (err) {
      setError(`Could not load cohort #${cohortId}. It may not exist, or contract IDs in config.js need updating. (${err.message})`);
      setCohort(null);
    } finally {
      setLoadingCohort(false);
    }
  }

  async function handleJoin(cohortId) {
    if (!wallet.isConnected) {
      setError('Connect a wallet first to join a cohort.');
      return;
    }
    setError(null);
    setJoinLoading(true);
    try {
      const { hash } = await cohortClient.joinCohort(cohortId, wallet.address, wallet.signTransaction);
      setSuccess(`Joined the cohort and posted stake. Transaction: ${hash}`);
      await wallet.fetchBalance();
      await handleLookup(cohortId);
    } catch (err) {
      setError(`Failed to join cohort: ${err.message}`);
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleCreate({ title, stakeAmount, milestoneCount, maxMisses }) {
    if (!wallet.isConnected) {
      setError('Connect a wallet first to start a cohort.');
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const { hash } = await cohortClient.createCohort(
        wallet.address,
        title,
        CONTRACTS.STAKE_TOKEN_ID,
        stakeAmount,
        CONTRACTS.ATTENDANCE_CONTRACT_ID,
        milestoneCount,
        maxMisses,
        wallet.signTransaction
      );
      setSuccess(`Cohort created on-chain. Transaction: ${hash}`);
      await wallet.fetchBalance();
      setView('cohort');
    } catch (err) {
      setError(`Failed to create cohort: ${err.message}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleCloseMilestone(milestoneIndex) {
    if (!wallet.isConnected || currentCohortId === null) {
      setError('Connect a wallet and load a cohort first.');
      return;
    }
    setError(null);
    setActionLoading(true);
    try {
      const { hash } = await cohortClient.closeMilestone(currentCohortId, milestoneIndex, wallet.address, wallet.signTransaction);
      setSuccess(`Session closed and attendance checked. Transaction: ${hash}`);
      await wallet.fetchBalance();
      await handleLookup(currentCohortId);
    } catch (err) {
      setError(`Could not close session: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFinalize() {
    if (!wallet.isConnected || currentCohortId === null) return;
    setError(null);
    setActionLoading(true);
    try {
      const { hash } = await cohortClient.finalizeCohort(currentCohortId, wallet.address, wallet.signTransaction);
      setSuccess(`Cohort finalized — stakes distributed. Transaction: ${hash}`);
      await wallet.fetchBalance();
      await handleLookup(currentCohortId);
    } catch (err) {
      setError(`Could not finalize cohort: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckIn(cohortId, milestoneIndex) {
    if (!wallet.isConnected) {
      setError('Connect a wallet first to check in.');
      return;
    }
    setError(null);
    setCheckingIn(true);
    try {
      const { hash } = await attendanceClient.checkIn(cohortId, milestoneIndex, wallet.address, wallet.signTransaction);
      setSuccess(`Checked in for session ${milestoneIndex}. Transaction: ${hash}`);
      await wallet.fetchBalance();
    } catch (err) {
      setError(`Check-in failed: ${err.message}`);
    } finally {
      setCheckingIn(false);
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar wallet={wallet} view={view} onViewChange={setView} />
      {view === 'create' && <Hero />}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-6">
        {(error || wallet.error) && <Banner type="error" message={error || wallet.error} onDismiss={() => setError(null)} />}
        {success && <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {view === 'create' && <CreateCohortForm onCreate={handleCreate} loading={creating} />}

            {view === 'cohort' && (
              <>
                <CohortLookup onLookup={handleLookup} onJoin={handleJoin} loading={loadingCohort} joinLoading={joinLoading} />
                {loadingCohort ? (
                  <Skeleton />
                ) : (
                  <SyllabusBoard
                    cohort={cohort}
                    onCloseMilestone={handleCloseMilestone}
                    onFinalize={handleFinalize}
                    actionLoading={actionLoading}
                  />
                )}
              </>
            )}

            {view === 'checkin' && <CheckInPanel onCheckIn={handleCheckIn} loading={checkingIn} />}
          </div>

          <div className="lg:col-span-1">
            <EventFeed events={events} connected={connected} error={eventError} />
          </div>
        </div>
      </main>

      <footer className="border-t border-rule py-8 text-center">
        <p className="text-xs text-chalk/30 font-mono">
          Stakeboard · Soroban Testnet · Cohort {CONTRACTS.COHORT_CONTRACT_ID.slice(0, 6)}…{CONTRACTS.COHORT_CONTRACT_ID.slice(-4)}
        </p>
      </footer>
    </div>
  );
}
