import { RouteOption } from '../../types/route';
import { Badge } from '../ui/Badge';

interface Props {
  route: RouteOption;
  index: number;
  onSelect: (route: RouteOption) => void;
  disabled?: boolean;
}

export function RouteCard({ route, index, onSelect, disabled = false }: Props) {
  const tierColors = ['text-green-400', 'text-primary-400', 'text-purple-400'];

  return (
    <button
      onClick={() => onSelect(route)}
      disabled={disabled}
      className={`glass-card p-4 text-left w-full transition-all duration-200 hover:border-primary-500/30 hover:bg-white/[0.04] ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold ${tierColors[index] || 'text-gray-300'}`}>
          {route.label}
        </span>
        <Badge variant={index === 0 ? 'success' : index === 1 ? 'info' : 'warning'}>
          {route.estimatedTime}
        </Badge>
      </div>

      <p className="text-xs text-gray-400 mb-3">{route.description}</p>

      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-gray-500">Fee: </span>
          <span className="text-gray-300 font-mono">
            {route.estimatedFee < 0.01
              ? `${route.estimatedFee.toFixed(6)} SOL`
              : `$${route.estimatedFee.toFixed(2)}`}
          </span>
        </div>
        {route.outputAmount !== undefined && (
          <div>
            <span className="text-gray-500">Output: </span>
            <span className="text-gray-300 font-mono">{route.outputAmount.toFixed(4)}</span>
          </div>
        )}
        {route.priceImpact !== undefined && route.priceImpact > 0 && (
          <div>
            <span className="text-gray-500">Impact: </span>
            <span className={`font-mono ${route.priceImpact > 1 ? 'text-yellow-400' : 'text-gray-300'}`}>
              {route.priceImpact.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
