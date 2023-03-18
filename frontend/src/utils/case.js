// Challenge a submission
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import * as anchor from '@coral-xyz/anchor';
import { Keypair, SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import {AnchorProvider} from '@coral-xyz/anchor';
import getDemoProgram from './get-demo-program';
import getAgoraProgram from './get-agora-program';
import { Buffer } from "buffer";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

export default async function initCase(disputeId, descripiton, connection, wallet) {
    const commitment = "processed";
    if (!wallet || !wallet.publicKey) throw new WalletNotConnectedError();
    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: commitment });
    anchor.setProvider(provider);

    const demoProgram = await getDemoProgram(provider);
    const agoraProgram = await getAgoraProgram(provider);

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

    const [recordPDA, ] = PublicKey
        .findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("record"),
                courtPDA.toBuffer(),
                provider.publicKey.toBuffer()
            ],
            agoraProgram.programId
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
        .rpc();
}
  