import React from 'react';
import { RequestStatus } from '@/lib/supabase/types';
import { useTranslation } from '@/lib/i18n/context';

interface BadgeProps {
  status?: RequestStatus | string;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray';
  size?: 'sm' | 'md';
}

export function Badge({ status, label, variant, size = 'md' }: BadgeProps) {
  const { t } = useTranslation();

  let finalVariant = variant || 'default';
  let text = label;

  if (status) {
    switch (status) {
      case 'PENDING':
        finalVariant = 'warning';
        text = t('status_PENDING');
        break;
      case 'APPROVED':
        finalVariant = 'info';
        text = t('status_APPROVED');
        break;
      case 'READY':
        finalVariant = 'purple';
        text = t('status_READY');
        break;
      case 'DELIVERED':
        finalVariant = 'success';
        text = t('status_DELIVERED');
        break;
      case 'PARTIALLY_DELIVERED':
        finalVariant = 'info';
        text = t('status_PARTIALLY_DELIVERED');
        break;
      case 'REJECTED':
        finalVariant = 'danger';
        text = t('status_REJECTED');
        break;
      case 'CANCELLED':
        finalVariant = 'gray';
        text = t('status_CANCELLED');
        break;
      default:
        text = label || status;
    }
  }

  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
    info: 'bg-sky-50 text-sky-800 border-sky-200 font-medium',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium',
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${variants[finalVariant]} ${sizes[size]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      <span>{text}</span>
    </span>
  );
}
