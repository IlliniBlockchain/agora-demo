import { AnchorProvider } from "@coral-xyz/anchor";
import getAgoraProgram from "./get-agora-program";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import getDemoProgram from "./get-demo-program";
import { Buffer } from "buffer";
import getDisputeStatus from "./get-dispute-status";

// Return a specific tokens details
export default async function getToken(id, connection, wallet) {
  const commitment = "processed";
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: commitment,
  });

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

  const [tickerAccPDA] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("ticker"), new Uint8Array([id])],
    demoProgram.programId
  );

  let id_bn = new anchor.BN(id);

  const [disputePDA] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("dispute"),
      courtPDA.toBuffer(),
      id_bn.toArrayLike(Buffer, "be", 8),
    ],
    agoraProgram.programId
  );

  let disputeState = await agoraProgram.account.dispute.fetch(disputePDA);
  let tickerState = await demoProgram.account.ticker.fetch(tickerAccPDA);

  //get cases
  let cases = [];
  const TITLE = ['Submitter Evidence', 'Challenger Evidence']
  for (let i = 0; i < disputeState.users.length; i++) {
    let user = disputeState.users[i];
    if (user) {
      const [casePDA] = PublicKey.findProgramAddressSync(
        [
          anchor.utils.bytes.utf8.encode("case"),
          disputePDA.toBuffer(),
          user.toBuffer(),
        ],
        agoraProgram.programId
      );

      const receiver = await connection.getAccountInfo(casePDA);

      if (receiver) {
        let caseState = await agoraProgram.account.case.fetch(casePDA);

        cases.push({
          title: TITLE[i],
          pk: user.toString(),
          evidence: caseState.evidence,
        });
      }
    }
  }

  let solPool =
    disputeState.users.length * disputeState.config.payCost.toNumber() +
    disputeState.config.protocolPay.toNumber();
  let repPool =
    disputeState.users.length * disputeState.config.repCost.toNumber() +
    disputeState.config.protocolRep.toNumber() +
    disputeState.votes.toNumber() * disputeState.config.voterRepCost.toNumber();

  solPool /= LAMPORTS_PER_SOL;
  repPool /= LAMPORTS_PER_SOL;

  let dt = "";
  let challengeEndTime = disputeState.config.endsAt.toNumber();

  // choose the corrent deadline (three different deadlines for grace, waiting, and voting periods)
  if (disputeState.status.grace) {
    challengeEndTime = disputeState.config.graceEndsAt.toNumber();
  } else if (disputeState.status.waiting) {
    challengeEndTime = disputeState.config.initCasesEndsAt.toNumber();
  }

  let dateNow = Math.floor(Date.now() / 1000);

  if (challengeEndTime < dateNow) {
    dt = "Expired";
  } else {
    dt = new Date(challengeEndTime * 1000).toLocaleString();
  }

  let status = getDisputeStatus(disputeState);

  if (status === "Concluded") {
    if (disputeState.leader.user.equals(disputeState.users[0])) {
      cases.unshift({
        title: "Verification Successful",
        pk: "Final Court Verdict",
        evidence: "The jury majority has sided with the submitter. This token was approved and added to the Agora Token list.",
      });
    } else {
      cases.unshift({
        title: "Verification Failed",
        pk: "Final Court Verdict",
        evidence: "The jury majority has sided with the challenger. This token was denied and rejected from the Agora Token list.",
      });
    }
  }

  return {
    disputeId: id,
    image: tickerState.image,
    name: tickerState.name,
    ticker: tickerState.ticker,
    description: tickerState.description,
    agora_reward: repPool.toString(),
    sol_reward: solPool.toString(),
    rep_required: disputeState.config.voterRepRequired.toNumber().toString(),
    rep_risked: disputeState.config.voterRepCost.toNumber().toString(),
    status: status, // "Voting"
    end_time: dt,
    requester: disputeState.users[0].toString(),
    cases: cases,
    address: tickerState.address,
  };
}
