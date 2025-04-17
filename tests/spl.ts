import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Spl } from "../target/types/spl";
import * as splToken from "@solana/spl-token";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

async function airdrop(connection: anchor.web3.Connection, payer: anchor.web3.Keypair, amount: number) {
  const signature = await connection.requestAirdrop(
    payer.publicKey,
    amount * LAMPORTS_PER_SOL
  );
  let latestBlockhash = await connection.getLatestBlockhash();
  return await connection.confirmTransaction({
    signature: signature,
    ...latestBlockhash
  });
}

/**
 * Utility function to deserialize data of a given associated token account address
 * @param connection The Solana connection
 * @param tokenAccountAddress The address of the token account to deserialize
 * @returns The deserialized token account data
 */
async function getTokenAccountData(
  connection: anchor.web3.Connection,
  tokenAccountAddress: anchor.web3.PublicKey
): Promise<splToken.Account> {
  const tokenAccountInfo = await connection.getAccountInfo(tokenAccountAddress);

  if (!tokenAccountInfo) {
    throw new Error(`Token account ${tokenAccountAddress.toString()} not found`);
  }

  return splToken.unpackAccount(tokenAccountAddress, tokenAccountInfo);
}


describe("spl", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Spl as Program<Spl>;

  const signer = program.provider.publicKey;

  const [mintPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), signer.toBuffer()],
    program.programId
  );
  const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), signer.toBuffer()],
    program.programId
  );

  function getProgramWithProvider(provider: anchor.AnchorProvider): anchor.Program {
    return new anchor.Program(program.idl as anchor.Idl, provider);
  }

  it("Is initialized!", async () => {
    const tx = await program.methods.initialize()
      .accounts({})
      .rpc({ commitment: "confirmed" });
    console.log("Your transaction signature", tx);
  });

  it("Transfer tokens", async () => {
    const signer2 = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, signer2, 100);
    const _provider = new anchor.AnchorProvider(
      provider.connection,
      new anchor.Wallet(signer2),
      {}
    );
    const _program = getProgramWithProvider(_provider);

    const signer2_ata_address = await splToken.getAssociatedTokenAddress(mintPDA, signer2.publicKey, true);
    const signer1_ata_address = splToken.getAssociatedTokenAddressSync(mintPDA, vaultPDA, true);

    await splToken.createAssociatedTokenAccount(_provider.connection, signer2, mintPDA, signer2.publicKey, { commitment: 'confirmed' })

    console.log("Sender ATA Before: ", ((await getTokenAccountData(_provider.connection, signer1_ata_address)).amount));
    console.log("Received ATA Before: ", ((await getTokenAccountData(_provider.connection, signer2_ata_address)).amount));

    const tx = await _program.methods.transferTokens(new BN(10))
      .accounts({
        signer: signer2,
        vault: vaultPDA,
      })
      .signers([signer2])
      .rpc({ commitment: "confirmed" });

    console.log("Your transaction signature", tx);
    console.log("Sender ATA After: ", ((await getTokenAccountData(_provider.connection, signer1_ata_address)).amount));
    console.log("Received ATA After: ", ((await getTokenAccountData(_provider.connection, signer2_ata_address)).amount));
  });
});
