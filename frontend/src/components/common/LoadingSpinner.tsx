import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/format';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string; label?: string }> = ({
  size = 'md',
  className,
  label,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-8 text-yellow-400 font-terminal', className)}>
      <Loader2 className={cn('animate-spin text-orange-500', sizeMap[size])} />
      {label && <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest font-mono">{label}</p>}
    </div>
  );
};
