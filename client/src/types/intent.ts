export enum IntentType {
  DIRECT_SEND = 'DIRECT_SEND',
  SWAP = 'SWAP',
  BANK_PAYOUT = 'BANK_PAYOUT',
}

export interface DirectSendParams {
  recipientAddress: string;
  amount: number;
  tokenSymbol: string;
}

export interface SwapParams {
  inputToken: string;
  outputToken: string;
  amount: number;
  slippageBps: number;
}

export interface BankPayoutParams {
  bankName: string;
  accountNumber: string;
  amount: number;
  currency: string;
}

export interface ParsedIntent {
  type: IntentType;
  confidence: number;
  params: DirectSendParams | SwapParams | BankPayoutParams;
}
