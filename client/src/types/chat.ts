import { ParsedIntent } from './intent';
import { RouteOption } from './route';

export type MessageRole = 'user' | 'agent';

export type MessageContentType =
  | 'text'
  | 'routes'
  | 'simulation'
  | 'transaction_status'
  | 'error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  contentType: MessageContentType;
  timestamp: number;
  data?: {
    intent?: ParsedIntent;
    routes?: RouteOption[];
    selectedRoute?: RouteOption;
    simulation?: SimulationResult;
    txSignature?: string;
    txStatus?: TxStatus;
  };
}

export interface SimulationResult {
  success: boolean;
  fee: number;
  logs: string[];
  unitsConsumed: number;
  error?: string;
}

export enum TxStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export enum ChatState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  ROUTES_SHOWN = 'ROUTES_SHOWN',
  SIMULATING = 'SIMULATING',
  CONFIRMING = 'CONFIRMING',
  EXECUTING = 'EXECUTING',
  RESULT = 'RESULT',
}
