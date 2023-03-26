import idl from "../interfaces/demo_tokens.json";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export default async function getDemoProgram(provider) {
  return new Program(idl, new PublicKey(idl.metadata.address), provider);
}
