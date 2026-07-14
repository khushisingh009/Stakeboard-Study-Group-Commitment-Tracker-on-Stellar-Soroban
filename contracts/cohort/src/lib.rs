//! Study Cohort Contract
//!
//! A group commits to a shared study syllabus. Each member posts a
//! stablecoin stake to join. The syllabus is a fixed sequence of
//! milestones (sessions); after each milestone's window closes, anyone can
//! call `close_milestone`, which makes a cross-contract call into the
//! AttendanceLog contract to check who actually attended. Members who miss
//! too many milestones are marked dropped; at the end, everyone who
//! finished splits the stakes forfeited by anyone who dropped out.

#![no_std]

use soroban_sdk::{contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env, String, Vec};

mod attendance {
    soroban_sdk::contractimport!(
        file = "../attendance/target/wasm32-unknown-unknown/release/attendance_log.wasm"
    );
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MemberStatus {
    Active,
    Dropped,
}

#[contracttype]
#[derive(Clone)]
pub struct Member {
    pub address: Address,
    pub status: MemberStatus,
    pub misses: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Cohort {
    pub organizer: Address,
    pub title: String,
    pub stake_token: Address,
    pub stake_amount: i128,
    pub attendance_log: Address,
    pub milestone_count: u32,
    pub milestones_closed: u32,
    pub max_misses: u32,
    pub members: Vec<Member>,
    pub finalized: bool,
}

#[contracttype]
pub enum DataKey {
    Cohort(u64),
    NextCohortId,
    MilestoneClosed(u64, u32), // (cohort_id, milestone_index) -> bool marker
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum CohortError {
    CohortNotFound = 1,
    Unauthorized = 2,
    AlreadyJoined = 3,
    NotAMember = 4,
    MilestoneAlreadyClosed = 5,
    AllMilestonesNotClosed = 6,
    AlreadyFinalized = 7,
    InvalidMilestoneIndex = 8,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct CohortCreated {
    #[topic]
    pub cohort_id: u64,
    pub organizer: Address,
    pub stake_amount: i128,
    pub milestone_count: u32,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct MemberJoined {
    #[topic]
    pub cohort_id: u64,
    pub member: Address,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct MilestoneClosed {
    #[topic]
    pub cohort_id: u64,
    pub milestone_index: u32,
    pub attendee_count: u32,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct MemberDropped {
    #[topic]
    pub cohort_id: u64,
    pub member: Address,
}

#[contractevent]
#[derive(Clone, Debug)]
pub struct CohortFinalized {
    #[topic]
    pub cohort_id: u64,
    pub payout_per_finisher: i128,
}

#[contract]
pub struct StudyCohortContract;

#[contractimpl]
impl StudyCohortContract {
    /// Organizer creates a cohort. Organizer does not automatically join as
    /// a member — they call `join_cohort` separately if they want to study too.
    pub fn create_cohort(
        env: Env,
        organizer: Address,
        title: String,
        stake_token: Address,
        stake_amount: i128,
        attendance_log: Address,
        milestone_count: u32,
        max_misses: u32,
    ) -> Result<u64, CohortError> {
        organizer.require_auth();

        let cohort_id: u64 = env.storage().instance().get(&DataKey::NextCohortId).unwrap_or(0);
        env.storage().instance().set(&DataKey::NextCohortId, &(cohort_id + 1));

        let cohort = Cohort {
            organizer: organizer.clone(),
            title,
            stake_token,
            stake_amount,
            attendance_log,
            milestone_count,
            milestones_closed: 0,
            max_misses,
            members: Vec::new(&env),
            finalized: false,
        };
        env.storage().persistent().set(&DataKey::Cohort(cohort_id), &cohort);

        CohortCreated { cohort_id, organizer, stake_amount, milestone_count }.publish(&env);
        Ok(cohort_id)
    }

    /// A student posts their stake to join the cohort.
    pub fn join_cohort(env: Env, cohort_id: u64, member: Address) -> Result<(), CohortError> {
        member.require_auth();
        let mut cohort = Self::load_cohort(&env, cohort_id)?;

        for i in 0..cohort.members.len() {
            if cohort.members.get(i).unwrap().address == member {
                return Err(CohortError::AlreadyJoined);
            }
        }

        let token_client = token::Client::new(&env, &cohort.stake_token);
        token_client.transfer(&member, &env.current_contract_address(), &cohort.stake_amount);

        cohort.members.push_back(Member { address: member.clone(), status: MemberStatus::Active, misses: 0 });
        env.storage().persistent().set(&DataKey::Cohort(cohort_id), &cohort);

        MemberJoined { cohort_id, member }.publish(&env);
        Ok(())
    }

    /// Anyone can close a milestone once its session window has passed.
    /// Cross-contract call into AttendanceLog, once per active member, to
    /// check who showed up. Members who miss more than `max_misses` are
    /// marked dropped.
    pub fn close_milestone(env: Env, cohort_id: u64, milestone_index: u32) -> Result<(), CohortError> {
        let mut cohort = Self::load_cohort(&env, cohort_id)?;

        if milestone_index >= cohort.milestone_count {
            return Err(CohortError::InvalidMilestoneIndex);
        }
        let closed_key = DataKey::MilestoneClosed(cohort_id, milestone_index);
        if env.storage().persistent().has(&closed_key) {
            return Err(CohortError::MilestoneAlreadyClosed);
        }

        let attendance_client = attendance::Client::new(&env, &cohort.attendance_log);

        let mut attendee_count: u32 = 0;
        let mut updated_members = Vec::new(&env);
        for i in 0..cohort.members.len() {
            let mut m = cohort.members.get(i).unwrap();
            if m.status == MemberStatus::Active {
                // Cross-contract call: Cohort -> AttendanceLog
                let attended = attendance_client.did_attend(&cohort_id, &milestone_index, &m.address);
                if attended {
                    attendee_count += 1;
                } else {
                    m.misses += 1;
                    if m.misses > cohort.max_misses {
                        m.status = MemberStatus::Dropped;
                        MemberDropped { cohort_id, member: m.address.clone() }.publish(&env);
                    }
                }
            }
            updated_members.push_back(m);
        }
        cohort.members = updated_members;
        cohort.milestones_closed += 1;
        env.storage().persistent().set(&closed_key, &true);
        env.storage().persistent().set(&DataKey::Cohort(cohort_id), &cohort);

        MilestoneClosed { cohort_id, milestone_index, attendee_count }.publish(&env);
        Ok(())
    }

    /// Once every milestone has closed, distribute stakes: everyone still
    /// `Active` splits the total pool (their own stakes plus everyone who
    /// dropped) evenly.
    pub fn finalize_cohort(env: Env, cohort_id: u64) -> Result<(), CohortError> {
        let mut cohort = Self::load_cohort(&env, cohort_id)?;

        if cohort.finalized {
            return Err(CohortError::AlreadyFinalized);
        }
        if cohort.milestones_closed < cohort.milestone_count {
            return Err(CohortError::AllMilestonesNotClosed);
        }

        let finishers: Vec<Address> = cohort
            .members
            .iter()
            .filter(|m| m.status == MemberStatus::Active)
            .map(|m| m.address.clone())
            .collect();

        let total_pool = cohort.stake_amount * (cohort.members.len() as i128);
        let payout = if finishers.len() > 0 { total_pool / (finishers.len() as i128) } else { 0 };

        let token_client = token::Client::new(&env, &cohort.stake_token);
        for addr in finishers.iter() {
            token_client.transfer(&env.current_contract_address(), addr, &payout);
        }

        cohort.finalized = true;
        env.storage().persistent().set(&DataKey::Cohort(cohort_id), &cohort);

        CohortFinalized { cohort_id, payout_per_finisher: payout }.publish(&env);
        Ok(())
    }

    pub fn get_cohort(env: Env, cohort_id: u64) -> Result<Cohort, CohortError> {
        Self::load_cohort(&env, cohort_id)
    }

    fn load_cohort(env: &Env, cohort_id: u64) -> Result<Cohort, CohortError> {
        env.storage().persistent().get(&DataKey::Cohort(cohort_id)).ok_or(CohortError::CohortNotFound)
    }
}

mod test;
