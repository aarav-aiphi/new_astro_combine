"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  fetchWallet, 
  selectWalletBalance, 
  selectWalletLoading, 
  openRechargeModal 
} from '@/redux/walletSlice';
import { selectUser } from '@/redux/userSlice';
import { Wallet2, Plus, AlertCircle } from 'lucide-react';

const ChatWalletBalance: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const balancePaise = useAppSelector(selectWalletBalance);
  const loading = useAppSelector(selectWalletLoading);
  const isAuthenticated = !!user;

  // Fetch wallet balance when component mounts (skip interval in tests)
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWallet());
      
      // Skip interval during tests to avoid act warnings
      if (process.env.NODE_ENV !== 'test') {
        const interval = setInterval(() => {
          dispatch(fetchWallet());
        }, 30000);
        
        return () => clearInterval(interval);
      }
    }
  }, [isAuthenticated, dispatch]);

  const formatBalance = (balancePaise: number) => {
    return (balancePaise / 100).toFixed(0);
  };

  const isLowBalance = balancePaise < 2000; // Less than ₹20

  const handleWalletClick = () => {
    router.push('/dashboard/wallet');
  };

  const handleQuickRecharge = () => {
    dispatch(openRechargeModal());
  };

  if (!isAuthenticated) return null;

  return (
    <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-blue-100 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet2 data-testid="wallet-icon" className={`w-4 h-4 ${isLowBalance ? 'text-red-500' : 'text-blue-500'}`} />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">Wallet Balance</span>
            {loading ? (
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            ) : (
              <button
                onClick={handleWalletClick}
                className={`text-left font-semibold text-sm hover:underline ${
                  isLowBalance ? 'text-red-600' : 'text-green-600'
                }`}
              >
                ₹{formatBalance(balancePaise)}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isLowBalance && (
            <AlertCircle data-testid="alert-icon" className="w-4 h-4 text-red-500 animate-pulse" />
          )}
          <button
            onClick={handleQuickRecharge}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              isLowBalance 
                ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
            disabled={loading}
          >
            <Plus data-testid="plus-icon" className="w-3 h-3" />
            {isLowBalance ? 'Add ₹' : 'Add'}
          </button>
        </div>
      </div>
      
      {isLowBalance && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <span>⚠️ Low balance - Please recharge to continue chatting</span>
        </div>
      )}
    </div>
  );
};

export default ChatWalletBalance; 