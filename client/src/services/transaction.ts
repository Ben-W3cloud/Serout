import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  VersionedTransaction,
} from '@solana/web3.js';
import { RouteOption } from '../types/route';
import { IntentType } from '../types/intent';

const JUPITER_SWAP_API = 'https://lite-api.jup.ag/swap/v1/swap';
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export async function buildTransaction(
  connection: Connection,
  walletPubkey: PublicKey,
  route: RouteOption,
  intentType: IntentType,
): Promise<Transaction | VersionedTransaction> {
  switch (intentType) {
    case IntentType.DIRECT_SEND:
      return buildTransferTransaction(connection, walletPubkey, route);
    case IntentType.SWAP:
      return buildSwapTransaction(walletPubkey, route);
    case IntentType.BANK_PAYOUT:
      return buildBankPayoutTransaction(connection, walletPubkey, route);
    default:
      throw new Error(`Unsupported transaction type: ${intentType}`);
  }
}

function validateSolanaAddress(address: string): PublicKey {
  let pubkey: PublicKey;
  try {
    pubkey = new PublicKey(address);
  } catch {
    throw new Error(`Invalid Solana address: "${address}" is not a valid base58-encoded public key.`);
  }
  return pubkey;
}

async function buildTransferTransaction(
  connection: Connection,
  from: PublicKey,
  route: RouteOption,
): Promise<Transaction> {
  const recipientAddress = route.metadata.recipientAddress as string;
  const amount = route.metadata.amount as number;

  if (!recipientAddress || typeof amount !== 'number' || amount <= 0) {
    throw new Error('Invalid route metadata: missing recipientAddress or amount.');
  }

  const to = validateSolanaAddress(recipientAddress);

  const transaction = new Transaction();

  // Add priority fee if set
  if (route.priorityFee > 0) {
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: route.priorityFee,
      }),
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 200_000,
      }),
    );
  }

  // Add transfer instruction
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: Math.round(amount * LAMPORTS_PER_SOL),
    }),
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = from;

  return transaction;
}

async function buildSwapTransaction(
  walletPubkey: PublicKey,
  route: RouteOption,
): Promise<VersionedTransaction> {
  const quoteResponse = route.metadata.quoteResponse;
  if (!quoteResponse) {
    throw new Error('Missing Jupiter quote data in route. Please try fetching routes again.');
  }

  const response = await fetch(JUPITER_SWAP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: walletPubkey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: route.priorityFee,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jupiter swap API failed (${response.status}): ${errorText}`);
  }

  const swapData = await response.json();
  const swapTransaction = swapData.swapTransaction;
  if (!swapTransaction) {
    throw new Error('Jupiter did not return a swap transaction. The route may have expired.');
  }

  const txBuffer = Buffer.from(swapTransaction, 'base64');
  return VersionedTransaction.deserialize(txBuffer);
}

async function buildBankPayoutTransaction(
  connection: Connection,
  from: PublicKey,
  route: RouteOption,
): Promise<Transaction> {
  const bankName = route.metadata.bankName as string;
  const accountNumber = route.metadata.accountNumber as string;
  const amount = route.metadata.amount as number;
  const currency = route.metadata.currency as string;
  const method = route.metadata.method as string;

  if (!bankName || !accountNumber) {
    throw new Error('Invalid bank payout route metadata.');
  }

  // Mock: write payout info as a memo on-chain
  const memoData = JSON.stringify({
    type: 'BANK_PAYOUT',
    bank: bankName,
    account: accountNumber.slice(-4), // only last 4 digits for safety
    amount,
    currency,
    method,
    ts: Date.now(),
  });

  const transaction = new Transaction();

  // Memo program: keys array should be empty for a simple memo,
  // or include signer with isWritable=false
  transaction.add(
    new TransactionInstruction({
      keys: [{ pubkey: from, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoData, 'utf-8'),
    }),
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = from;

  return transaction;
}

export async function simulateTransaction(
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
) {
  try {
    let result;
    if (transaction instanceof VersionedTransaction) {
      result = await connection.simulateTransaction(transaction, {
        commitment: 'confirmed',
      });
    } else {
      result = await connection.simulateTransaction(transaction);
    }

    const simResult = result.value;

    // Compute a more realistic fee estimate
    const unitsConsumed = simResult.unitsConsumed || 200_000;
    const baseFee = 5_000; // 5000 lamports base
    const estimatedFee = baseFee + Math.ceil(unitsConsumed * 0.001); // rough CU-based estimate

    return {
      success: simResult.err === null,
      fee: estimatedFee,
      logs: simResult.logs || [],
      unitsConsumed: simResult.unitsConsumed || 0,
      error: simResult.err ? JSON.stringify(simResult.err) : undefined,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Simulation failed';
    return {
      success: false,
      fee: 0,
      logs: [],
      unitsConsumed: 0,
      error: errorMessage,
    };
  }
}
