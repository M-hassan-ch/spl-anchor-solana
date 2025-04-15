use anchor_lang::prelude::*;

declare_id!("HwV15MoQC8MdpeLpp9seYtTFBVTF19zYJCnSMQc9b5au");

#[program]
pub mod spl {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
