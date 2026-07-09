import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import { ParsedIntent } from '../types/intent';
import { RouteOption } from '../types/route';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for error normalization
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const msg = error.response.data?.error?.message || 'Server error';
      return Promise.reject(new Error(msg));
    }
    if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    return Promise.reject(error);
  }
);

interface ParseResponse {
  success: boolean;
  intent?: ParsedIntent;
  clarification?: string;
}

interface RoutesResponse {
  success: boolean;
  routes: RouteOption[];
}

export async function parseMessage(message: string, walletAddress: string): Promise<ParseResponse> {
  const { data } = await client.post<ParseResponse>('/parse', { message, walletAddress });
  return data;
}

export async function fetchRoutes(intent: ParsedIntent, walletAddress: string): Promise<RouteOption[]> {
  const { data } = await client.post<RoutesResponse>('/routes', { intent, walletAddress });
  return data.routes;
}
