"use client";

import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import { selectWalletBalance } from '@/redux/walletSlice';
import { selectActiveSession } from '@/redux/billingSlice';

interface BalanceChipProps {
  onClick?: () => void;
  className?: string;
}

const BalanceChip: React.FC<BalanceChipProps> = ({ onClick, className = '' }) => {
  const walletBalance = useAppSelector(selectWalletBalance);
  const activeSession = useAppSelector(selectActiveSession);

  // Format balance from paise to rupees
  const formatBalance = (balancePaise: number) => {
    return (balancePaise / 100).toFixed(0);
  };

  // Check if balance is low (≤ rate per minute if session active, otherwise ≤ ₹20)
  const baseline = activeSession?.ratePaisePerMin ?? 2000;   // floor ₹20
  const isLowBalance = walletBalance <= Math.max(baseline, 2000);

  return (
    <div className={`absolute top-2 right-2 z-20 ${className}`}>
      <button
        onClick={onClick}
        className={`relative px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg transition-all duration-200 ${
          isLowBalance 
            ? 'bg-gradient-to-r from-red-500 to-pink-500 animate-pulse hover:from-red-600 hover:to-pink-600' 
            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
        }`}
      >
        <span className="block whitespace-nowrap">
          ₹{formatBalance(walletBalance)}
        </span>
        {/* Optional: Add a small shadow/border effect similar to PromoRibbon */}
        <div className={`absolute inset-0 rounded-full -z-10 blur-sm opacity-30 ${
          isLowBalance 
            ? 'bg-gradient-to-r from-red-600 to-pink-600' 
            : 'bg-gradient-to-r from-green-600 to-emerald-600'
        }`}></div>
      </button>
    </div>
  );
};

export default BalanceChip; 