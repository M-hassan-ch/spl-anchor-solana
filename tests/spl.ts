import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Spl } from "../target/types/spl";
import * as splToken from "@solana/spl-token";

async function airDrop(program: Program<Spl>, signer: anchor.web3.Keypair) {
  const tx = await program.methods.initialize().rpc();
  console.log("Your airdrop transaction signature", tx);
}

describe("spl", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

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
  const tokenAccountPDA = splToken.getAssociatedTokenAddressSync(mintPDA, vaultPDA, true);

  it("Is initialized!", async () => {
    const tx = await program.methods.initialize()
    .accounts({})
    .rpc({commitment:"confirmed"});
    console.log("Your transaction signature", tx);
  });
});
