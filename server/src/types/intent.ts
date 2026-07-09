import { z } from 'zod';

export enum IntentType {
  DIRECT_SEND = 'DIRECT_SEND',
  SWAP = 'SWAP',
  BANK_PAYOUT = 'BANK_PAYOUT',
}

export const DirectSendParamsSchema = z.object({
  recipientAddress: z.string().min(32).max(44),
  amount: z.number().positive(),
  tokenSymbol: z.string().default('SOL'),
});

export const SwapParamsSchema = z.object({
  inputToken: z.string(),
  outputToken: z.string(),
  amount: z.number().positive(),
  slippageBps: z.number().int().min(1).max(1000).default(50),
});

export const BankPayoutParamsSchema = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
});

export const ParsedIntentSchema = z.object({
  type: z.nativeEnum(IntentType),
  confidence: z.number().min(0).max(1),
  params: z.union([DirectSendParamsSchema, SwapParamsSchema, BankPayoutParamsSchema]),
});

export type DirectSendParams = z.infer<typeof DirectSendParamsSchema>;
export type SwapParams = z.infer<typeof SwapParamsSchema>;
export type BankPayoutParams = z.infer<typeof BankPayoutParamsSchema>;
export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;

export const ParseRequestSchema = z.object({
  message: z.string().min(1).max(500),
  walletAddress: z.string().min(32).max(44),
});

export const RoutesRequestSchema = z.object({
  intent: ParsedIntentSchema,
  walletAddress: z.string().min(32).max(44),
});
