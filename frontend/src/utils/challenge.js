// Challenge a submission
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import * as anchor from '@coral-xyz/anchor';
import { Keypair, SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import {AnchorProvider} from '@coral-xyz/anchor';
import getDemoProgram from './get-demo-program';
import getAgoraProgram from './get-agora-program';
import { Buffer } from "buffer";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

export default async function challenge(disputeId, descripiton, connection, wallet) {
    const commitment = "processed";
    if (!wallet || !wallet.publicKey) throw new WalletNotConnectedError();
    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: commitment });
    anchor.setProvider(provider);
    //get dispute
    //make sure user init record
    //call interact
    //call init case

    let tx = new Transaction();

    const demoProgram = await getDemoProgram(provider);
    const agoraProgram = await getAgoraProgram(provider);

    const [repMintPDA, ] = PublicKey
        .findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("rep_mint")
            ],
            demoProgram.programId
        );

    const [protocolPDA, ] = PublicKey
        .findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("protocol")
            ],
            demoProgram.programId
        );

    const [courtPDA, ] = PublicKey
        .findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("court"),
                protocolPDA.toBuffer()
            ],
            agoraProgram.programId
        );

    console.log("gets here")

    let id_bn = new anchor.BN(disputeId);

    const [disputePDA, ] = PublicKey
        .findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("dispute"),
                courtPDA.toBuffer(),
                id_bn.toArrayLike(Buffer, "be", 8),
            ],
            agoraProgram.programId
        );

    console.log("not it")

    const [recordPDA, ] = PublicKey
        .findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("record"),
                courtPDA.toBuffer(),
                provider.publicKey.toBuffer()
            ],
            agoraProgram.programId
        );

    //init record if necessary
    let recordAcc = await connection.getAccountInfo(recordPDA);

    if (recordAcc == null) {
        tx.add(
            await agoraProgram.methods
            .initializeRecord(

            )
            .accounts({
                record: recordPDA,
                court: courtPDA,
                courtAuthority: protocolPDA,
                payer: provider.publicKey,
                systemProgram: SystemProgram.programId
            })
            .instruction()
        )
    }

    const userATA = getAssociatedTokenAddressSync(
        repMintPDA,
        provider.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    //create ata if needed
    const receiver = await connection.getAccountInfo(userATA);

    if (receiver == null) {
        tx.add(
            createAssociatedTokenAccountInstruction (
                provider.publicKey,
                userATA,
                provider.publicKey,
                repMintPDA
            )
        )
    }

    //receive tokens for stake
    tx.add(
        await demoProgram.methods
            .receiveTokens()
            .accounts({
                protocol: protocolPDA,
                repMint: repMintPDA,
                payer: provider.publicKey,
                tokenAcc: userATA,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId
            })
            .instruction()
    )

    const repVaultATA = getAssociatedTokenAddressSync(
        repMintPDA,
        disputePDA,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    )

    console.log("here too?")

    //interact here, then challenge
    tx.add(
        await agoraProgram.methods
            .interact(
                id_bn
            )
            .accounts({
                dispute: disputePDA,
                repVault: repVaultATA,
                payVault: agoraProgram.programId, //None
                record: recordPDA,
                court: courtPDA,
                courtAuthority: protocolPDA,
                user: provider.publicKey, //signer
                userPayAta: agoraProgram.programId, //None
                userRepAta: userATA,
                repMint: repMintPDA,
                payMint: agoraProgram.programId, //None
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
            })
            .instruction()
    );

    const [casePDA, ] = PublicKey
        .findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("case"),
                disputePDA.toBuffer(),
                provider.publicKey.toBuffer()
            ],
            agoraProgram.programId
        );

    //finally init case
    tx.add(
        await agoraProgram.methods
            .initializeCase(
                id_bn,
                descripiton
            )
            .accounts({
                case: casePDA,
                voterRecord: recordPDA,
                dispute: disputePDA,
                court: courtPDA,
                courtAuthority: protocolPDA,
                payer: provider.publicKey,
                systemProgram: SystemProgram.programId
            })
            .instruction()
    )

    console.log("ok, its tx")

    await provider.sendAndConfirm(tx);
}
  