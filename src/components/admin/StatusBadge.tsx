import React from 'react';
import { cn } from '@/lib/utils';

type StatusVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'in_progress'
  | 'approved'
  | 'rejected'
  | 'picked_up'
  | 'under_refurbishment'
  | 'completed'
  | 'in_inventory'
  | 'sold'
  | 'user'
  | 'admin'
  | 'blocked'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

const variantStyles: Record<StatusVariant, string> = {
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  approved: 'bg-green-50 text-green-700 ring-green-600/20',
  completed: 'bg-green-50 text-green-700 ring-green-600/20',
  delivered: 'bg-green-50 text-green-700 ring-green-600/20',
  in_inventory: 'bg-green-50 text-green-700 ring-green-600/20',

  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  under_refurbishment: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  processing: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  shipped: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  picked_up: 'bg-purple-50 text-purple-700 ring-purple-600/20',

  inactive: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  user: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  sold: 'bg-gray-100 text-gray-600 ring-gray-500/20',

  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  blocked: 'bg-red-50 text-red-700 ring-red-600/20',

  admin: 'bg-purple-50 text-purple-700 ring-purple-600/20',
};

const variantLabels: Record<StatusVariant, string> = {
  active: 'Active',
  approved: 'Approved',
  completed: 'Completed',
  delivered: 'Delivered',
  in_inventory: 'In Inventory',
  pending: 'Pending',
  in_progress: 'In Progress',
  under_refurbishment: 'Under Refurbishment',
  processing: 'Processing',
  shipped: 'Shipped',
  picked_up: 'Picked Up',
  inactive: 'Inactive',
  user: 'User',
  sold: 'Sold',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  blocked: 'Blocked',
  admin: 'Admin',
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customLabel, className }) => {
  const key = status.toLowerCase().replace(/ /g, '_') as StatusVariant;
  const styles = variantStyles[key] || 'bg-gray-100 text-gray-600 ring-gray-500/20';
  const label = customLabel || variantLabels[key] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        styles,
        className
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
