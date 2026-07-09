import { useEffect, useMemo, useRef } from 'react';
import { useChat } from '../../providers/ChatProvider';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ChatState } from '../../types/chat';
import { useWallet } from '@solana/wallet-adapter-react';

const loadingLabels: Partial<Record<ChatState, string>> = {
  [ChatState.PARSING]: 'Understanding request',
  [ChatState.SIMULATING]: 'Simulating route',
  [ChatState.EXECUTING]: 'Waiting for wallet approval',
};

export function ChatWindow() {
  const { state, sendMessage, selectRoute, confirmTransaction, cancelFlow } = useChat();
  const { publicKey } = useWallet();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [state.messages, state.isLoading]);

  const isInputDisabled =
    !publicKey ||
    state.chatState === ChatState.PARSING ||
    state.chatState === ChatState.SIMULATING ||
    state.chatState === ChatState.EXECUTING;

  const loadingLabel = state.isLoading ? loadingLabels[state.chatState] : undefined;

  const disabledReason = !publicKey
    ? 'Connect wallet to start'
    : state.chatState === ChatState.PARSING
      ? 'Understanding request'
      : state.chatState === ChatState.SIMULATING
        ? 'Simulating selected route'
        : state.chatState === ChatState.EXECUTING
          ? 'Waiting for wallet approval'
          : undefined;

  const examples = useMemo(
    () => [
      { label: 'Send SOL', example: 'Send 0.5 SOL to [paste address]' },
      { label: 'Swap Tokens', example: 'Swap 1 SOL for USDC' },
      { label: 'Bank Payout', example: 'Cash out $500 to Chase 1234567890' },
    ],
    [],
  );

  const lastAgentMsgIndex = [...state.messages]
    .reverse()
    .findIndex((m) => m.role === 'agent');
  const lastAgentMsgActualIndex =
    lastAgentMsgIndex >= 0 ? state.messages.length - 1 - lastAgentMsgIndex : -1;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-4">
          {state.messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary-400/25 bg-gradient-to-br from-primary-500/30 to-purple-500/30 shadow-[0_18px_50px_rgba(76,110,245,0.16)]">
                <span className="text-2xl font-bold text-primary-200">S</span>
              </div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.24em] text-primary-300/80">
                Solana AI Agent
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {publicKey ? 'What should we move?' : 'Connect wallet to begin'}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-gray-400">
                {publicKey
                  ? 'Describe the transaction in plain language. Serout will parse, route, simulate, and ask before signing.'
                  : 'Connect a Solana wallet to unlock transaction routing, simulation, and wallet approval.'}
              </p>

              {publicKey && (
                <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                  {examples.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => sendMessage(item.example)}
                      className="group rounded-xl border border-white/[0.07] bg-white/[0.035] p-4 text-left shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-primary-400/30 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-400/40"
                    >
                      <p className="mb-2 text-xs font-semibold text-primary-300">{item.label}</p>
                      <p className="text-[11px] leading-5 text-gray-500 group-hover:text-gray-400">
                        {item.example}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {state.messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              chatState={state.chatState}
              onSelectRoute={selectRoute}
              onConfirmTx={confirmTransaction}
              onCancelFlow={cancelFlow}
              isLoading={state.isLoading}
              isLatestAgentMsg={index === lastAgentMsgActualIndex}
            />
          ))}

          {loadingLabel && <TypingIndicator label={loadingLabel} />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        onSend={sendMessage}
        disabled={isInputDisabled}
        disabledReason={disabledReason}
        placeholder={
          !publicKey
            ? 'Connect your wallet to start...'
            : state.chatState === ChatState.ROUTES_SHOWN
              ? 'Select a route above, or type a new message...'
              : 'Ask Serout to send, swap, or cash out...'
        }
      />
    </div>
  );
}
