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
  | 'seller'
  | 'blocked'
  | 'requested'
  | 'price_update_requested'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

const variantStyles: Record<StatusVariant, string> = {
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  approved: 'bg-green-50 text-green-700 ring-green-600/20',
  completed: 'bg-green-50 text-green-700 ring-green-600/20',
  delivered: 'bg-green-50 text-green-700 ring-green-600/20',
  in_inventory: 'bg-green-50 text-green-700 ring-green-600/20',

  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  requested: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  price_update_requested: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  under_refurbishment: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  processing: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  shipped: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  picked_up: 'bg-purple-50 text-purple-700 ring-purple-600/20',

  inactive: 'bg-muted text-muted-foreground ring-border',
  user: 'bg-muted text-muted-foreground ring-border',
  sold: 'bg-muted text-muted-foreground ring-border',

  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  blocked: 'bg-red-50 text-red-700 ring-red-600/20',

  refunded: 'bg-purple-50 text-purple-700 ring-purple-600/20',

  admin: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  seller: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

const variantLabels: Record<StatusVariant, string> = {
  active: 'Active',
  approved: 'Approved',
  completed: 'Completed',
  delivered: 'Delivered',
  in_inventory: 'In Inventory',
  pending: 'Pending',
  requested: 'Pending Approval',
  price_update_requested: 'Price Update Pending',
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
  refunded: 'Returned',
  admin: 'Admin',
  seller: 'Seller',
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customLabel, className }) => {
  const key = status.toLowerCase().replace(/ /g, '_') as StatusVariant;
  const styles = variantStyles[key] || 'bg-muted text-muted-foreground ring-border';
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
