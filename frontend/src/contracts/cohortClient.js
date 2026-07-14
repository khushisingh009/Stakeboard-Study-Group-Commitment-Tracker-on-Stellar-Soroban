import { Contract, rpc, TransactionBuilder, BASE_FEE, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
import { NETWORK, CONTRACTS } from './config';

const server = new rpc.Server(NETWORK.rpcUrl);

class BaseClient {
  constructor(contractId) {
    this.contract = new Contract(contractId);
  }

  async _buildAndSimulate(method, args, sourceAddress) {
    const account = await server.getAccount(sourceAddress);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK.networkPassphrase })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(60)
      .build();
    const simulated = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulated)) throw new Error(`Simulation failed: ${simulated.error}`);
    return { tx, simulated };
  }

  async view(method, args = [], sourceAddress) {
    const { simulated } = await this._buildAndSimulate(method, args, sourceAddress);
    return simulated.result?.retval ? scValToNative(simulated.result.retval) : null;
  }

  async invoke(method, args, sourceAddress, signTransaction) {
    const { tx, simulated } = await this._buildAndSimulate(method, args, sourceAddress);
    const prepared = rpc.assembleTransaction(tx, simulated).build();
    const signedXdr = await signTransaction(prepared.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK.networkPassphrase);
    const sendResponse = await server.sendTransaction(signedTx);
    if (sendResponse.status === 'ERROR') throw new Error(`Transaction submission failed: ${JSON.stringify(sendResponse.errorResult)}`);
    return this._pollTransaction(sendResponse.hash);
  }

  async _pollTransaction(hash, attempts = 15) {
    for (let i = 0; i < attempts; i++) {
      const result = await server.getTransaction(hash);
      if (result.status === 'SUCCESS') return { hash, status: 'SUCCESS', result };
      if (result.status === 'FAILED') throw new Error(`Transaction failed: ${hash}`);
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error(`Transaction ${hash} did not confirm in time`);
  }
}

export class CohortClient extends BaseClient {
  constructor(contractId = CONTRACTS.COHORT_CONTRACT_ID) {
    super(contractId);
  }

  createCohort(organizer, title, stakeToken, stakeAmount, attendanceLog, milestoneCount, maxMisses, signTransaction) {
    const args = [
      nativeToScVal(organizer, { type: 'address' }),
      nativeToScVal(title, { type: 'string' }),
      nativeToScVal(stakeToken, { type: 'address' }),
      nativeToScVal(BigInt(stakeAmount), { type: 'i128' }),
      nativeToScVal(attendanceLog, { type: 'address' }),
      nativeToScVal(milestoneCount, { type: 'u32' }),
      nativeToScVal(maxMisses, { type: 'u32' }),
    ];
    return this.invoke('create_cohort', args, organizer, signTransaction);
  }

  joinCohort(cohortId, member, signTransaction) {
    const args = [nativeToScVal(BigInt(cohortId), { type: 'u64' }), nativeToScVal(member, { type: 'address' })];
    return this.invoke('join_cohort', args, member, signTransaction);
  }

  closeMilestone(cohortId, milestoneIndex, caller, signTransaction) {
    const args = [nativeToScVal(BigInt(cohortId), { type: 'u64' }), nativeToScVal(milestoneIndex, { type: 'u32' })];
    return this.invoke('close_milestone', args, caller, signTransaction);
  }

  finalizeCohort(cohortId, caller, signTransaction) {
    const args = [nativeToScVal(BigInt(cohortId), { type: 'u64' })];
    return this.invoke('finalize_cohort', args, caller, signTransaction);
  }

  getCohort(cohortId, sourceAddress) {
    return this.view('get_cohort', [nativeToScVal(BigInt(cohortId), { type: 'u64' })], sourceAddress);
  }
}

export class AttendanceClient extends BaseClient {
  constructor(contractId = CONTRACTS.ATTENDANCE_CONTRACT_ID) {
    super(contractId);
  }

  checkIn(cohortId, milestoneIndex, member, signTransaction) {
    const args = [
      nativeToScVal(BigInt(cohortId), { type: 'u64' }),
      nativeToScVal(milestoneIndex, { type: 'u32' }),
      nativeToScVal(member, { type: 'address' }),
    ];
    return this.invoke('check_in', args, member, signTransaction);
  }

  attendanceCount(cohortId, milestoneIndex, sourceAddress) {
    return this.view(
      'attendance_count',
      [nativeToScVal(BigInt(cohortId), { type: 'u64' }), nativeToScVal(milestoneIndex, { type: 'u32' })],
      sourceAddress
    );
  }
}

export const cohortClient = new CohortClient();
export const attendanceClient = new AttendanceClient();
