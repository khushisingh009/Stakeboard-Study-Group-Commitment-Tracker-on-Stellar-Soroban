#!/usr/bin/env bash
# Deploys the AttendanceLog and StudyCohort contracts to Stellar Testnet.
#
# Prerequisites:
#   - Stellar CLI installed: https://developers.stellar.org/docs/tools/cli
#   - A funded testnet identity: `stellar keys generate deployer --network testnet --fund`
#
# Usage:
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh

set -euo pipefail

NETWORK="testnet"
IDENTITY="deployer"

echo "==> Building contracts"
stellar contract build

echo "==> Deploying AttendanceLog contract"
ATTENDANCE_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/attendance_log.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK")
echo "AttendanceLog deployed at: $ATTENDANCE_ID"

echo "==> Deploying StudyCohort contract"
COHORT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/study_cohort.wasm \
  --source "$IDENTITY" \
  --network "$NETWORK")
echo "StudyCohort deployed at: $COHORT_ID"

echo "==> Initializing AttendanceLog (authorizing the Cohort contract to call it)"
stellar contract invoke \
  --id "$ATTENDANCE_ID" \
  --source "$IDENTITY" \
  --network "$NETWORK" \
  -- initialize \
  --cohort_contract "$COHORT_ID"

echo ""
echo "=================================================="
echo " Deployment complete"
echo "=================================================="
echo " AttendanceLog contract ID: $ATTENDANCE_ID"
echo " StudyCohort contract ID:   $COHORT_ID"
echo ""
echo " Next steps:"
echo " 1. Add these IDs to frontend/.env as VITE_ATTENDANCE_CONTRACT_ID and VITE_COHORT_CONTRACT_ID"
echo " 2. Deploy or reuse a testnet SEP-41 token for stakes, set VITE_STAKE_TOKEN_ID"
echo " 3. Run scripts/sample_interaction.sh to create a cohort for your submission's tx hash"
echo "=================================================="
