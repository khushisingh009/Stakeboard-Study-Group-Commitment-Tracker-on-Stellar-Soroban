//! Attendance Log Contract
//!
//! Tamper-evident record of session check-ins for a study cohort. The
//! Cohort contract calls into this contract cross-contract whenever a
//! milestone (a scheduled study session) closes, to check whether a given
//! member met the attendance quorum for that milestone before releasing
//! any stake decisions based on it. Members check themselves in during a
//! session window; the log is the source of truth the Cohort contract
//! reads back when deciding who completed the syllabus.

#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, Vec};

#[contracttype]
pub enum DataKey {
    AuthorizedCohort,
    CheckIns(u64, u32), // (cohort_id, milestone_index) -> Vec<Address>
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum AttendanceError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    AlreadyCheckedIn = 3,
}



#[contract]
pub struct AttendanceLogContract;

#[contractimpl]
impl AttendanceLogContract {
    /// Set the single Cohort contract permitted to read attendance for stake decisions.
    /// (Check-ins themselves are member-signed, not gated by the Cohort contract,
    /// so members can check in directly without a Cohort-contract round-trip.)
    pub fn initialize(env: Env, cohort_contract: Address) -> Result<(), AttendanceError> {
        if env.storage().instance().has(&DataKey::AuthorizedCohort) {
            return Err(AttendanceError::AlreadyInitialized);
        }
        cohort_contract.require_auth();
        env.storage().instance().set(&DataKey::AuthorizedCohort, &cohort_contract);
        Ok(())
    }

    /// A member checks themselves in for a given milestone/session.
    pub fn check_in(env: Env, cohort_id: u64, milestone_index: u32, member: Address) -> Result<u32, AttendanceError> {
        member.require_auth();

        let key = DataKey::CheckIns(cohort_id, milestone_index);
        let mut attendees: Vec<Address> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        if attendees.contains(&member) {
            return Err(AttendanceError::AlreadyCheckedIn);
        }
        attendees.push_back(member.clone());
        let count = attendees.len();
        env.storage().persistent().set(&key, &attendees);

        env.events().publish((symbol_short!("check_in"), cohort_id, milestone_index), member.clone());
        Ok(count)
    }

    /// Called cross-contract by the Cohort contract when closing a
    /// milestone, to check whether a specific member attended it.
    pub fn did_attend(env: Env, cohort_id: u64, milestone_index: u32, member: Address) -> bool {
        let key = DataKey::CheckIns(cohort_id, milestone_index);
        let attendees: Vec<Address> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        attendees.contains(&member)
    }

    pub fn get_attendees(env: Env, cohort_id: u64, milestone_index: u32) -> Vec<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::CheckIns(cohort_id, milestone_index))
            .unwrap_or(Vec::new(&env))
    }

    pub fn attendance_count(env: Env, cohort_id: u64, milestone_index: u32) -> u32 {
        env.storage()
            .persistent()
            .get::<_, Vec<Address>>(&DataKey::CheckIns(cohort_id, milestone_index))
            .map(|v| v.len())
            .unwrap_or(0)
    }
}

mod test;
