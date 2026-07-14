# Stakeboard — Study Group Commitment Tracker on Stellar Soroban

Everyone in the group posts the same stake to join a shared syllabus.
Show up to sessions, keep your stake. Miss too many, and you're dropped —
and whoever finishes the syllabus splits the pool of everyone who didn't.
A separate AttendanceLog contract is the tamper-evident record of who
actually showed up, checked cross-contract every time a session closes.

Built for the Stellar Orange Belt submission — commitment devices for
personal habits/education is a distinct domain from payment escrow,
ticketing, barter, or supply-chain tracking.

---

## Why this project

Study groups fall apart because there's no cost to flaking — you can skip
every session and face nothing but mild social awkwardness. This project
gives the group a shared financial stake in everyone's follow-through:

- **The stake is symmetric and mechanical.** Everyone posts the same amount; nobody's attendance is worth more than anyone else's.
- **Attendance and stake logic are deliberately separate contracts.** AttendanceLog is a neutral, append-only witness that anyone (not just the organizer) can check in against; the Cohort contract makes the actual financial decisions based on what it reads back.
- **The penalty is redistribution, not burning.** Dropped members' stakes don't disappear — they go directly to the people who actually did the work, which is a stronger incentive than an abstract "you lose your deposit."

---

## Architecture

```
Organizer / Members
        │
        ▼
 React frontend (syllabus board, check-in, live activity feed)
        │
        ▼
 StudyCohort contract ──────► Token contract (stake deposits & pool payout)
        │
        └──────────────────► AttendanceLog contract (did_attend, read once per active member per session)
```

**Inter-contract communication**: the Cohort contract's `close_milestone`
calls into AttendanceLog's `did_attend` once for every active member, to
decide who missed the session before updating anyone's status
(`contracts/cohort/src/lib.rs`). This is a read-style cross-contract call
made in a loop, which is a different shape than a single write call — it
demonstrates the Cohort contract depending on AttendanceLog's state to make
its own financial decisions, without either contract owning the other's
data.

**Event streaming**: every state change (`CohortCreated`, `MemberJoined`,
`MilestoneClosed`, `MemberDropped`, `CohortFinalized`) is emitted as a
Soroban contract event. The frontend's `useContractEvents` hook polls
`getEvents` on a short interval and renders a live activity feed, so the
whole cohort can watch sessions close and see who's still on track without
refreshing.

---

## Project structure

```
study-stake/
├── contracts/
│   ├── cohort/            # Main contract: stakes, milestones, payout
│   │   └── src/
│   │       ├── lib.rs
│   │       └── test.rs    # 7 unit tests
│   └── attendance/          # Check-in log, read cross-contract
│       └── src/
│           ├── lib.rs
│           └── test.rs    # 6 unit tests
├── frontend/
│   ├── src/
│   │   ├── components/     # SyllabusBoard, CreateCohortForm, CheckInPanel
│   │   ├── hooks/          # useWallet, useContractEvents
│   │   ├── contracts/      # cohortClient.js, config.js
│   │   └── test/           # Vitest + Testing Library specs
│   └── package.json
├── scripts/
│   ├── deploy.sh               # Deploys + initializes both contracts to testnet
│   └── sample_interaction.sh   # Creates a cohort + joins it for a demo tx hash
├── .github/workflows/ci.yml    # CI: contract tests + frontend tests + build
└── vercel.json
```

---

## Smart contract design

### StudyCohort contract (`contracts/cohort`)

| Function | Caller | What it does |
|---|---|---|
| `create_cohort` | Organizer | Sets stake amount, syllabus length, and miss tolerance |
| `join_cohort` | Student | Posts stake, becomes an active member |
| `close_milestone` | Anyone | Cross-contract loop over AttendanceLog to check who attended; drops members who exceed `max_misses` |
| `finalize_cohort` | Anyone (after all sessions closed) | Splits the full stake pool evenly among still-active members |
| `get_cohort` | Anyone (read-only) | Returns full cohort state including member roster |

### AttendanceLog contract (`contracts/attendance`)

