import { useState, useRef, useEffect } from 'react';
import { MAX_MESSAGE_LENGTH } from '../../config/constants';

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
  disabledReason?: string;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = 'Type a message...',
  disabledReason,
}: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nearLimit = input.length >= MAX_MESSAGE_LENGTH * 0.8;

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-white/5 bg-[#09091a]/55 px-3 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-4xl">
        {disabledReason && (
          <p className="mb-2 pl-1 text-xs font-medium text-gray-500">{disabledReason}</p>
        )}

        <div className="flex items-end gap-2 sm:gap-3">
          <div className="group flex min-h-[50px] flex-1 items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.24)] transition duration-200 focus-within:border-primary-400/45 focus-within:bg-white/[0.06] focus-within:ring-2 focus-within:ring-primary-500/20">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="max-h-32 min-h-[24px] flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-6 text-gray-100 outline-none placeholder:text-gray-600 disabled:cursor-not-allowed disabled:text-gray-500"
            />
            <span
              className={`shrink-0 pb-0.5 text-[10px] transition-colors ${
                nearLimit ? 'text-yellow-300' : 'text-gray-600'
              }`}
            >
              {input.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>

          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            aria-label="Send message"
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400/40 ${
              disabled || !input.trim()
                ? 'cursor-not-allowed border-white/[0.06] bg-white/[0.04] text-gray-600'
                : 'border-primary-400/40 bg-primary-600/85 text-white shadow-[0_12px_30px_rgba(76,110,245,0.24)] hover:-translate-y-0.5 hover:bg-primary-500 active:translate-y-0'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
