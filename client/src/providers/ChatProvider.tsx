import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ChatMessage, ChatState, SimulationResult, TxStatus } from '../types/chat';
import { ParsedIntent, IntentType } from '../types/intent';
import { RouteOption } from '../types/route';
import * as api from '../services/api';
import { buildTransaction, simulateTransaction } from '../services/transaction';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

interface State {
  messages: ChatMessage[];
  chatState: ChatState;
  currentIntent: ParsedIntent | null;
  routes: RouteOption[] | null;
  selectedRoute: RouteOption | null;
  simulationResult: SimulationResult | null;
  isLoading: boolean;
}

type Action =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_STATE'; payload: ChatState }
  | { type: 'SET_INTENT'; payload: ParsedIntent | null }
  | { type: 'SET_ROUTES'; payload: RouteOption[] | null }
  | { type: 'SET_SELECTED_ROUTE'; payload: RouteOption | null }
  | { type: 'SET_SIMULATION'; payload: SimulationResult | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_FLOW' };

const initialState: State = {
  messages: [],
  chatState: ChatState.IDLE,
  currentIntent: null,
  routes: null,
  selectedRoute: null,
  simulationResult: null,
  isLoading: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_STATE':
      return { ...state, chatState: action.payload };
    case 'SET_INTENT':
      return { ...state, currentIntent: action.payload };
    case 'SET_ROUTES':
      return { ...state, routes: action.payload };
    case 'SET_SELECTED_ROUTE':
      return { ...state, selectedRoute: action.payload };
    case 'SET_SIMULATION':
      return { ...state, simulationResult: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET_FLOW':
      return {
        ...state,
        chatState: ChatState.IDLE,
        currentIntent: null,
        routes: null,
        selectedRoute: null,
        simulationResult: null,
        isLoading: false,
      };
    default:
      return state;
  }
}

function createMessage(
  role: 'user' | 'agent',
  content: string,
  contentType: ChatMessage['contentType'] = 'text',
  data?: ChatMessage['data'],
): ChatMessage {
  return {
    id: uuidv4(),
    role,
    content,
    contentType,
    timestamp: Date.now(),
    data,
  };
}

interface ChatContextType {
  state: State;
  sendMessage: (message: string) => Promise<void>;
  selectRoute: (route: RouteOption) => Promise<void>;
  confirmTransaction: () => Promise<void>;
  cancelFlow: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  // Ref-based guard to prevent race conditions on concurrent calls
  const processingRef = useRef(false);

  const addMessage = useCallback((msg: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: msg });
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!publicKey) {
      addMessage(createMessage('agent', 'Please connect your wallet first to use Serout.', 'error'));
      return;
    }

    // Race condition guard: prevent duplicate concurrent calls
    if (processingRef.current) return;
    processingRef.current = true;

    // Add user message
    addMessage(createMessage('user', message));
    dispatch({ type: 'SET_STATE', payload: ChatState.PARSING });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Parse intent via Groq
      const result = await api.parseMessage(message, publicKey.toBase58());

      if (result.clarification) {
        addMessage(createMessage('agent', result.clarification));
        dispatch({ type: 'RESET_FLOW' });
        return;
      }

      if (!result.intent) {
        addMessage(createMessage('agent', 'I couldn\'t understand that. Try something like "send 1 SOL to [address]" or "swap 2 SOL for USDC".'));
        dispatch({ type: 'RESET_FLOW' });
        return;
      }

      const intent = result.intent;
      dispatch({ type: 'SET_INTENT', payload: intent });

      // Describe what was parsed
      const intentDesc = describeIntent(intent);
      addMessage(createMessage('agent', `Got it! ${intentDesc}\n\nFetching routes for you...`));

      // Fetch routes
      const routes = await api.fetchRoutes(intent, publicKey.toBase58());
      dispatch({ type: 'SET_ROUTES', payload: routes });
      dispatch({ type: 'SET_STATE', payload: ChatState.ROUTES_SHOWN });
      dispatch({ type: 'SET_LOADING', payload: false });

      addMessage(createMessage('agent', 'Here are 3 route options. Pick the one that works best for you:', 'routes', { intent, routes }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      addMessage(createMessage('agent', `Error: ${errorMessage}`, 'error'));
      dispatch({ type: 'RESET_FLOW' });
    } finally {
      processingRef.current = false;
    }
  }, [publicKey, connection, addMessage]);

  const selectRoute = useCallback(async (route: RouteOption) => {
    if (!publicKey || !state.currentIntent) return;
    if (processingRef.current) return;
    processingRef.current = true;

    dispatch({ type: 'SET_SELECTED_ROUTE', payload: route });
    dispatch({ type: 'SET_STATE', payload: ChatState.SIMULATING });
    dispatch({ type: 'SET_LOADING', payload: true });

    addMessage(createMessage('agent', `Simulating "${route.label}" route...`));

    try {
      const tx = await buildTransaction(connection, publicKey, route, state.currentIntent.type);
      const simResult = await simulateTransaction(connection, tx);

      dispatch({ type: 'SET_SIMULATION', payload: simResult });
      dispatch({ type: 'SET_LOADING', payload: false });

      if (simResult.success) {
        dispatch({ type: 'SET_STATE', payload: ChatState.CONFIRMING });
        addMessage(createMessage(
          'agent',
          `Simulation successful! Estimated fee: ${(simResult.fee / 1e9).toFixed(6)} SOL. ${simResult.unitsConsumed} compute units consumed.\n\nReady to execute?`,
          'simulation',
          { simulation: simResult, selectedRoute: route },
        ));
      } else {
        dispatch({ type: 'SET_STATE', payload: ChatState.ROUTES_SHOWN });
        addMessage(createMessage(
          'agent',
          `Simulation failed: ${simResult.error || 'Unknown error'}. You can try a different route or cancel.`,
          'error',
          { simulation: simResult },
        ));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction build failed';
      addMessage(createMessage('agent', `Failed to simulate: ${errorMessage}`, 'error'));
      dispatch({ type: 'SET_STATE', payload: ChatState.ROUTES_SHOWN });
      dispatch({ type: 'SET_LOADING', payload: false });
    } finally {
      processingRef.current = false;
    }
  }, [publicKey, connection, state.currentIntent, addMessage]);

  const confirmTransaction = useCallback(async () => {
    if (!publicKey || !signTransaction || !state.selectedRoute || !state.currentIntent) return;
    if (processingRef.current) return;
    processingRef.current = true;

    dispatch({ type: 'SET_STATE', payload: ChatState.EXECUTING });
    dispatch({ type: 'SET_LOADING', payload: true });

    addMessage(createMessage('agent', 'Please approve the transaction in your wallet.'));

    try {
      // Build fresh transaction with new blockhash to avoid expiry
      const tx = await buildTransaction(connection, publicKey, state.selectedRoute, state.currentIntent.type);

      let signature: string;

      if (tx instanceof VersionedTransaction) {
        // VersionedTransaction - wallet adapter accepts it directly
        const signed = await signTransaction(tx);
        signature = await connection.sendRawTransaction(
          (signed as unknown as VersionedTransaction).serialize(),
          { skipPreflight: false, maxRetries: 3 },
        );
      } else {
        const signed = await signTransaction(tx);
        signature = await connection.sendRawTransaction(
          (signed as Transaction).serialize(),
          { skipPreflight: false, maxRetries: 3 },
        );
      }

      // Confirm with fresh blockhash
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'confirmed',
      );

      addMessage(createMessage(
        'agent',
        'Transaction confirmed.',
        'transaction_status',
        { txSignature: signature, txStatus: TxStatus.CONFIRMED },
      ));

      dispatch({ type: 'RESET_FLOW' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';

      let userFriendlyError = errorMessage;
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        userFriendlyError = 'Transaction cancelled by user.';
      } else if (errorMessage.includes('insufficient') || errorMessage.includes('Insufficient')) {
        userFriendlyError = 'Insufficient funds. Please check your balance and ensure you have enough SOL for the transfer plus fees.';
      } else if (errorMessage.includes('blockhash') || errorMessage.includes('Blockhash')) {
        userFriendlyError = 'Transaction expired. Please try again.';
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        userFriendlyError = 'Network error. Please check your connection and try again.';
      }

      addMessage(createMessage('agent', `Transaction failed: ${userFriendlyError}`, 'error', {
        txStatus: TxStatus.FAILED,
      }));
      dispatch({ type: 'RESET_FLOW' });
    } finally {
      processingRef.current = false;
    }
  }, [publicKey, signTransaction, connection, state.selectedRoute, state.currentIntent, addMessage]);

  const cancelFlow = useCallback(() => {
    processingRef.current = false;
    addMessage(createMessage('agent', 'Transaction cancelled. What would you like to do next?'));
    dispatch({ type: 'RESET_FLOW' });
  }, [addMessage]);

  return (
    <ChatContext.Provider value={{ state, sendMessage, selectRoute, confirmTransaction, cancelFlow }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}

function describeIntent(intent: ParsedIntent): string {
  switch (intent.type) {
    case IntentType.DIRECT_SEND: {
      const p = intent.params as { amount: number; tokenSymbol: string; recipientAddress: string };
      const addr = p.recipientAddress;
      return `You want to send ${p.amount} ${p.tokenSymbol} to ${addr.slice(0, 8)}...${addr.slice(-4)}`;
    }
    case IntentType.SWAP: {
      const p = intent.params as { amount: number; inputToken: string; outputToken: string };
      return `You want to swap ${p.amount} ${p.inputToken} for ${p.outputToken}`;
    }
    case IntentType.BANK_PAYOUT: {
      const p = intent.params as { amount: number; currency: string; bankName: string };
      return `You want to cash out ${p.amount} ${p.currency} to ${p.bankName}`;
    }
    default:
      return 'Processing your request';
  }
}



