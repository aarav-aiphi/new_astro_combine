import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useRouter } from 'next/navigation';
import ChatWalletBalance from '@/components/ui/ChatWalletBalance';
import userReducer from '@/redux/userSlice';
import walletReducer from '@/redux/walletSlice';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Wallet2: ({ className, ...props }: { className?: string; 'data-testid'?: string }) => 
    <div data-testid="wallet-icon" className={className} {...props}>💰</div>,
  Plus: ({ className, ...props }: { className?: string; 'data-testid'?: string }) => 
    <div data-testid="plus-icon" className={className} {...props}>+</div>,
  AlertCircle: ({ className, ...props }: { className?: string; 'data-testid'?: string }) => 
    <div data-testid="alert-icon" className={className} {...props}>⚠️</div>,
}));

// Mock fetch
global.fetch = jest.fn();

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      user: userReducer,
      wallet: walletReducer,
    },
    preloadedState: {
      user: {
        user: { 
          _id: 'user1', 
          name: 'Test User', 
          username: 'testuser',
          email: 'test@example.com',
          avatar: '',
          role: 'User' as const,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          __v: 0,
          sessionsCompleted: 0
        },
        token: 'test-token',
        loading: false,
        error: null,
      },
      wallet: {
        balancePaise: 5000, // ₹50
        transactions: [],
        loading: false,
        error: null,
        showRechargeModal: false,
      },
      ...initialState,
    },
  });
};

describe('ChatWalletBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { balancePaise: 5000 } }),
    });
  });



  it('displays wallet balance correctly', async () => {
    const store = createTestStore();
    
    await act(async () => {
      render(
        <Provider store={store}>
          <ChatWalletBalance />
        </Provider>
      );
    });

    expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
    expect(screen.getByText('₹50')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
  });

  it('shows low balance warning when balance is less than ₹20', async () => {
    const store = createTestStore({
      wallet: {
        balancePaise: 1500, // ₹15 - low balance
        transactions: [],
        loading: false,
        error: null,
        showRechargeModal: false,
      },
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <ChatWalletBalance />
        </Provider>
      );
    });

    expect(screen.getByText('⚠️ Low balance - Please recharge to continue chatting')).toBeInTheDocument();
    expect(screen.getByText('Add ₹')).toBeInTheDocument();
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });

  it('navigates to wallet page when balance is clicked', async () => {
    const store = createTestStore();
    
    await act(async () => {
      render(
        <Provider store={store}>
          <ChatWalletBalance />
        </Provider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText('₹50'));
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard/wallet');
  });

  it('opens recharge modal when Add button is clicked', async () => {
    const store = createTestStore();
    
    await act(async () => {
      render(
        <Provider store={store}>
          <ChatWalletBalance />
        </Provider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Add'));
    });
    
    // Check if the action was dispatched by checking store state
    const state = store.getState();
    expect(state.wallet.showRechargeModal).toBe(true);
  });

  it('does not render when user is not authenticated', () => {
    const store = createTestStore({
      user: {
        user: null,
        token: null,
        loading: false,
        error: null,
      },
    });

    const { container } = render(
      <Provider store={store}>
        <ChatWalletBalance />
      </Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows loading state when wallet is loading', async () => {
    const store = createTestStore({
      wallet: {
        balancePaise: 0,
        transactions: [],
        loading: true,
        error: null,
        showRechargeModal: false,
      },
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <ChatWalletBalance />
        </Provider>
      );
    });

    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });
}); 