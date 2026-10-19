import React from 'react';
import { cn } from '@/utils/format';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  const variantStyles = {
    default: 'bg-[#1c1c1c] text-yellow-400 border-[#333333]',
    success: 'bg-[#1a2818] text-yellow-400 border-[#2d4d29]',
    warning: 'bg-yellow-950/80 text-yellow-400 border-yellow-700/80',
    danger: 'bg-orange-950/90 text-orange-400 border-orange-800',
    info: 'bg-[#1c1c1c] text-orange-400 border-orange-700/60',
    purple: 'bg-[#221c28] text-yellow-400 border-yellow-600/40',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono',
    md: 'text-xs px-3 py-1 font-bold uppercase tracking-wider font-mono',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'MATCHED':
    case 'APPROVED':
    case 'RESOLVED':
    case 'PROCESSED':
      return <Badge variant="success">{status}</Badge>;
    case 'PARTIALLY_MATCHED':
    case 'REVIEW_REQUIRED':
    case 'UNDER_REVIEW':
    case 'PROCESSING':
    case 'IN_PROGRESS':
      return <Badge variant="warning">{status}</Badge>;
    case 'AMOUNT_MISMATCH':
    case 'REJECTED':
    case 'FAILED':
    case 'CRITICAL':
    case 'HIGH':
      return <Badge variant="danger">{status}</Badge>;
    case 'UNMATCHED':
    case 'OPEN':
    case 'UPLOADED':
    case 'LOW':
    case 'MEDIUM':
      return <Badge variant="info">{status}</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};
