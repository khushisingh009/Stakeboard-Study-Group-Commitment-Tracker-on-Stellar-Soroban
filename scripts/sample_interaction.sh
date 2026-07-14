#!/usr/bin/env bash
# Runs an end-to-end interaction against deployed testnet contracts so you
# have a real transaction hash for the submission checklist: create a
# cohort and join it.
#
# Fill in these values after running deploy.sh:
COHORT_ID_CONTRACT="REPLACE_WITH_COHORT_CONTRACT_ID"
ATTENDANCE_ID="REPLACE_WITH_ATTENDANCE_CONTRACT_ID"
STAKE_TOKEN_ID="REPLACE_WITH_TESTNET_TOKEN_ID"
ORGANIZER_IDENTITY="deployer"

set -euo pipefail

ORGANIZER_ADDRESS="$(stellar keys address $ORGANIZER_IDENTITY)"

echo "==> Creating a sample cohort"
stellar contract invoke \
  --id "$COHORT_ID_CONTRACT" \
  --source "$ORGANIZER_IDENTITY" \
  --network testnet \
  -- create_cohort \
  --organizer "$ORGANIZER_ADDRESS" \
  --title "Rust Study Group" \
  --stake_token "$STAKE_TOKEN_ID" \
  --stake_amount 100 \
  --attendance_log "$ATTENDANCE_ID" \
  --milestone_count 4 \
  --max_misses 1

echo ""
echo "==> Joining the cohort as the organizer (assumes cohort_id 0; adjust if not)"
stellar contract invoke \
  --id "$COHORT_ID_CONTRACT" \
  --source "$ORGANIZER_IDENTITY" \
  --network testnet \
  -- join_cohort \
  --cohort_id 0 \
  --member "$ORGANIZER_ADDRESS"

echo ""
echo "Copy the transaction hashes printed above into your README / submission form."
