import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export function Header() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    let cancelled = false;

    async function fetchBalance() {
      try {
        const bal = await connection.getBalance(publicKey!);
        if (!cancelled) setBalance(bal / LAMPORTS_PER_SOL);
      } catch {
        if (!cancelled) setBalance(null);
      }
    }

    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [publicKey, connection]);

  return (
    <header className="flex items-center justify-between gap-3 border-b border-white/5 bg-[#080817]/45 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 shadow-[0_10px_30px_rgba(76,110,245,0.25)]">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-white">Serout</h1>
          <p className="truncate text-[10px] uppercase tracking-widest text-gray-500">Solana AI Agent</p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        {publicKey && balance !== null && (
          <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.05] px-3 py-1.5 sm:flex">
            <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.7)]" />
            <span className="font-mono text-xs text-gray-300">{balance.toFixed(4)} SOL</span>
          </div>
        )}
        <WalletMultiButton />
      </div>
    </header>
  );
}
