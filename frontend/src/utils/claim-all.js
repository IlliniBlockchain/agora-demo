import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider } from "@coral-xyz/anchor";
import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import getDemoProgram from "./get-demo-program";
import getAgoraProgram from "./get-agora-program";
import { Buffer } from "buffer";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT
} from "@solana/spl-token";

// Close (if necessary) and claim all expired disputes
export default async function claimAll(claims, connection, wallet) {
  const commitment = "processed";
  if (!wallet || !wallet.publicKey) throw new WalletNotConnectedError();
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: commitment,
  });
  anchor.setProvider(provider);

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

  const [recordPDA] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("record"),
      courtPDA.toBuffer(),
      provider.publicKey.toBuffer(),
    ],
    agoraProgram.programId
  );

  //record check
  const recordAcc = await connection.getAccountInfo(recordPDA);

  if (!recordAcc) {
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

  const userRepATA = getAssociatedTokenAddressSync(
    repMintPDA,
    provider.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  let receiver = await connection.getAccountInfo(userRepATA);

  if (!receiver) {
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

  const userPayAcc = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    provider.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  receiver = await connection.getAccountInfo(userPayAcc);

  if (!receiver) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        provider.publicKey,
        userPayAcc,
        provider.publicKey,
        NATIVE_MINT,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  for (let claim of claims) {
    if (claim.status === "In Progress") break;

    const [disputePDA] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("dispute"),
        courtPDA.toBuffer(),
        claim.disputeId.toArrayLike(Buffer, "be", 8),
      ],
      agoraProgram.programId
    );

    const payVault = getAssociatedTokenAddressSync(
      NATIVE_MINT,
      disputePDA,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    const repVault = getAssociatedTokenAddressSync(
      repMintPDA,
      disputePDA,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    let disputeState = await agoraProgram.account.dispute.fetch(disputePDA);

    if (!disputeState.status.concluded) {
      tx.add(
        await agoraProgram.methods
          .closeDispute(claim.disputeId)
          .accounts({
            dispute: disputePDA,
            court: courtPDA,
            payer: provider.publicKey,
          })
          .instruction()
      );
    }

    tx.add(
      await agoraProgram.methods
        .claim(claim.disputeId)
        .accounts({
          voterRecord: recordPDA,
          dispute: disputePDA,
          repVault,
          payVault,
          court: courtPDA,
          courtAuthority: protocolPDA,
          user: provider.publicKey,
          userPayAta: userPayAcc,
          userRepAta: userRepATA,
          repMint: repMintPDA,
          payMint: NATIVE_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction()
    );
  }

  await provider.sendAndConfirm(tx);
}
