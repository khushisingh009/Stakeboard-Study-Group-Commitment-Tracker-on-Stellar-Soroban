export const NETWORK = {
  network: 'TESTNET',
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
};

export const CONTRACTS = {
  COHORT_CONTRACT_ID: import.meta.env.VITE_COHORT_CONTRACT_ID || 'CA...REPLACE_AFTER_DEPLOY',
  ATTENDANCE_CONTRACT_ID: import.meta.env.VITE_ATTENDANCE_CONTRACT_ID || 'CA...REPLACE_AFTER_DEPLOY',
  STAKE_TOKEN_ID: import.meta.env.VITE_STAKE_TOKEN_ID || 'CA...REPLACE_AFTER_DEPLOY',
};
