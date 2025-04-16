use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

declare_id!("HwV15MoQC8MdpeLpp9seYtTFBVTF19zYJCnSMQc9b5au");

#[program]
pub mod spl {
    use anchor_spl::token::{mint_to, MintTo};

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Initializing mint....");
        msg!("Token program: {:?}", ctx.accounts.token_program.key());
        msg!("Associated token program: {:?}", ctx.accounts.associated_token_program.key());

        let signer_key = &ctx.accounts.signer.key();
        let signer_keys: &[&[&[u8]]] = &[&[b"vault", signer_key.as_ref(), &[ctx.bumps.vault]]];
        let vault = &mut ctx.accounts.vault;
        vault.creator = ctx.accounts.signer.key();
        vault.bump = ctx.bumps.vault;

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                authority: vault.to_account_info(),
                mint: ctx.accounts.new_mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
            },
            signer_keys,
        );

        let _ = mint_to(cpi_context, 1_000)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", signer.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = signer,
        seeds = [b"mint", signer.key().as_ref()],
        mint::decimals = 0,
        mint::authority = vault,
        bump
    )]
    pub new_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = signer,
        associated_token::mint = new_mint,
        associated_token::authority = vault,
    )]
    pub token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub creator: Pubkey,
    pub bump: u8,
}
