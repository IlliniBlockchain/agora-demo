import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import {
  Keypair,
  SystemProgram,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import getDemoProgram from "./get-demo-program";
import getAgoraProgram from "./get-agora-program";
import { Buffer } from "buffer";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Vote to either Approve (optionNo=0) or Deny (optionNo=1)
export default async function vote(optionNo, disputeId, connection, wallet) {
  const commitment = "processed";
  if (!wallet || !wallet.publicKey) throw new WalletNotConnectedError();
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: commitment,
  });
  anchor.setProvider(provider);

  let id_bn = new anchor.BN(disputeId);

  const demoProgram = await getDemoProgram(provider);
  const agoraProgram = await getAgoraProgram(provider);

  let tx = new Transaction();

  const [repMintPDA] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("rep_mint")],
    demoProgram.programId
  );

  const [protocolPDA] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("protocol")],
    demoProgram.programId
  );

  const [courtPDA] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("court"), protocolPDA.toBuffer()],
    agoraProgram.programId
  );

  const [disputePDA] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("dispute"),
      courtPDA.toBuffer(),
      id_bn.toArrayLike(Buffer, "be", 8),
    ],
    agoraProgram.programId
  );

  //get user
  let disputeState = await agoraProgram.account.dispute.fetch(disputePDA);

  let candidate = disputeState.users[optionNo];

  if (candidate == null) {
    throw TypeError("Vote error. User never interacted.");
  }

  //get all PDAs - then call vote
  const [recordPDA] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("record"),
      courtPDA.toBuffer(),
      provider.publicKey.toBuffer(),
    ],
    agoraProgram.programId
  );

  //record check
  let recordAcc = await connection.getAccountInfo(recordPDA);

  if (recordAcc == null) {
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
  }

  const [casePDA] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("case"),
      disputePDA.toBuffer(),
      candidate.toBuffer(),
    ],
    agoraProgram.programId
  );

  //also fetch ATAs
  const repVault = getAssociatedTokenAddressSync(
    repMintPDA,
    disputePDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const userRepATA = getAssociatedTokenAddressSync(
    repMintPDA,
    provider.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const receiver = await connection.getAccountInfo(userRepATA);

  if (receiver == null) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        provider.publicKey,
        userRepATA,
        provider.publicKey,
        repMintPDA,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  tx.add(
    await demoProgram.methods
      .tokenVote(candidate, id_bn)
      .accounts({
        protocol: protocolPDA,
        repMint: repMintPDA,
        casePda: casePDA,
        recordPda: recordPDA,
        courtPda: courtPDA,
        disputePda: disputePDA,
        repVault: repVault,
        payer: provider.publicKey,
        userRepAta: userRepATA,
        agoraProgram: agoraProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction()
  );

  await provider.sendAndConfirm(tx);
}
