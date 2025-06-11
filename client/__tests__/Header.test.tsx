import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useRouter } from 'next/navigation';
import { Header } from '../components/header';
import billingReducer, {
  initialState as billingInitial,
} from '@/redux/billingSlice';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the fetchWallet action
const mockFetchWallet = jest.fn();
jest.mock('../redux/walletSlice', () => ({
  ...jest.requireActual('../redux/walletSlice'),
  fetchWallet: () => mockFetchWallet,
}));

// Create a minimal mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      billing: billingReducer,
      user: (state = { user: null, token: null }, action) => {
        if (initialState.user) return initialState.user;
        return state;
      },
      wallet: (state = { balancePaise: 5000, loading: false, error: null }, action) => {
        if (initialState.wallet) return initialState.wallet;
        return state;
      }
    },
    preloadedState: {
      billing: billingInitial,
      ...initialState,
    },
  });
};

const mockPush = jest.fn();

describe('Header Wallet Badge Tests', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  test('shows wallet balance when user is authenticated', () => {
    const store = createMockStore({
      user: {
        user: { id: '1', name: 'Test User', avatar: '/test-avatar.jpg' },
        token: 'test-token'
      },
      wallet: { balancePaise: 5000, loading: false, error: null },
    });

    render(
      <Provider store={store}>
        <Header />
      </Provider>
    );

    // Should show ₹50 (5000 paise = ₹50)
    expect(screen.getByTestId('wallet-badge')).toHaveTextContent('₹50');
  });

  test('wallet badge is clickable and navigates to wallet page', () => {
    const store = createMockStore({
      user: {
        user: { id: '1', name: 'Test User', avatar: '/test-avatar.jpg' },
        token: 'test-token'
      },
      wallet: { balancePaise: 5000, loading: false, error: null },
    });

    render(
      <Provider store={store}>
        <Header />
      </Provider>
    );

    const walletBadge = screen.getByTestId('wallet-badge');
    fireEvent.click(walletBadge);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/wallet');
  });

  test('wallet badge shows red and blinks when balance is low', () => {
    const store = createMockStore({
      user: {
        user: { id: '1', name: 'Test User', avatar: '/test-avatar.jpg' },
        token: 'test-token'
      },
      wallet: { balancePaise: 1500, loading: false, error: null }, // ₹15 - low balance
    });

    render(
      <Provider store={store}>
        <Header />
      </Provider>
    );

    const walletBadge = screen.getByTestId('wallet-badge');
    expect(walletBadge).toHaveTextContent('₹15');

    // Check for red background and pulse animation classes
    expect(walletBadge).toHaveClass('animate-pulse');
    expect(walletBadge).toHaveClass('bg-red-500');
  });

  test('wallet badge shows green when balance is sufficient', () => {
    const store = createMockStore({
      user: {
        user: { id: '1', name: 'Test User', avatar: '/test-avatar.jpg' },
        token: 'test-token'
      },
      wallet: { balancePaise: 5000, loading: false, error: null }, // ₹50 - sufficient balance
    });

    render(
      <Provider store={store}>
        <Header />
      </Provider>
    );

    const walletBadge = screen.getByTestId('wallet-badge');
    expect(walletBadge).toHaveTextContent('₹50');

    // Check for green background
    expect(walletBadge).toHaveClass('bg-green-100');
    expect(walletBadge).not.toHaveClass('animate-pulse');
  });

  test('does not show wallet badge when user is not authenticated', () => {
    const store = createMockStore({
      user: { user: null, token: null },
      wallet: { balancePaise: 0, loading: false, error: null },
    });

    render(
      <Provider store={store}>
        <Header />
      </Provider>
    );

    // Should show Sign In button instead
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.queryByTestId('wallet-badge')).not.toBeInTheDocument();
  });

  test('shows wallet link in mobile menu when authenticated', () => {
    const store = createMockStore({
      user: {
        user: { id: '1', name: 'Test User', avatar: '/test-avatar.jpg' },
        token: 'test-token'
      },
      wallet: { balancePaise: 3000, loading: false, error: null },
    });

    render(
      <Provider store={store}>
        <Header />
      </Provider>
    );

    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: /toggle mobile menu/i });
    fireEvent.click(menuButton);

    // Check for wallet link in mobile menu
    expect(screen.getByText('Wallet - ₹30')).toBeInTheDocument();
  });
});