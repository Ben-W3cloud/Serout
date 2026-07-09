import { ChatMessage, ChatState, TxStatus } from '../../types/chat';
import { RouteSelector } from '../routes/RouteSelector';
import { SimulationResultCard } from '../transaction/SimulationResult';
import { TransactionConfirm } from '../transaction/TransactionConfirm';
import { TransactionStatusCard } from '../transaction/TransactionStatus';
import { RouteOption } from '../../types/route';

interface Props {
  message: ChatMessage;
  chatState: ChatState;
  onSelectRoute: (route: RouteOption) => void;
  onConfirmTx: () => void;
  onCancelFlow: () => void;
  isLoading: boolean;
  isLatestAgentMsg: boolean;
}

export function MessageBubble({
  message,
  chatState,
  onSelectRoute,
  onConfirmTx,
  onCancelFlow,
  isLoading,
  isLatestAgentMsg,
}: Props) {
  const isUser = message.role === 'user';
  const isError = message.contentType === 'error';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`min-w-0 max-w-[88%] sm:max-w-[72%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`mb-1 flex items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold ${
            isUser
              ? 'bg-gradient-to-br from-green-500/40 to-emerald-500/40 text-green-200'
              : 'bg-gradient-to-br from-primary-500/40 to-purple-500/40 text-primary-200'
          }`}
          >
            {isUser ? 'U' : 'S'}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-gray-500">
            {isUser ? 'You' : 'Serout'}
          </span>
        </div>

        <div className={`min-w-0 rounded-2xl px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ${
          isUser
            ? 'border border-primary-400/25 bg-primary-600/18'
            : isError
              ? 'border border-red-400/20 bg-red-500/10'
              : 'border border-white/[0.07] bg-white/[0.04]'
        }`}
        >
          <p className="overflow-wrap-anywhere whitespace-pre-wrap text-sm leading-6 text-gray-200">
            {message.content}
          </p>

          {message.contentType === 'routes' && message.data?.routes && isLatestAgentMsg && (
            <RouteSelector
              routes={message.data.routes}
              onSelect={onSelectRoute}
              disabled={chatState !== ChatState.ROUTES_SHOWN}
            />
          )}

          {message.contentType === 'simulation' && message.data?.simulation && (
            <>
              <SimulationResultCard result={message.data.simulation} />
              {message.data.simulation.success && isLatestAgentMsg && chatState === ChatState.CONFIRMING && (
                <TransactionConfirm
                  onConfirm={onConfirmTx}
                  onCancel={onCancelFlow}
                  isLoading={isLoading}
                />
              )}
            </>
          )}

          {message.contentType === 'transaction_status' && message.data?.txStatus && (
            <TransactionStatusCard
              signature={message.data.txSignature}
              status={message.data.txStatus}
            />
          )}
        </div>

        <p className={`mt-1 text-[10px] text-gray-600 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
