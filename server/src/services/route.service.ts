import { v4 as uuidv4 } from 'uuid';
import {
  ParsedIntent,
  IntentType,
  DirectSendParams,
  DirectSendParamsSchema,
  SwapParams,
  SwapParamsSchema,
  BankPayoutParams,
  BankPayoutParamsSchema,
} from '../types/intent.js';
import { RouteOption } from '../types/route.js';
import { PRIORITY_FEES, TOKEN_REGISTRY, JUPITER_QUOTE_API } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/error-handler.js';

function resolveTokenMint(symbol: string): string {
  const upper = symbol.toUpperCase();
  const token = TOKEN_REGISTRY[upper];
  if (!token) {
    throw new AppError(
      400,
      'UNKNOWN_TOKEN',
      `Unknown token: ${symbol}. Supported: ${Object.keys(TOKEN_REGISTRY).join(', ')}`,
    );
  }
  return token.mint;
}

function buildDirectSendRoutes(params: DirectSendParams): RouteOption[] {
  const baseFee = 0.000005; // 5000 lamports
  return [
    {
      id: uuidv4(),
      label: 'Economy',
      description: 'Standard priority, lowest fee',
      estimatedFee: baseFee + PRIORITY_FEES.low / 1e9,
      estimatedTime: '~30s',
      priorityFee: PRIORITY_FEES.low,
      metadata: {
        recipientAddress: params.recipientAddress,
        amount: params.amount,
        tokenSymbol: params.tokenSymbol,
        tier: 'low',
      },
    },
    {
      id: uuidv4(),
      label: 'Standard',
      description: 'Medium priority, balanced speed and cost',
      estimatedFee: baseFee + PRIORITY_FEES.medium / 1e9,
      estimatedTime: '~12s',
      priorityFee: PRIORITY_FEES.medium,
      metadata: {
        recipientAddress: params.recipientAddress,
        amount: params.amount,
        tokenSymbol: params.tokenSymbol,
        tier: 'medium',
      },
    },
    {
      id: uuidv4(),
      label: 'Express',
      description: 'High priority, fastest confirmation',
      estimatedFee: baseFee + PRIORITY_FEES.high / 1e9,
      estimatedTime: '~2s',
      priorityFee: PRIORITY_FEES.high,
      metadata: {
        recipientAddress: params.recipientAddress,
        amount: params.amount,
        tokenSymbol: params.tokenSymbol,
        tier: 'high',
      },
    },
  ];
}

async function buildSwapRoutes(params: SwapParams): Promise<RouteOption[]> {
  const inputMint = resolveTokenMint(params.inputToken);
  const outputMint = resolveTokenMint(params.outputToken);
  const inputTokenInfo = TOKEN_REGISTRY[params.inputToken.toUpperCase()];
  const inputAmount = Math.round(params.amount * 10 ** inputTokenInfo.decimals);

  const slippageOptions = [30, 50, 100]; // 0.3%, 0.5%, 1.0%
  const labels = ['Tight Slippage (0.3%)', 'Standard (0.5%)', 'Relaxed (1.0%)'];
  const descriptions = [
    'Best price, may fail if market moves',
    'Balanced price protection',
    'Higher tolerance, most likely to succeed',
  ];

  const routes: RouteOption[] = [];

  for (let i = 0; i < slippageOptions.length; i++) {
    try {
      const url = new URL(JUPITER_QUOTE_API);
      url.searchParams.set('inputMint', inputMint);
      url.searchParams.set('outputMint', outputMint);
      url.searchParams.set('amount', inputAmount.toString());
      url.searchParams.set('slippageBps', slippageOptions[i].toString());

      const response = await fetch(url.toString());
      if (!response.ok) {
        logger.warn({ status: response.status, slippage: slippageOptions[i] }, 'Jupiter quote failed');
        continue;
      }

      const quote = (await response.json()) as Record<string, unknown>;
      const outputTokenInfo = TOKEN_REGISTRY[params.outputToken.toUpperCase()];
      const outAmount = Number(quote.outAmount) / 10 ** outputTokenInfo.decimals;
      const priceImpact = Number(quote.priceImpactPct) || 0;

      routes.push({
        id: uuidv4(),
        label: labels[i],
        description: descriptions[i],
        estimatedFee: 0.000005 + PRIORITY_FEES.medium / 1e9,
        estimatedTime: i === 0 ? '~15s' : i === 1 ? '~10s' : '~5s',
        priceImpact,
        outputAmount: outAmount,
        priorityFee: PRIORITY_FEES.medium,
        metadata: {
          quoteResponse: quote,
          inputToken: params.inputToken,
          outputToken: params.outputToken,
          inputAmount: params.amount,
          slippageBps: slippageOptions[i],
        },
      });
    } catch (error) {
      logger.error({ error, slippage: slippageOptions[i] }, 'Failed to fetch Jupiter quote');
    }
  }

  if (routes.length === 0) {
    throw new AppError(
      502,
      'SWAP_ROUTES_UNAVAILABLE',
      'Could not fetch swap routes from Jupiter. The service may be temporarily unavailable or the token pair is not supported.',
    );
  }

  // If fewer than 3 routes, vary the priority fee tiers instead of cloning identical routes
  if (routes.length === 1) {
    const base = routes[0];
    routes.push({
      ...base,
      id: uuidv4(),
      label: 'Standard (0.5%)',
      description: 'Balanced price protection, medium priority',
      priorityFee: PRIORITY_FEES.high,
      estimatedFee: 0.000005 + PRIORITY_FEES.high / 1e9,
      estimatedTime: '~5s',
    });
    routes.push({
      ...base,
      id: uuidv4(),
      label: 'Fast (0.5%)',
      description: 'Same slippage, highest priority fee',
      priorityFee: PRIORITY_FEES.high * 2,
      estimatedFee: 0.000005 + (PRIORITY_FEES.high * 2) / 1e9,
      estimatedTime: '~2s',
    });
  } else if (routes.length === 2) {
    const base = routes[1];
    routes.push({
      ...base,
      id: uuidv4(),
      label: 'Fast Priority',
      description: 'Same route, highest priority',
      priorityFee: PRIORITY_FEES.high,
      estimatedFee: 0.000005 + PRIORITY_FEES.high / 1e9,
      estimatedTime: '~3s',
    });
  }

  return routes;
}

