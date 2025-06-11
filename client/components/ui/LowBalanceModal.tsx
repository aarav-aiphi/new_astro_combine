"use client";

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { selectActiveSession } from '@/redux/billingSlice';
import { selectLowBalanceWarning, clearLowBalanceWarning } from '@/redux/chatSlice';
import { selectUser } from '@/redux/userSlice';
import { selectBalancePaise, openRechargeModal } from '@/redux/walletSlice';

interface LowBalanceModalProps {
  socket?: any; // Socket.io instance
}

const LowBalanceModal: React.FC<LowBalanceModalProps> = ({ socket }) => {
  const dispatch = useAppDispatch();
  const lowBalanceWarning = useAppSelector(selectLowBalanceWarning);
  const showWarning = lowBalanceWarning.active;
  const activeSession = useAppSelector(selectActiveSession);
  const user = useAppSelector(selectUser);
  const balance = useAppSelector(selectBalancePaise);

  // Calculate minimum recharge needed for 5 minutes
  const calculateMinRecharge = () => {
    if (!activeSession) return 5000; // Default ₹50
    
    const ratePerMinute = activeSession.ratePaisePerMin;
    const requiredFor5Min = ratePerMinute * 5;
    
    const needed = Math.max(0, requiredFor5Min - balance);
    
    return Math.ceil(needed / 100) * 100; // Round up to nearest rupee in paise
  };

  const handleEndSession = () => {
    if (socket && activeSession) {
      socket.emit('consult:end', {
        sessionId: activeSession.sessionId,
        reason: 'user_ended_low_balance'
      });
    }
    dispatch(clearLowBalanceWarning());
  };

  const handleRecharge = () => {
    dispatch(openRechargeModal());
    dispatch(clearLowBalanceWarning());
  };

  const handleClose = () => {
    dispatch(clearLowBalanceWarning());
  };

  const minRecharge = calculateMinRecharge();
  const formattedAmount = `₹${(minRecharge / 100).toFixed(0)}`;

  return (
    <Dialog.Root open={showWarning} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-96 max-w-90vw z-50 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Low Balance Warning
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-gray-600 mb-3">
            Your wallet balance is running low. To continue your session for 5 more minutes, 
            you need at least <span className="font-semibold text-red-600">{formattedAmount}</span>.
          </Dialog.Description>
          
          {activeSession && (
            <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 mb-6">
              <p><strong>Current Rate:</strong> ₹{(activeSession.ratePaisePerMin / 100).toFixed(0)}/min</p>
              <p><strong>Session Type:</strong> {activeSession.sessionType}</p>
              <p><strong>Current Balance:</strong> ₹{(balance / 100).toFixed(2)}</p>
              <p><strong>Per 15 seconds:</strong> ₹{(Math.ceil(activeSession.ratePaisePerMin * 15 / 60) / 100).toFixed(2)}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleRecharge}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Recharge Wallet
            </button>
            <button
              onClick={handleEndSession}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              End Session
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            You have about 30 seconds before the session automatically ends.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LowBalanceModal; 