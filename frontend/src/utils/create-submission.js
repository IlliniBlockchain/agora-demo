// Create a new submission (and dispute) after clicking "Submit for review"
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { Keypair, SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {AnchorProvider} from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import getDemoProgram from './get-demo-program';
import getAgoraProgram from './get-agora-program';
import { Buffer } from "buffer";

export default async function createSubmission(name, address, ticker, description, imageURL, connection, wallet) {
    //all functions
    const commitment = "processed";

    if (!wallet || !wallet.publicKey) throw new WalletNotConnectedError();

    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: commitment });
    anchor.setProvider(provider);
    //---------

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

    let protState = await demoProgram.account.protocol.fetch(protocolPDA);
    let courtState = await agoraProgram.account.court.fetch(courtPDA);

    const [tickerAccPDA, ] = PublicKey
        .findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("ticker"),
                new Uint8Array([protState.numTickers])
            ],
            demoProgram.programId
        );

    const [disputePDA, ] = PublicKey
        .findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("dispute"),
                courtPDA.toBuffer(),
                courtState.numDisputes.toArrayLike(Buffer, "be", 8)
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

    //needs to have 100 tokens at least
    const protocolRepATA = getAssociatedTokenAddressSync(
        repMintPDA,
        protocolPDA,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    let receiver = await connection.getAccountInfo(protocolRepATA);

    if (receiver == null) {
        tx.add(
            createAssociatedTokenAccountInstruction (
                provider.publicKey,
                protocolRepATA,
                protocolPDA,
                repMintPDA
            )
        )
    }

    console.log("minting")

    //mint to token account
    tx.add(
        await demoProgram.methods
            .receiveTokens()
            .accounts({
                protocol: protocolPDA,
                repMint: repMintPDA,
                payer: provider.publicKey,
                tokenAcc: protocolRepATA,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId
            })
            .instruction()
    );

    console.log("passes that")

    tx.add(
        await demoProgram.methods
            .submitToken(
                address,
                imageURL,
                name,
                ticker,
                description,
                ["Token", "Demo"]
            )
            .accounts({
                protocol: protocolPDA,
                repMint: repMintPDA,
                tickerAcc: tickerAccPDA,
                courtPda: courtPDA,
                disputePda: disputePDA,
                repVault: repVault,
                protocolRepAta: protocolRepATA,
                payer: provider.publicKey,
                agoraProgram: agoraProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId
            })
            .instruction()
    );

    const [recordPDA, ] = PublicKey
        .findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("record"),
                courtPDA.toBuffer(),
                provider.publicKey.toBuffer()
            ],
            agoraProgram.programId
        );

    let recordAcc = await connection.getAccountInfo(recordPDA);

    const userATA = getAssociatedTokenAddressSync(
        repMintPDA,
        provider.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    receiver = await connection.getAccountInfo(userATA);

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

    //also init record & interact here
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

    //interact
    tx.add(
        await agoraProgram.methods
            .interact(
                courtState.numDisputes
            )
            .accounts({
                dispute: disputePDA,
                repVault: repVault,
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
    )

    await provider.sendAndConfirm(tx);
}