function buildBankPayoutRoutes(params: BankPayoutParams): RouteOption[] {
  return [
    {
      id: uuidv4(),
      label: 'Standard Wire',
      description: `Wire transfer to ${params.bankName} - 1-3 business days`,
      estimatedFee: 5.0,
      estimatedTime: '1-3 business days',
      priorityFee: 0,
      metadata: {
        bankName: params.bankName,
        accountNumber: params.accountNumber,
        amount: params.amount,
        currency: params.currency,
        method: 'wire',
      },
    },
    {
      id: uuidv4(),
      label: 'ACH Transfer',
      description: `ACH to ${params.bankName} - 3-5 business days`,
      estimatedFee: 1.5,
      estimatedTime: '3-5 business days',
      priorityFee: 0,
      metadata: {
        bankName: params.bankName,
        accountNumber: params.accountNumber,
        amount: params.amount,
        currency: params.currency,
        method: 'ach',
      },
    },
    {
      id: uuidv4(),
      label: 'Express Wire',
      description: `Same-day wire to ${params.bankName}`,
      estimatedFee: 25.0,
      estimatedTime: 'Same day',
      priorityFee: 0,
      metadata: {
        bankName: params.bankName,
        accountNumber: params.accountNumber,
        amount: params.amount,
        currency: params.currency,
        method: 'express_wire',
      },
    },
  ];
}

export async function generateRoutes(intent: ParsedIntent): Promise<RouteOption[]> {
  switch (intent.type) {
    case IntentType.DIRECT_SEND: {
      const parsed = DirectSendParamsSchema.safeParse(intent.params);
      if (!parsed.success) {
        throw new AppError(400, 'INVALID_PARAMS', 'Invalid direct send parameters.');
      }
      return buildDirectSendRoutes(parsed.data);
    }
    case IntentType.SWAP: {
      const parsed = SwapParamsSchema.safeParse(intent.params);
      if (!parsed.success) {
        throw new AppError(400, 'INVALID_PARAMS', 'Invalid swap parameters.');
      }
      return await buildSwapRoutes(parsed.data);
    }
    case IntentType.BANK_PAYOUT: {
      const parsed = BankPayoutParamsSchema.safeParse(intent.params);
      if (!parsed.success) {
        throw new AppError(400, 'INVALID_PARAMS', 'Invalid bank payout parameters.');
      }
      return buildBankPayoutRoutes(parsed.data);
    }
    default:
      throw new AppError(400, 'UNKNOWN_INTENT', `Unknown intent type: ${intent.type}`);
  }
}
