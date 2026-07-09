/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { SOLANA_RPC_URL, COMMITMENT } from '../config/solana';

import '@solana/wallet-adapter-react-ui/styles.css';

// React 18/19 type conflict from wallet adapter transitive deps.
// Safe to cast - these are well-tested React FC components.
const ConnProvider = ConnectionProvider as any;
const WalletProv = WalletProvider as any;
const ModalProv = WalletModalProvider as any;

interface Props {
  children: React.ReactNode;
}

export function WalletProviderWrapper({ children }: Props) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnProvider endpoint={SOLANA_RPC_URL} config={{ commitment: COMMITMENT }}>
      <WalletProv wallets={wallets} autoConnect>
        <ModalProv>{children}</ModalProv>
      </WalletProv>
    </ConnProvider>
  );
}
