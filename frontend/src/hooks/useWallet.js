import { useCallback, useEffect, useState } from 'react';
import { StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';
import { NETWORK } from '../contracts/config';

let kitInstance = null;
function getKit() {
  if (!kitInstance) {
    kitInstance = new StellarWalletsKit({ network: WalletNetwork.TESTNET, selectedWalletId: undefined, modules: allowAllModules() });
  }
  return kitInstance;
}

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('stakeboard:lastAddress');
    if (saved) setAddress(saved);
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const kit = getKit();
      await kit.openModal({
        onWalletSelected: async (option) => {
          kit.setWallet(option.id);
          const { address: addr } = await kit.getAddress();
          setAddress(addr);
          localStorage.setItem('stakeboard:lastAddress', addr);
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem('stakeboard:lastAddress');
  }, []);

  const signTransaction = useCallback(async (xdr) => {
    const kit = getKit();
    const { signedTxXdr } = await kit.signTransaction(xdr, { networkPassphrase: NETWORK.networkPassphrase, address });
    return signedTxXdr;
  }, [address]);

  const [balance, setBalance] = useState(null);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }
    try {
      const { tokenClient } = await import('../contracts/cohortClient');
      const bal = await tokenClient.balance(address, address);
      if (bal !== null) {
        setBalance((Number(bal) / 10000000).toFixed(2));
      }
    } catch (err) {
      console.error('Failed to fetch balance', err);
    }
  }, [address]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { address, balance, connecting, error, connect, disconnect, signTransaction, isConnected: !!address, fetchBalance };
}