| Function | Caller | What it does |
|---|---|---|
| `initialize` | Deployer | Records the Cohort contract address (informational; check-ins are member-signed directly) |
| `check_in` | Any member | Self-reported attendance for a specific session |
| `did_attend` | Anyone, including Cohort cross-contract | Returns whether a given member checked in for a session |
| `get_attendees` / `attendance_count` | Anyone (read-only) | Roster / count for a session |

Errors are typed contract errors (`CohortError`, `AttendanceError`) rather
than panics, so the frontend gets a clean, catchable failure reason —
e.g. "all milestones not closed" if someone tries to finalize early —
instead of a raw trap.

---

## Frontend

- **React 18 + Vite + Tailwind**, mobile-first, styled around a classroom
  gradebook metaphor — a syllabus progress bar of session dots paired with
  a member roster showing miss counts and status, rather than a generic
  dashboard.
- **Wallet connect** via Stellar Wallets Kit (Freighter, xBull, Albedo, etc.).
- **Three views**: Start a cohort (organizer), My cohort (progress board +
  join + close/finalize actions), Check in (self-service attendance).
- **Live activity feed** driven by `useContractEvents` (polls Soroban RPC `getEvents`).
- **Error and loading states** throughout: skeleton loaders while fetching
  a cohort, dismissible error/success banners, disabled buttons
  mid-transaction.

### Environment variables

Copy `frontend/.env.example` to `frontend/.env` and fill in the contract IDs
from `scripts/deploy.sh`:

```
VITE_COHORT_CONTRACT_ID=
VITE_ATTENDANCE_CONTRACT_ID=
VITE_STAKE_TOKEN_ID=
```

---

## Running locally

### Contracts

```bash
# Requires Rust + wasm32-unknown-unknown target + Stellar CLI
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli

cargo test --workspace          # run all contract tests
stellar contract build           # build .wasm files
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # local dev server
npm run test      # Vitest unit tests
npm run build     # production build
```

---

## Deployment (testnet)

```bash
stellar keys generate deployer --network testnet --fund
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This builds both contracts, deploys them to Stellar Testnet, initializes
AttendanceLog with the Cohort contract's address, and prints both contract
IDs.

Then run the sample interaction script to create a demo cohort and join it,
generating real transaction hashes for your submission:

```bash
chmod +x scripts/sample_interaction.sh
# fill in the contract IDs at the top of the script first
./scripts/sample_interaction.sh
```

Deploy the frontend to Vercel/Netlify pointing at `frontend/` as the root
(see `vercel.json`), with the three `VITE_*` env vars set in the dashboard.

---

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`:

1. **Contracts job** — builds both contracts to `wasm32-unknown-unknown` and runs `cargo test --workspace`.
2. **Frontend job** — installs deps, lints, runs Vitest, builds the production bundle.
3. **Deploy-readiness job** — gates on both passing before signaling the build is deploy-ready.

---

## Testing

- **Contracts**: 13 Rust unit tests total (7 in `cohort`, 6 in `attendance`) covering joining, multi-hop session closes, drop logic, pool splitting, double check-in rejection, and not-found cases. Run with `cargo test --workspace`.
- **Frontend**: Vitest + React Testing Library specs for the syllabus board's session progress/roster rendering and the cohort creation form's field conversion. Run with `npm run test` inside `frontend/`.

---

## Submission checklist mapping

| Requirement | Where |
|---|---|
| Inter-contract communication | `cohort::close_milestone` calls `attendance::did_attend` once per active member |
| Event streaming & real-time updates | Contract events + `useContractEvents` polling hook |
| CI/CD pipeline | `.github/workflows/ci.yml` |
| Deployment workflow | `scripts/deploy.sh` |
| Mobile responsive frontend | Tailwind responsive layout, syllabus board stacks cleanly on narrow screens |
| Error handling & loading states | `Banner.jsx`, `Skeleton.jsx`, try/catch in `App.jsx` |
| Tests (contracts + frontend) | `contracts/*/src/test.rs`, `frontend/src/test/*.test.jsx` |
| Documentation | This README + inline doc comments in every contract |

---

## License

MIT
