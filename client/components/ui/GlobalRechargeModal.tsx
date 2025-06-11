"use client";

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  selectShowRechargeModal, 
  closeRechargeModal, 
  fetchWallet, 
  fetchTransactions 
} from '@/redux/walletSlice';
import RechargeModal from './RechargeModal';

const GlobalRechargeModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const showModal = useAppSelector(selectShowRechargeModal);

  const handleClose = () => {
    dispatch(closeRechargeModal());
  };

  const handleSuccess = () => {
    // Refresh wallet data after successful recharge
    dispatch(fetchWallet());
    dispatch(fetchTransactions());
  };

  return (
    <RechargeModal
      open={showModal}
      onOpenChange={handleClose}
      onSuccess={handleSuccess}
    />
  );
};

export default GlobalRechargeModal; 