import idl from "../interfaces/agora_court.json";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export default async function getAgoraProgram(provider) {
    return new Program(idl, new PublicKey(idl.metadata.address), provider)
}