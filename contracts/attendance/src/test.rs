#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn setup() -> (Env, AttendanceLogContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(AttendanceLogContract, ());
    let client = AttendanceLogContractClient::new(&env, &contract_id);
    let cohort = Address::generate(&env);
    client.initialize(&cohort);
    (env, client, cohort)
}

#[test]
fn test_check_in_records_attendee() {
    let (env, client, _cohort) = setup();
    let member = Address::generate(&env);
    let count = client.check_in(&1u64, &0u32, &member);
    assert_eq!(count, 1u32);
    assert!(client.did_attend(&1u64, &0u32, &member));
}

#[test]
fn test_double_check_in_rejected() {
    let (env, client, _cohort) = setup();
    let member = Address::generate(&env);
    client.check_in(&1u64, &0u32, &member);
    let result = client.try_check_in(&1u64, &0u32, &member);
    assert!(result.is_err());
}

#[test]
fn test_multiple_members_accumulate() {
    let (env, client, _cohort) = setup();
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let c = Address::generate(&env);
    client.check_in(&2u64, &1u32, &a);
    client.check_in(&2u64, &1u32, &b);
    client.check_in(&2u64, &1u32, &c);
    assert_eq!(client.attendance_count(&2u64, &1u32), 3u32);
}

#[test]
fn test_did_attend_false_for_absent_member() {
    let (env, client, _cohort) = setup();
    let attendee = Address::generate(&env);
    let absent = Address::generate(&env);
    client.check_in(&1u64, &0u32, &attendee);
    assert!(!client.did_attend(&1u64, &0u32, &absent));
}

#[test]
fn test_attendance_isolated_per_milestone() {
    let (env, client, _cohort) = setup();
    let member = Address::generate(&env);
    client.check_in(&1u64, &0u32, &member);
    assert_eq!(client.attendance_count(&1u64, &1u32), 0u32);
}

#[test]
fn test_already_initialized_rejected() {
    let (env, client, _cohort) = setup();
    let other = Address::generate(&env);
    let result = client.try_initialize(&other);
    assert!(result.is_err());
}
