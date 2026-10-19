import React from 'react';
import { LucideIcon, FolderSearch } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#262626] bg-[#121212] px-6 py-12 text-center font-terminal text-yellow-400">
      <div className="rounded-full bg-[#1c1c1c] border border-[#333333] p-3 text-orange-500 mb-4">
        <Icon className="w-8 h-8 text-orange-500" />
      </div>
      <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider font-mono">{title}</h3>
      <p className="mt-1 text-xs text-yellow-400/70 max-w-sm font-mono">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2 text-xs font-bold text-black uppercase transition-colors shadow-lg font-mono"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
