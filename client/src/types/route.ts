export interface RouteOption {
  id: string;
  label: string;
  description: string;
  estimatedFee: number;
  estimatedTime: string;
  priceImpact?: number;
  outputAmount?: number;
  priorityFee: number;
  metadata: Record<string, unknown>;
}
