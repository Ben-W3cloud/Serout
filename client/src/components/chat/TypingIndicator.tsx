interface Props {
  label: string;
}

export function TypingIndicator({ label }: Props) {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[88%] sm:max-w-[72%]">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500/40 to-purple-500/40 text-[10px] font-bold text-primary-200">
            S
          </div>
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Serout</span>
        </div>

        <div className="activity-card flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
          <div className="flex items-center gap-1">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>
      </div>
    </div>
  );
}
