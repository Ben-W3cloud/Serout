import { clusterApiUrl } from '@solana/web3.js';

export const SOLANA_CLUSTER = 'devnet' as const;
export const SOLANA_RPC_URL = clusterApiUrl(SOLANA_CLUSTER);
export const COMMITMENT = 'confirmed' as const;
