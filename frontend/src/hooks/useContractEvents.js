import { useEffect, useRef, useState } from 'react';
import { rpc } from '@stellar/stellar-sdk';
import { NETWORK, CONTRACTS } from '../contracts/config';

const server = new rpc.Server(NETWORK.rpcUrl);
const POLL_INTERVAL_MS = 4000;

/**
 * Streams Cohort contract events (CohortCreated, MemberJoined,
 * MilestoneClosed, MemberDropped, CohortFinalized) by polling `getEvents`
 * from the last-seen ledger. Soroban RPC has no native websocket push, so
 * short-interval polling is the standard pattern for "live" updates —
 * powers the cohort's shared activity feed so the whole group can watch
 * milestones close and see who's still on track in real time.
 */
export function useContractEvents(contractId = CONTRACTS.COHORT_CONTRACT_ID) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let timer;

    async function initCursor() {
      try {
        const latest = await server.getLatestLedger();
        cursorRef.current = Math.max(latest.sequence - 100, 1);
      } catch (err) {
        setError(err.message);
      }
    }

    async function poll() {
      if (cancelled || cursorRef.current === null) return;
      try {
        const response = await server.getEvents({
          startLedger: cursorRef.current,
          filters: [{ type: 'contract', contractIds: [contractId] }],
          limit: 50,
        });
        setConnected(true);
        if (response.events?.length) {
          setEvents((prev) => {
            const merged = [...response.events, ...prev];
            const seen = new Set();
            return merged.filter((e) => {
              const key = `${e.id}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            }).slice(0, 100);
          });
          cursorRef.current = response.latestLedger + 1;
        } else if (response.latestLedger) {
          cursorRef.current = response.latestLedger;
        }
        setError(null);
      } catch (err) {
        setConnected(false);
        setError(err.message);
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    initCursor().then(poll);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [contractId]);

  return { events, connected, error };
}
