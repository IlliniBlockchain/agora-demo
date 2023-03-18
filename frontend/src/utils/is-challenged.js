import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import * as anchor from "@coral-xyz/anchor";
import {AnchorProvider} from '@coral-xyz/anchor';
import { Keypair, SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import getDemoProgram from './get-demo-program';
import getAgoraProgram from './get-agora-program';
import { Buffer } from "buffer";

export default async function isChallenged(disputeId, connection, wallet) {
    const commitment = "processed";
    if (!wallet || !wallet.publicKey) throw new WalletNotConnectedError();
    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: commitment });
    
    let id_bn = new anchor.BN(disputeId);

    const demoProgram = await getDemoProgram(provider);
    const agoraProgram = await getAgoraProgram(provider);

    //get dispute acc
    //check if case is empty or not
    //check if user is a part of users arr

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

    const [disputePDA, ] = PublicKey
        .findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("dispute"),
                courtPDA.toBuffer(),
                id_bn.toArrayLike(Buffer, "be", 8),
            ],
            agoraProgram.programId
        );

    let disputeState = await agoraProgram.account.dispute.fetch(disputePDA);
    let present = false;
    let cases = [];
    for (let i = 0; i < disputeState.users.length; i++) {
        let user = disputeState.users[i];
        if (user != null) {
            if (user.toString() == provider.publicKey.toString()) {
                present = true;
            }
            const [casePDA, ] = PublicKey
                .findProgramAddressSync(
                    [
                        anchor.utils.bytes.utf8.encode("case"),
                        disputePDA.toBuffer(),
                        user.toBuffer()
                    ],
                    agoraProgram.programId
                );

            const receiver = await connection.getAccountInfo(casePDA);

            if (receiver != null) {
                if (user.toString() == provider.publicKey.toString()) {
                    throw TypeError("Already challenged.");
                } else {
                    cases.push(user);
                }
            }
        }
    }

    if (cases.length > 0 && present) {
        return true;
    }

    return false;
}
