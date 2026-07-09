import { TxStatus } from '../../types/chat';
import { Badge } from '../ui/Badge';

interface Props {
  signature?: string;
  status: TxStatus;
}

export function TransactionStatusCard({ signature, status }: Props) {
  const explorerUrl = signature
    ? `https://explorer.solana.com/tx/${signature}?cluster=devnet`
    : undefined;

  return (
    <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#15152f]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Badge variant={status === TxStatus.CONFIRMED ? 'success' : status === TxStatus.PENDING ? 'warning' : 'error'}>
          {status === TxStatus.CONFIRMED ? 'Confirmed' : status === TxStatus.PENDING ? 'Pending' : 'Failed'}
        </Badge>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-primary-400/20 bg-primary-500/10 px-2.5 py-1 text-xs font-medium text-primary-200 transition hover:border-primary-300/40 hover:bg-primary-500/18 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
          >
            View Explorer
          </a>
        )}
      </div>

      {signature && (
        <div>
          <p className="mb-1 text-xs text-gray-500">Transaction signature</p>
          <code className="overflow-wrap-anywhere block rounded-lg border border-white/[0.06] bg-black/18 p-3 font-mono text-[11px] leading-5 text-primary-200">
            {signature}
          </code>
        </div>
      )}
    </div>
  );
}
