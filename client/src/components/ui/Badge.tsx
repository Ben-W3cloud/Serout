import React from 'react';

interface Props {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ children, variant = 'default' }: Props) {
  const variants = {
    default: 'bg-white/10 text-gray-300',
    success: 'bg-green-500/15 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    error: 'bg-red-500/15 text-red-400 border-red-500/20',
    info: 'bg-primary-500/15 text-primary-400 border-primary-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border border-transparent ${variants[variant]}`}>
      {children}
    </span>
  );
}
