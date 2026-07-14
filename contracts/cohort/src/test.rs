#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Env, String as SorobanString};

fn create_token<'a>(env: &Env, admin: &Address) -> (Address, token::StellarAssetClient<'a>, token::Client<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let address = sac.address();
    let admin_client = token::StellarAssetClient::new(env, &address);
    let client = token::Client::new(env, &address);
    (address, admin_client, client)
}

mod attendance_test_shim {
    pub use attendance_log::{AttendanceLogContract, AttendanceLogContractClient};
}

fn setup_cohort(
    env: &Env,
    milestone_count: u32,
    max_misses: u32,
) -> (StudyCohortContractClient<'static>, u64, token::Client<'static>, Address, Address) {
    env.mock_all_auths();
    let contract_id = env.register(StudyCohortContract, ());
    let client = StudyCohortContractClient::new(env, &contract_id);

    let organizer = Address::generate(env);
    let token_admin = Address::generate(env);
    let (token_addr, _admin_client, token_client) = create_token(env, &token_admin);

    let attendance_id = env.register(attendance_test_shim::AttendanceLogContract, ());
    attendance_test_shim::AttendanceLogContractClient::new(env, &attendance_id).initialize(&contract_id);

    let cohort_id = client.create_cohort(
        &organizer,
        &SorobanString::from_str(env, "Rust Study Group"),
        &token_addr,
        &100i128,
        &attendance_id,
        &milestone_count,
        &max_misses,
    );

    (client, cohort_id, token_client, token_admin, attendance_id)
}

#[test]
fn test_create_cohort_stores_correct_state() {
    let env = Env::default();
    let (client, cohort_id, _token_client, _admin, _attendance) = setup_cohort(&env, 3, 1);
    let cohort = client.get_cohort(&cohort_id);
    assert_eq!(cohort.milestone_count, 3u32);
    assert_eq!(cohort.members.len(), 0);
}

#[test]
fn test_join_cohort_pulls_stake() {
    let env = Env::default();
    let (client, cohort_id, token_client, token_admin, _attendance) = setup_cohort(&env, 3, 1);
    let member = Address::generate(&env);
    token::StellarAssetClient::new(&env, &token_client.address).mint(&member, &1_000i128);
    let _ = token_admin;

    client.join_cohort(&cohort_id, &member);
    assert_eq!(token_client.balance(&client.address), 100i128);

    let cohort = client.get_cohort(&cohort_id);
    assert_eq!(cohort.members.len(), 1);
}

#[test]
fn test_double_join_rejected() {
    let env = Env::default();
    let (client, cohort_id, token_client, _admin, _attendance) = setup_cohort(&env, 3, 1);
    let member = Address::generate(&env);
    token::StellarAssetClient::new(&env, &token_client.address).mint(&member, &1_000i128);

    client.join_cohort(&cohort_id, &member);
    let result = client.try_join_cohort(&cohort_id, &member);
    assert!(result.is_err());
}

#[test]
fn test_close_milestone_checks_attendance_via_cross_contract_call() {
    let env = Env::default();
    let (client, cohort_id, token_client, _admin, attendance_id) = setup_cohort(&env, 2, 0);
    let member = Address::generate(&env);
    token::StellarAssetClient::new(&env, &token_client.address).mint(&member, &1_000i128);
    client.join_cohort(&cohort_id, &member);

    let attendance_client = attendance_test_shim::AttendanceLogContractClient::new(&env, &attendance_id);
    attendance_client.check_in(&cohort_id, &0u32, &member);

    client.close_milestone(&cohort_id, &0u32);

    let cohort = client.get_cohort(&cohort_id);
    let m = cohort.members.get(0).unwrap();
    assert_eq!(m.misses, 0u32);
    assert_eq!(m.status, MemberStatus::Active);
}

#[test]
fn test_member_dropped_after_exceeding_max_misses() {
    let env = Env::default();
    let (client, cohort_id, token_client, _admin, _attendance) = setup_cohort(&env, 2, 0);
    let member = Address::generate(&env);
    token::StellarAssetClient::new(&env, &token_client.address).mint(&member, &1_000i128);
    client.join_cohort(&cohort_id, &member);

    // member never checks in; max_misses = 0, so one miss drops them
    client.close_milestone(&cohort_id, &0u32);

    let cohort = client.get_cohort(&cohort_id);
    let m = cohort.members.get(0).unwrap();
    assert_eq!(m.status, MemberStatus::Dropped);
}

#[test]
fn test_finalize_splits_pool_among_finishers() {
    let env = Env::default();
    let (client, cohort_id, token_client, _admin, attendance_id) = setup_cohort(&env, 1, 0);
    let finisher = Address::generate(&env);
    let dropout = Address::generate(&env);
    token::StellarAssetClient::new(&env, &token_client.address).mint(&finisher, &1_000i128);
    token::StellarAssetClient::new(&env, &token_client.address).mint(&dropout, &1_000i128);
    client.join_cohort(&cohort_id, &finisher);
    client.join_cohort(&cohort_id, &dropout);

    let attendance_client = attendance_test_shim::AttendanceLogContractClient::new(&env, &attendance_id);
    attendance_client.check_in(&cohort_id, &0u32, &finisher);
    // dropout never checks in

    client.close_milestone(&cohort_id, &0u32);
    client.finalize_cohort(&cohort_id);

    // Pool = 200 (2 members * 100 stake). Only 1 finisher -> gets all 200.
    assert_eq!(token_client.balance(&finisher), 1100i128); // 1000 - 100 stake + 200 payout
}

#[test]
fn test_cohort_not_found_errors() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(StudyCohortContract, ());
    let client = StudyCohortContractClient::new(&env, &contract_id);
    let result = client.try_get_cohort(&999u64);
    assert!(result.is_err());
}
