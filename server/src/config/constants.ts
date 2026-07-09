export const TOKEN_REGISTRY: Record<string, { mint: string; decimals: number; symbol: string }> = {
  SOL: {
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    symbol: 'SOL',
  },
  USDC: {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    symbol: 'USDC',
  },
  USDT: {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    symbol: 'USDT',
  },
  BONK: {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    symbol: 'BONK',
  },
  JUP: {
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    symbol: 'JUP',
  },
  RAY: {
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6,
    symbol: 'RAY',
  },
};

export const PRIORITY_FEES = {
  low: 1_000,        // 1,000 microlamports per CU
  medium: 50_000,    // 50,000 microlamports per CU
  high: 200_000,     // 200,000 microlamports per CU
};

export const JUPITER_QUOTE_API = 'https://lite-api.jup.ag/swap/v1/quote';
export const JUPITER_SWAP_API = 'https://lite-api.jup.ag/swap/v1/swap';

export const MAX_MESSAGE_LENGTH = 500;
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 30;
