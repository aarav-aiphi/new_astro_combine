import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LowBalanceModal from '../components/ui/LowBalanceModal';
import chatUIReducer from '../redux/chatSlice';
import billingReducer from '../redux/billingSlice';
import userReducer from '../redux/userSlice';
import walletReducer from '../redux/walletSlice';

// Create a proper mock store with all required reducers
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      chatUI: chatUIReducer,
      billing: billingReducer,
      user: userReducer,
      wallet: walletReducer,
    },
    preloadedState: {
      chatUI: {
        connectingAstrologer: null,
        onlineUsers: [],
        typingStatus: {},
        summaries: {},
        unreadCounts: {},
        chatDisabled: false,
        lowBalanceWarning: {
          active: false,
          sessionId: null,
          balancePaise: 0,
          requiredPaise: 0,
          message: '',
          graceTimeSeconds: 30,
        },
      },
      billing: {
        activeSession: null,
        lastTick: null,
        receipt: null,
        loading: false,
        error: null,
        timeElapsed: '00:00',
        amountSpent: '₹0.00',
      },
      user: {
        user: null,
        token: null,
        loading: false,
        error: null,
      },
      wallet: {
        balancePaise: 0,
        transactions: [],
        loading: false,
        error: null,
        showRechargeModal: false,
      },
      ...initialState,
    },
  });
};

