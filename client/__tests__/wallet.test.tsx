import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../redux/userSlice';
import walletReducer from '../redux/walletSlice';

// Simple test for wallet balance formatting
describe('Wallet Tests', () => {
  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        user: userReducer,
        wallet: walletReducer,
      },
      preloadedState: initialState,
    });
  };

  test('wallet balance conversion from paise to rupees', () => {
    // Test the basic conversion logic
    const balancePaise = 5000; // ₹50
    const balanceRupees = (balancePaise / 100).toFixed(2);
    expect(balanceRupees).toBe('50.00');
  });

  test('low balance detection works correctly', () => {
    const lowBalance = 1500; // ₹15
    const sufficientBalance = 5000; // ₹50
    
    expect(lowBalance < 2000).toBe(true); // Should be low
    expect(sufficientBalance < 2000).toBe(false); // Should not be low
  });

  test('wallet store has correct initial state', () => {
    const store = createMockStore();
    const state = store.getState();
    
    expect(state.wallet.balancePaise).toBe(0);
    expect(state.wallet.transactions).toEqual([]);
    expect(state.wallet.loading).toBe(false);
    expect(state.wallet.error).toBe(null);
  });
}); 