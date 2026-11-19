import React from 'react';
import { TicketPriority, TicketStatus, AssetStatus } from '../types/asset.types';

interface BadgeProps {
  value: TicketPriority | TicketStatus | AssetStatus | string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<BadgeProps> = ({ value, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  const getStyle = () => {
    switch (value) {
      // Priorities
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';

      // Ticket Status
      case 'OPEN':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'IN_PROGRESS':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      case 'CLOSED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

      // Asset Status
      case 'OPERATIONAL':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'UNDER_MAINTENANCE':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'RETIRED':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';

      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-80" />
      {value.replace('_', ' ')}
    </span>
  );
};
