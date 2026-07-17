# 📚 Stakeboard — Study Group Commitment Tracker on Stellar Soroban

> Put money where your study habit is. Everyone in the group posts the same stake to join a shared syllabus. Show up to sessions, keep your stake. Miss too many, and you're dropped — and whoever finishes the syllabus splits the pool of everyone who didn't.

---

## 🔗 Live Demo & Video Pitch

| | |
|---|---|
| 🌐 **Live Platform** | [stakeboard-study-group-commitment-t.vercel.app](https://stakeboard-study-group-commitment-t.vercel.app/) |
| 🎬 **Demo Video** | [Watch on Google Drive](https://drive.google.com/file/d/1PE61Fp2iLiV4yl-Wt-jSm2ZNreVAWhau/view?usp=sharing) |
| 📦 **GitHub Repo** | [khushisingh009/Stakeboard-Study-Group-Commitment-Tracker-on-Stellar-Soroban](https://github.com/khushisingh009/Stakeboard-Study-Group-Commitment-Tracker-on-Stellar-Soroban) |

---

## ✅ Submission Checklist

| Requirement | Status | Details |
|---|---|---|
| Public GitHub repository | ✅ | [View on GitHub](https://github.com/khushisingh009/Stakeboard-Study-Group-Commitment-Tracker-on-Stellar-Soroban) |
| README with complete documentation | ✅ | This document |
| Minimum 10+ meaningful commits | ✅ | 15+ commits on `main` |
| Live demo link | ✅ | [stakeboard-study-group-commitment-t.vercel.app](https://stakeboard-study-group-commitment-t.vercel.app/) |
| Attendance contract address | ✅ | `CCRUCGYIQVO4XDAGV7ALUHV5QQG3WXKO6G33VGOKGHMPZR5SZ3G2YESX` |
| Cohort contract address | ✅ | `CD54FDYS47GEYUONKXHWGYL7ULGWS7NPRJU45YYYKUUHMHIAJYVT7I5Q` |
| Transaction hash (contract interaction) | ✅ | [`af99a84b…265ebe0a`](https://stellar.expert/explorer/testnet/tx/af99a84beac8b06f4646df37c62562bde14bdad55b8a828458ffcdfe265ebe0a) — `create_cohort` on testnet |
| Mobile responsive UI screenshot | ✅ | See gallery below |
| CI/CD pipeline screenshot | ✅ | See gallery below |
| Test output (3+ passing tests) | ✅ | See gallery below |
| Demo video | ✅ | [Google Drive](https://drive.google.com/file/d/1PE61Fp2iLiV4yl-Wt-jSm2ZNreVAWhau/view?usp=sharing) |

---

## 🌟 Key Features

1. **Commitment Device on Soroban** — Every member posts the same XLM stake. Miss too many sessions and you're dropped. Survivors split the entire pool — including the stakes of those who dropped out.
2. **Cross-Contract Architecture** — The `StudyCohort` contract makes financial decisions by reading from a separate `AttendanceLog` contract via cross-contract calls inside `close_milestone`. Neither contract owns the other's data.
3. **Real Wallet Integration** — Full Freighter wallet connect via Stellar Wallets Kit with live XLM balance tracking and cryptographic transaction signing on Stellar Testnet.
4. **Live Event Feed** — Every on-chain state change (`CohortCreated`, `MemberJoined`, `MilestoneClosed`, `MemberDropped`, `CohortFinalized`) is streamed live to the UI via Soroban's `getEvents` RPC.
5. **Premium UI** — Built with React 18 + Vite featuring dark mode, glassmorphism, animated session progress bars, and a real-time member roster. Fully mobile responsive.

---

## 📸 Platform Gallery & Submission Requirements

### 1. Mobile Responsive UI
The platform is fully responsive and optimized for all screen sizes.

<img src="images/mobile responsive.png" width="100%" alt="Mobile Responsive UI" />

### 2. CI/CD Pipeline Running
Automated GitHub Actions workflow running smart contract tests and frontend build on every push to `main`.

<img src="images/CI CD.png" width="100%" alt="CI/CD Pipeline Running" />

### 3. Test Output (3+ Passing Tests)
Rust unit tests covering contract logic + Vitest frontend component tests.

<img src="images/test output.png" width="100%" alt="Test Output" />

---

## 🏗 Architecture

```
Organizer / Members
        │
        ▼
 React frontend (syllabus board, check-in, live activity feed)
        │  @stellar/stellar-sdk  →  Soroban RPC
        ▼
 StudyCohort contract ──────► Token contract (stake deposits & pool payout)
        │
        └──────────────────► AttendanceLog contract (did_attend — cross-contract per member per session)
```

**Inter-contract communication**: `close_milestone` in the Cohort contract loops over every active member and calls `did_attend` on the AttendanceLog contract to decide who missed the session — a read-style cross-contract call in a loop, demonstrating one contract depending on another's state to make financial decisions.

**Event streaming**: every state change is emitted as a Soroban contract event. The frontend's `useContractEvents` hook polls `getEvents` and renders a live activity feed without page refreshes.

---

## 📁 Project Structure

```
study-stake/
├── contracts/
│   ├── cohort/            # Main contract: stakes, milestones, payout
│   │   └── src/
│   │       ├── lib.rs     # create_cohort, join_cohort, close_milestone, finalize_cohort
│   │       └── test.rs    # 7 Rust unit tests
│   └── attendance/        # Check-in log, read cross-contract
│       └── src/
│           ├── lib.rs     # check_in, did_attend, get_attendees
│           └── test.rs    # 6 Rust unit tests
├── frontend/
│   ├── src/
│   │   ├── components/    # SyllabusBoard, CreateCohortForm, CheckInPanel, Banner, EventFeed
│   │   ├── hooks/         # useWallet, useContractEvents
│   │   ├── contracts/     # cohortClient.js (stellar-sdk integration), config.js
│   │   └── test/          # Vitest + Testing Library specs
│   └── package.json
├── scripts/
│   ├── deploy.sh               # Deploys & initializes both contracts to testnet
│   └── sample_interaction.sh   # Creates a demo cohort + join for real tx hashes
├── images/                     # Screenshots for submission
├── .github/workflows/
│   ├── ci.yml                  # Contract tests + frontend tests + build
│   └── deploy_frontend.yml     # Frontend deployment workflow
└── vercel.json
```

---

## 📜 Smart Contract Design

### StudyCohort Contract (`contracts/cohort`)

| Function | Caller | What it does |
|---|---|---|
| `create_cohort` | Organizer | Sets stake amount, syllabus length (milestone count), and miss tolerance |
| `join_cohort` | Student | Transfers stake from member to contract, becomes active member |
| `close_milestone` | Anyone | **Cross-contract loop** over AttendanceLog to check attendance; drops members who exceed `max_misses` |
| `finalize_cohort` | Anyone (after all sessions closed) | Splits the full stake pool evenly among still-active members |
| `get_cohort` | Anyone (read-only) | Returns full cohort state including member roster and status |

### AttendanceLog Contract (`contracts/attendance`)

| Function | Caller | What it does |
|---|---|---|
| `initialize` | Deployer | Records the Cohort contract address |
| `check_in` | Any member | Self-reported attendance for a specific session index |
| `did_attend` | Anyone, incl. Cohort cross-contract | Returns `bool` — whether a given member checked in |
| `get_attendees` / `attendance_count` | Anyone (read-only) | Roster / count for a session |

Errors are typed contract errors (`CohortError`, `AttendanceError`) rather than panics, giving the frontend a clean, catchable failure reason (e.g. `AllMilestonesNotClosed` if someone tries to finalize early).

---

## 💻 Frontend Integration

The frontend uses `@stellar/stellar-sdk` to interact with both deployed Soroban contracts.

**Key integration files:**
- [`frontend/src/contracts/cohortClient.js`](frontend/src/contracts/cohortClient.js) — `CohortClient`, `AttendanceClient`, `TokenClient` classes wrapping every contract call
- [`frontend/src/contracts/config.js`](frontend/src/contracts/config.js) — Contract IDs and network config
- [`frontend/src/hooks/useWallet.js`](frontend/src/hooks/useWallet.js) — Freighter wallet connect + transaction signing
- [`frontend/src/hooks/useContractEvents.js`](frontend/src/hooks/useContractEvents.js) — Live event polling via Soroban RPC

**Deployed contract IDs (Stellar Testnet):**
```
VITE_COHORT_CONTRACT_ID=CD54FDYS47GEYUONKXHWGYL7ULGWS7NPRJU45YYYKUUHMHIAJYVT7I5Q
VITE_ATTENDANCE_CONTRACT_ID=CCRUCGYIQVO4XDAGV7ALUHV5QQG3WXKO6G33VGOKGHMPZR5SZ3G2YESX
VITE_NATIVE_TOKEN_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

**Transaction proof** — `create_cohort` called on-chain:
> [`af99a84beac8b06f4646df37c62562bde14bdad55b8a828458ffcdfe265ebe0a`](https://stellar.expert/explorer/testnet/tx/af99a84beac8b06f4646df37c62562bde14bdad55b8a828458ffcdfe265ebe0a)

---

## 🚀 Running Locally

### Contracts

```bash
# Requires Rust + wasm32-unknown-unknown target + Stellar CLI
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli

cargo test --workspace         # run all 13 contract unit tests
stellar contract build         # build .wasm files
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # local dev server at http://localhost:5173
npm run test     # Vitest unit tests
npm run build    # production bundle
```

### Environment Variables

Copy `frontend/.env.example` to `frontend/.env` and fill in your contract IDs:

```
VITE_COHORT_CONTRACT_ID=
VITE_ATTENDANCE_CONTRACT_ID=
VITE_NATIVE_TOKEN_ID=
```

---

## 🌐 Deployment (Testnet)

```bash
stellar keys generate deployer --network testnet --fund
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Output:
```
VITE_ATTENDANCE_CONTRACT_ID=CCRUCGYIQVO4XDAGV7ALUHV5QQG3WXKO6G33VGOKGHMPZR5SZ3G2YESX
VITE_COHORT_CONTRACT_ID=CD54FDYS47GEYUONKXHWGYL7ULGWS7NPRJU45YYYKUUHMHIAJYVT7I5Q
VITE_NATIVE_TOKEN_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

Deploy the frontend to Vercel pointing at `frontend/` as the root, with the `VITE_*` env vars set in the Vercel dashboard.

---

## ⚙️ CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`:

1. **Contracts job** — builds both contracts to `wasm32-unknown-unknown` and runs `cargo test --workspace` (13 tests).
2. **Frontend job** — installs deps, runs Vitest, builds the production bundle.
3. **Deploy job** — gates on both passing, then deploys the frontend.

---

## 🧪 Testing

- **Contracts** — 13 Rust unit tests total (7 in `cohort`, 6 in `attendance`) covering joining, multi-hop session closes, drop logic, pool splitting, double check-in rejection, and not-found error cases.
  ```bash
  cargo test --workspace
  ```
- **Frontend** — Vitest + React Testing Library specs for the syllabus board and cohort creation form.
  ```bash
  cd frontend && npm run test
  ```

---

## 🗺 Why This Project

Study groups fall apart because there's no cost to flaking. This project gives the group a shared financial stake in everyone's follow-through:

- **Symmetric and mechanical** — Everyone posts the same amount; no one's attendance is worth more than anyone else's.
- **Separation of concerns** — AttendanceLog is a neutral, append-only witness. The Cohort contract makes financial decisions based on what it reads back via cross-contract calls.
- **Redistribution, not burning** — Dropped members' stakes go directly to the people who did the work — a stronger incentive than an abstract "you lose your deposit."

---

## 📄 License

MIT
