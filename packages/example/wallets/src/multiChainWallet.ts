import { Wallet } from '@solana/wallet-standard';
import { CHAIN_ETHEREUM, CHAIN_SOLANA_MAINNET } from '@solana/wallet-standard-util';
import { AbstractWallet } from './abstractWallet';
import { EthereumWalletAccount, SignerEthereumWalletAccount } from './ethereumWallet';
import { LedgerSolanaWalletAccount, SignerSolanaWalletAccount, SolanaWalletAccount } from './solanaWallet';

export type MultiChainWalletAccount = SolanaWalletAccount | EthereumWalletAccount;

export class MultiChainWallet
    extends AbstractWallet<MultiChainWalletAccount>
    implements Wallet<MultiChainWalletAccount>
{
    #name = 'MultiChain Wallet';
    #icon = '';

    get name(): string {
        return this.#name;
    }

    get icon(): string {
        return this.#icon;
    }

    constructor() {
        super([
            new SignerSolanaWalletAccount({ chain: CHAIN_SOLANA_MAINNET }),
            new LedgerSolanaWalletAccount({ chain: CHAIN_SOLANA_MAINNET }),
            new SignerEthereumWalletAccount({ chain: CHAIN_ETHEREUM }),
        ]);
    }
}
