// Return all tokens to be displayed on the home page
import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
  SystemProgram,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import getDemoProgram from "./get-demo-program";
import getAgoraProgram from "./get-agora-program";
import { Buffer } from "buffer";
import getDisputeStatus from "./get-dispute-status";

export default async function getClaims(connection, wallet) {
  const commitment = "processed";
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: commitment,
  });
  //---------

  const agoraProgram = await getAgoraProgram(provider);
  const demoProgram = await getDemoProgram(provider);

  const [protocolPDA] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("protocol")],
    demoProgram.programId
  );

  const [courtPDA] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("court"), protocolPDA.toBuffer()],
    agoraProgram.programId
  );

  const [recordPDA] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("record"),
      courtPDA.toBuffer(),
      provider.publicKey.toBuffer(),
    ],
    agoraProgram.programId
  );

  let recordAcc = await connection.getAccountInfo(recordPDA);

  if (!recordAcc) {
    let tx = new Transaction();

    tx.add(
      await agoraProgram.methods
        .initializeRecord()
        .accounts({
          record: recordPDA,
          court: courtPDA,
          courtAuthority: protocolPDA,
          payer: provider.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );

    await provider.sendAndConfirm(tx);
  }

  let recordState = await agoraProgram.account.voterRecord.fetch(recordPDA);
  let res = [];

  for (let record of recordState.claimQueue) {
    const [tickerAccPDA] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("ticker"),
        new Uint8Array([record.disputeId.toNumber()]),
      ],
      demoProgram.programId
    );

    let tickerState = await demoProgram.account.ticker.fetch(tickerAccPDA);

    const [disputePDA] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("dispute"),
        courtPDA.toBuffer(),
        record.disputeId.toArrayLike(Buffer, "be", 8),
      ],
      agoraProgram.programId
    );

    let disputeState = await agoraProgram.account.dispute.fetch(disputePDA);
    let status = "In Progress";
    let repChange = 0;
    let payChange = 0;

    if (getDisputeStatus(disputeState) === "Concluded") {
      if (disputeState.leader.user.equals(record.userVotedFor)) {
        if (disputeState.leader.user.equals(provider.publicKey)) {
          status = "Winning Party";

          payChange = disputeState.config.payCost.toNumber();
          repChange = disputeState.config.repCost.toNumber();
        } else {
          status = "Voted Majority";

          payPool =
            (disputeState.users.length - 1) *
              disputeState.config.payCost.toNumber() +
            disputeState.config.protocolPay.toNumber();
          repPool =
            (disputeState.users.length - 1) *
              disputeState.config.repCost.toNumber() +
            disputeState.config.protocolRep.toNumber() +
            disputeState.votes.toNumber() *
              disputeState.config.voterRepCost.toNumber();

          payChange = payPool / disputeState.leader.votes.toNumber();
          repChange = repPool / disputeState.leader.votes.toNumber();
        }
      } else {
        if (disputeState.users[1].equals(provider.publicKey)) {
          status = "Losing Party";

          payChange = -1 * disputeState.config.payCost.toNumber();
          repChange = -1 * disputeState.config.repCost.toNumber();
        } else {
          status = "Voted Minority";

          repChange = -1 * disputeState.config.voterRepCost.toNumber();
        }
      }
    }
    repChange /= LAMPORTS_PER_SOL;
    payChange /= LAMPORTS_PER_SOL;

    res.push({
      name: tickerState.ticker + " by " + tickerState.name,
      repChange,
      payChange,
      status,
      disputeId: record.disputeId,
      address: tickerState.address,
    });
  }

  return res;
}
