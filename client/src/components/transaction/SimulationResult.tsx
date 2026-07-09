import { SimulationResult as SimResult } from '../../types/chat';
import { Badge } from '../ui/Badge';

interface Props {
  result: SimResult;
}

export function SimulationResultCard({ result }: Props) {
  return (
    <div className="glass-card p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant={result.success ? 'success' : 'error'}>
          {result.success ? 'Simulation Passed' : 'Simulation Failed'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-500">Estimated Fee</span>
          <p className="text-gray-300 font-mono mt-0.5">{(result.fee / 1e9).toFixed(6)} SOL</p>
        </div>
        <div>
          <span className="text-gray-500">Compute Units</span>
          <p className="text-gray-300 font-mono mt-0.5">{result.unitsConsumed.toLocaleString()}</p>
        </div>
      </div>

      {result.error && (
        <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400 font-mono break-all">{result.error}</p>
        </div>
      )}
    </div>
  );
}