// Test LowBalanceModal improvements
describe('LowBalanceModal Tests', () => {
  test('LowBalanceModal does not render when showLowBalanceWarning is false', () => {
    const store = createMockStore({
      chatUI: {
        connectingAstrologer: null,
        onlineUsers: [],
        typingStatus: {},
        summaries: {},
        unreadCounts: {},
        chatDisabled: false,
        lowBalanceWarning: {
          active: false,
          sessionId: null,
          balancePaise: 0,
          requiredPaise: 0,
          message: '',
          graceTimeSeconds: 30,
        },
      },
      wallet: { 
        balancePaise: 1000,
        transactions: [],
        loading: false,
        error: null,
        showRechargeModal: false,
      },
    });

    render(
      <Provider store={store}>
        <LowBalanceModal />
      </Provider>
    );

    // Modal should not be visible
    expect(screen.queryByText('Low Balance Warning')).not.toBeInTheDocument();
  });

  test('LowBalanceModal renders when showLowBalanceWarning is true', () => {
    const store = createMockStore({
      chatUI: {
        connectingAstrologer: null,
        onlineUsers: [],
        typingStatus: {},
        summaries: {},
        unreadCounts: {},
        chatDisabled: false,
        lowBalanceWarning: {
          active: true,
          sessionId: 'test-session',
          balancePaise: 500,
          requiredPaise: 3000,
          message: 'Low balance warning',
          graceTimeSeconds: 30,
        },
      },
      billing: {
        activeSession: {
          sessionId: 'test-session',
          astrologerId: 'astro123',
          astrologerName: 'Test Astrologer',
          sessionType: 'chat',
          ratePaisePerMin: 3000,
          secondsElapsed: 0,
          currentCostPaise: 0,
          isLive: true,
          startedAt: new Date().toISOString(),
        },
        lastTick: null,
        receipt: null,
        loading: false,
        error: null,
        timeElapsed: '00:00',
        amountSpent: '₹0.00',
      },
      wallet: { 
        balancePaise: 500,
        transactions: [],
        loading: false,
        error: null,
        showRechargeModal: false,
      },
    });

    render(
      <Provider store={store}>
        <LowBalanceModal />
      </Provider>
    );

    // Modal should be visible
    expect(screen.getByText('Low Balance Warning')).toBeInTheDocument();
  });

  test('LowBalanceModal shows correct recharge buttons', () => {
    const store = createMockStore({
      chatUI: {
        connectingAstrologer: null,
        onlineUsers: [],
        typingStatus: {},
        summaries: {},
        unreadCounts: {},
        chatDisabled: false,
        lowBalanceWarning: {
          active: true,
          sessionId: 'test-session',
          balancePaise: 500,
          requiredPaise: 3000,
          message: 'Low balance warning',
          graceTimeSeconds: 30,
        },
      },
      billing: {
        activeSession: {
          sessionId: 'test-session',
          astrologerId: 'astro123',
          astrologerName: 'Test Astrologer',
          sessionType: 'chat',
          ratePaisePerMin: 3000,
          secondsElapsed: 0,
          currentCostPaise: 0,
          isLive: true,
          startedAt: new Date().toISOString(),
        },
        lastTick: null,
        receipt: null,
        loading: false,
        error: null,
        timeElapsed: '00:00',
        amountSpent: '₹0.00',
      },
      wallet: { 
        balancePaise: 500,
        transactions: [],
        loading: false,
        error: null,
        showRechargeModal: false,
      },
    });

    render(
      <Provider store={store}>
        <LowBalanceModal />
      </Provider>
    );

    // Check for action buttons
    expect(screen.getByText('Recharge Wallet')).toBeInTheDocument();
    expect(screen.getByText('End Session')).toBeInTheDocument();
  });

  test('LowBalanceModal displays session information', () => {
    const store = createMockStore({
      chatUI: {
        connectingAstrologer: null,
        onlineUsers: [],
        typingStatus: {},
        summaries: {},
        unreadCounts: {},
        chatDisabled: false,
        lowBalanceWarning: {
          active: true,
          sessionId: 'test-session',
          balancePaise: 500,
          requiredPaise: 3000,
          message: 'Low balance warning',
          graceTimeSeconds: 30,
        },
      },
      billing: {
        activeSession: {
          sessionId: 'test-session',
          astrologerId: 'astro123',
          astrologerName: 'Test Astrologer',
          sessionType: 'chat',
          ratePaisePerMin: 3000, // ₹30/min
          secondsElapsed: 0,
          currentCostPaise: 0,
          isLive: true,
          startedAt: new Date().toISOString(),
        },
        lastTick: null,
        receipt: null,
        loading: false,
        error: null,
        timeElapsed: '00:00',
        amountSpent: '₹0.00',
      },
      wallet: { 
        balancePaise: 500,
        transactions: [],
        loading: false,
        error: null,
        showRechargeModal: false,
      },
    });

    render(
      <Provider store={store}>
        <LowBalanceModal />
      </Provider>
    );

    // Check for session details
    expect(screen.getByText('Current Rate:')).toBeInTheDocument();
    expect(screen.getByText('₹30/min')).toBeInTheDocument();
    expect(screen.getByText('Session Type:')).toBeInTheDocument();
    expect(screen.getByText('chat')).toBeInTheDocument();
  });

  test('LowBalanceModal shows 30 second warning message', () => {
    const store = createMockStore({
      chatUI: {
        connectingAstrologer: null,
        onlineUsers: [],
        typingStatus: {},
        summaries: {},
        unreadCounts: {},
        chatDisabled: false,
        lowBalanceWarning: {
          active: true,
          sessionId: 'test-session',
          balancePaise: 500,
          requiredPaise: 3000,
          message: 'Low balance warning',
          graceTimeSeconds: 30,
        },
      },
      billing: {
        activeSession: {
          sessionId: 'test-session',
          astrologerId: 'astro123',
          astrologerName: 'Test Astrologer',
          sessionType: 'chat',
          ratePaisePerMin: 3000,
          secondsElapsed: 0,
          currentCostPaise: 0,
          isLive: true,
          startedAt: new Date().toISOString(),
        },
        lastTick: null,
        receipt: null,
        loading: false,
        error: null,
        timeElapsed: '00:00',
        amountSpent: '₹0.00',
      },
      wallet: { 
        balancePaise: 500,
        transactions: [],
        loading: false,
        error: null,
        showRechargeModal: false,
      },
    });

    render(
      <Provider store={store}>
        <LowBalanceModal />
      </Provider>
    );

    // Check for warning message
    expect(screen.getByText(/You have about 30 seconds/)).toBeInTheDocument();
  });
}); 