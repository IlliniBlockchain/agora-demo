import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  createSyncNativeInstruction
} from "@solana/spl-token";
import { AnchorProvider } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import getDemoProgram from "./get-demo-program";
import getAgoraProgram from "./get-agora-program";
import { Buffer } from "buffer";

// Create a new token submission
export default async function createSubmission(
  name,
  address,
  ticker,
  description,
  imageURL,
  connection,
  wallet
) {
  const commitment = "processed";

  if (!wallet || !wallet.publicKey) throw new WalletNotConnectedError();

  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: commitment,
  });
  anchor.setProvider(provider);

  let tx = new Transaction();

  const demoProgram = await getDemoProgram(provider);
  const agoraProgram = await getAgoraProgram(provider);

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

  let protState = await demoProgram.account.protocol.fetch(protocolPDA);
  let courtState = await agoraProgram.account.court.fetch(courtPDA);

  const [tickerAccPDA] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("ticker"),
      new Uint8Array([protState.numTickers]),
    ],
    demoProgram.programId
  );

  const [disputePDA] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("dispute"),
      courtPDA.toBuffer(),
      courtState.numDisputes.toArrayLike(Buffer, "be", 8),
    ],
    agoraProgram.programId
  );

  const repVault = getAssociatedTokenAddressSync(
    repMintPDA,
    disputePDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  let receiver = await connection.getAccountInfo(repVault);

  if (!receiver) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        provider.publicKey,
        repVault,
        disputePDA,
        repMintPDA,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  const payVault = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    disputePDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  receiver = await connection.getAccountInfo(payVault);

  if (!receiver) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        provider.publicKey,
        payVault,
        disputePDA,
        NATIVE_MINT,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  //converting SOL to wSOL
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

  tx.add(
    SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: userPayAcc,
      lamports: 2 * LAMPORTS_PER_SOL,
    }),
    createSyncNativeInstruction(userPayAcc)
  );

  //needs to have 100 tokens at least
  const protocolRepATA = getAssociatedTokenAddressSync(
    repMintPDA,
    protocolPDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  receiver = await connection.getAccountInfo(protocolRepATA);

  if (!receiver) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        provider.publicKey,
        protocolRepATA,
        protocolPDA,
        repMintPDA,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  const [recordPDA] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("record"),
      courtPDA.toBuffer(),
      provider.publicKey.toBuffer(),
    ],
    agoraProgram.programId
  );

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

  tx.add(
    await demoProgram.methods
      .submitToken(address, imageURL, name, ticker, description, ["Verified"])
      .accounts({
        protocol: protocolPDA,
        protocolRepAta: protocolRepATA,
        repMint: repMintPDA,
        payMint: NATIVE_MINT,
        tickerAcc: tickerAccPDA,
        courtPda: courtPDA,
        disputePda: disputePDA,
        repVault: repVault,
        payVault: payVault,
        payer: provider.publicKey,
        recordPda: recordPDA,
        userPayAta: userPayAcc,
        agoraProgram: agoraProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction()
  );

  await provider.sendAndConfirm(tx);
}
