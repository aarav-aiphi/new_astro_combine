"use client";
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  selectActiveSession, 
  selectTimeElapsed, 
  selectAmountSpent,
  processBillingTick,
  setActiveSession,
  sessionEnded
} from '@/redux/billingSlice';
import { selectLowBalanceWarning, setLowBalanceWarning } from '@/redux/chatSlice';
import { selectUser } from '@/redux/userSlice';
import { fetchWallet, updateBalance } from '@/redux/walletSlice';
import { Socket } from 'socket.io-client';
import LowBalanceModal from '@/components/ui/LowBalanceModal';
import PromoRibbon from '@/components/ui/PromoRibbon';
import BalanceChip from '@/components/ui/BalanceChip';

interface BillingDisplayProps {
  socket?: Socket;
  className?: string;
}

export default function BillingDisplay({ socket, className = '' }: BillingDisplayProps) {
  const dispatch = useAppDispatch();
  const activeSession = useAppSelector(selectActiveSession);
  const timeElapsed = useAppSelector(selectTimeElapsed);
  const amountSpent = useAppSelector(selectAmountSpent);
  const showLowBalanceWarning = useAppSelector((s) => selectLowBalanceWarning(s).active);
  const user = useAppSelector(selectUser);

  // State for End Session confirmation modal
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // Check if user is eligible for first session promo
  const isFirstSession = user?.sessionsCompleted === 0;

  // Mock function to open wallet recharge modal (replace with actual implementation)
  const handleOpenRecharge = () => {
    // This should open the actual WalletRechargeModal
    console.log('Opening wallet recharge modal...');
    // dispatch(openWalletRechargeModal()); // Implement this in walletSlice
  };

  // Handle ending the session
  const handleEndSession = () => {
    setShowEndSessionModal(true);
  };

  const confirmEndSession = () => {
    if (!socket || !activeSession) return;
    
    setIsEndingSession(true);
    
    // Emit end session event to backend
    socket.emit('endSession', {
      sessionId: activeSession.sessionId,
      reason: 'user_requested'
    });

    setShowEndSessionModal(false);
    // isEndingSession will be reset when we receive the session ended event
  };

  // Set up socket listeners for billing events
  useEffect(() => {
    if (!socket) return;

    const handleConsultStarted = (data: any) => {
      console.log('Consultation started:', data);
      dispatch(setActiveSession({
        sessionId: data.sessionId,
        astrologerId: data.astrologerId,
        astrologerName: data.astrologerName,
        sessionType: data.sessionType,
        ratePaisePerMin: data.ratePaisePerMin,
        secondsElapsed: 0,
        currentCostPaise: 0,
        isLive: true,
        startedAt: new Date().toISOString()
      }));
    };

    const handleBillingTick = (data: any) => {
      console.log('Billing tick:', data);
      dispatch(processBillingTick(data));
      // Update wallet balance from tick data
      if (data.balancePaise !== undefined) {
        dispatch(updateBalance(data.balancePaise));
      }
    };

    const handleLowBalance = (data: any) => {
      console.log('Low balance warning:', data);
      dispatch(setLowBalanceWarning(data));
    };

    const handleConsultEnded = (data: any) => {
      console.log('Consultation ended:', data);
      dispatch(sessionEnded(data));
      setIsEndingSession(false);
      // Refresh wallet balance
      dispatch(fetchWallet());
    };

    const handleSessionEnded = (data: any) => {
      console.log('Billing session ended:', data);
      dispatch(sessionEnded(data));
      setIsEndingSession(false);
      // Refresh wallet balance
      dispatch(fetchWallet());
    };

    // Set up event listeners
    socket.on('consult:started', handleConsultStarted);
    socket.on('billing:tick', handleBillingTick);
    socket.on('billing:low-balance', handleLowBalance);
    socket.on('consult:ended', handleConsultEnded);
    socket.on('billing:session-ended', handleSessionEnded);

    // Cleanup
    return () => {
      socket.off('consult:started', handleConsultStarted);
      socket.off('billing:tick', handleBillingTick);
      socket.off('billing:low-balance', handleLowBalance);
      socket.off('consult:ended', handleConsultEnded);
      socket.off('billing:session-ended', handleSessionEnded);
    };
  }, [socket, dispatch]);

  // Don't render if no active session
  if (!activeSession || !activeSession.isLive) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Low Balance Modal */}
      <LowBalanceModal socket={socket} onRecharge={handleOpenRecharge} />

      {/* End Session Confirmation Modal */}
      {showEndSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                End Session?
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Are you sure you want to end your consultation with {activeSession.astrologerName}?
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Current session time:</span>
                  <span className="font-mono font-semibold">{timeElapsed}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-600 dark:text-gray-300">Amount spent:</span>
                  <span className="font-semibold text-green-600">{amountSpent}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowEndSessionModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Continue Session
              </button>
              <button
                onClick={confirmEndSession}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Info Display */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg relative overflow-hidden">
        {/* Promo Ribbon for first-time users */}
        <PromoRibbon show={isFirstSession} />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-wide">Time</p>
                <p className="text-lg font-mono font-bold">{timeElapsed}</p>
              </div>
            </div>

            {/* Cost */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs text-green-200 uppercase tracking-wide">Spent</p>
                <p className="text-lg font-bold">{amountSpent}</p>
              </div>
            </div>
          </div>

          {/* Rate Info & End Session Button */}
          <div className="text-right flex flex-col items-end space-y-2">
            <div>
              <p className="text-xs text-blue-200 uppercase tracking-wide">Rate</p>
              <p className="text-sm font-semibold">
                ₹{(activeSession.ratePaisePerMin / 100).toFixed(2)}/min
              </p>
              <p className="text-xs text-blue-200 capitalize">
                {activeSession.sessionType} consultation
              </p>
              <p className="text-xs text-blue-200">
                Per {Math.ceil(15)} seconds: ₹{(Math.ceil(activeSession.ratePaisePerMin * 15 / 60) / 100).toFixed(2)}
              </p>
            </div>
            
            {/* End Session Button */}
            <button
              onClick={handleEndSession}
              disabled={isEndingSession}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                isEndingSession
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {isEndingSession ? (
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Ending...</span>
                </div>
              ) : (
                'End Session'
              )}
            </button>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center mt-2 pt-2 border-t border-blue-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">LIVE CONSULTATION</span>
          </div>
          <div className="ml-auto text-xs text-blue-200">
            Session ID: {activeSession.sessionId.slice(-6).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
} 