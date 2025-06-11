"use client";

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Wallet } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { rechargeWallet, selectWalletLoading, selectWalletError } from '@/redux/walletSlice';

interface RechargeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const RechargeModal: React.FC<RechargeModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectWalletLoading);
  const walletError = useAppSelector(selectWalletError);

  // Predefined amount buttons
  const predefinedAmounts = [100, 500, 1000, 2000];

  const handleAmountChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    setError(null);
  };

  const handlePredefinedAmount = (value: number) => {
    setAmount(value.toString());
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseInt(amount);
    
    // Validation
    if (!amount || numericAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (numericAmount < 10) {
      setError('Minimum recharge amount is ₹10');
      return;
    }
    
    if (numericAmount > 50000) {
      setError('Maximum recharge amount is ₹50,000');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Convert rupees to paise
      const amountPaise = numericAmount * 100;
      
      await dispatch(rechargeWallet(amountPaise)).unwrap();
      
      // Success
      setAmount('');
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Show success toast (if you have a toast system)
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            type: 'success',
            message: `₹${numericAmount} added to your wallet successfully!`
          }
        }));
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to recharge wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-96 max-w-90vw z-50 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              Recharge Wallet
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                aria-label="Close"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-gray-600 mb-4">
            Add money to your wallet to continue using chat and call services.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Input */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Predefined Amount Buttons */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Select:</p>
              <div className="grid grid-cols-4 gap-2">
                {predefinedAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handlePredefinedAmount(value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    ₹{value}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {(error || walletError) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error || walletError}</p>
              </div>
            )}

            {/* Recharge Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-600">
                💡 This is a dummy payment provider. Your balance will be updated instantly for testing purposes.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={isSubmitting || loading}
              >
                {(isSubmitting || loading) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  'Add Money'
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default RechargeModal; 