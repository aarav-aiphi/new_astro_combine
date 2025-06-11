import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChatUI from '@/app/chat-with-astrologer/chat/ChatUI';
import BillingDisplay from '@/components/BillingDisplay';
import BalanceChip from '@/components/ui/BalanceChip';
import walletReducer from '@/redux/walletSlice';
import billingReducer from '@/redux/billingSlice';
import chatUIReducer from '@/redux/chatSlice';
import userReducer from '@/redux/userSlice';
import { Socket } from 'socket.io-client';

// Mock socket
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  id: 'mock-socket-id'
} as unknown as Socket;

// Mock user data
const mockUser = {
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'User',
  sessionsCompleted: 1,
  avatar: '/avatar.jpg'
};

// Initial store state
const initialState = {
  wallet: {
    balancePaise: 5000, // ₹50
    transactions: [],
    loading: false,
    error: null,
    showRechargeModal: false
  },
  billing: {
    activeSession: {
      sessionId: 'session123',
      astrologerId: 'astro123',
      sessionType: 'chat' as const,
      ratePaisePerMin: 2000, // ₹20/min
      secondsElapsed: 60,
      currentCostPaise: 2000,
      isLive: true,
      startedAt: new Date().toISOString()
    },
    lastTick: null,
    receipt: null,
    showLowBalanceWarning: false,
    loading: false,
    error: null,
    timeElapsed: '01:00',
    amountSpent: '₹20.00'
  },
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
      graceTimeSeconds: 30
    }
  },
  user: {
    user: mockUser,
    loading: false,
    error: null,
    token: 'mock-token'
  }
};

const createTestStore = (preloadedState = initialState) => {
  return configureStore({
    reducer: {
      wallet: walletReducer,
      billing: billingReducer,
      chatUI: chatUIReducer,
      user: userReducer
    },
    preloadedState
  });
};

describe('Chat Balance Flow E2E Test', () => {
  let store: ReturnType<typeof createTestStore>;
  
  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('billing tick updates balance chip and billing display', async () => {
    render(
      <Provider store={store}>
        <div className="relative">
          <BalanceChip />
          <BillingDisplay socket={mockSocket} />
        </div>
      </Provider>
    );

    // Check initial balance display
    expect(screen.getByText('₹50')).toBeInTheDocument();
    expect(screen.getByText('₹20.00')).toBeInTheDocument();

    // Simulate billing:tick event
    const tickData = {
      sessionId: 'session123',
      userId: 'user123',
      astrologerId: 'astro123',
      secondsElapsed: 75,
      balancePaise: 4000, // ₹40 (reduced by ₹10)
      deductedPaise: 1000 // ₹10 deducted
    };

    // Find and simulate the billing tick handler
    const billingTickHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'billing:tick'
    )?.[1];

    if (billingTickHandler) {
      act(() => {
        billingTickHandler(tickData);
      });
    }

    // Wait for state updates and re-render
    await waitFor(() => {
      expect(screen.getByText('₹40')).toBeInTheDocument();
    });
  });

  test('low balance warning triggers grace period countdown and ends consultation', async () => {
    render(
      <Provider store={store}>
        <ChatUI
          socket={mockSocket}
          selectedChatId="chat123"
          user={mockUser}
        />
      </Provider>
    );

    // Simulate low balance warning
    const lowBalanceData = {
      sessionId: 'session123',
      balancePaise: 500, // ₹5
      requiredPaise: 2000, // ₹20
      message: 'Insufficient balance for next billing cycle',
      graceTimeSeconds: 5 // 5 seconds for testing
    };

    // Find and simulate the low balance handler
    const lowBalanceHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'billing:low-balance'
    )?.[1];

    if (lowBalanceHandler) {
      act(() => {
        lowBalanceHandler(lowBalanceData);
      });
    }

    // Check that low balance warning is displayed
    await waitFor(() => {
      expect(screen.getByText('⚠️ Low Balance Warning')).toBeInTheDocument();
      expect(screen.getByText('Insufficient balance for next billing cycle')).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return content.includes('Grace time') && content.includes('5') && content.includes('s');
      })).toBeInTheDocument();
    });

    // Fast-forward timers to simulate countdown
    act(() => {
      jest.advanceTimersByTime(5000); // 5 seconds
    });

    // Check that consult:end was emitted with timeout reason
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('consult:end', {
        sessionId: 'session123',
        reason: 'insufficient_balance_timeout'
      });
    });
  });

  test('balance chip pulses red when balance is low', async () => {
    // Create store with low balance
    const lowBalanceStore = createTestStore({
      ...initialState,
      wallet: {
        ...initialState.wallet,
        balancePaise: 1000 // ₹10 - less than ratePaisePerMin (₹20)
      }
    });

    render(
      <Provider store={lowBalanceStore}>
        <BalanceChip />
      </Provider>
    );

    // Check that balance chip has red gradient and pulse animation
    const balanceButton = screen.getByRole('button');
    expect(balanceButton).toHaveClass('animate-pulse');
    expect(balanceButton).toHaveClass('from-red-500');
    expect(balanceButton).toHaveClass('to-pink-500');
  });

  test('balance chip shows green when balance is sufficient', async () => {
    render(
      <Provider store={store}>
        <BalanceChip />
      </Provider>
    );

    // Check that balance chip has green gradient and no pulse
    const balanceButton = screen.getByRole('button');
    expect(balanceButton).not.toHaveClass('animate-pulse');
    expect(balanceButton).toHaveClass('from-green-500');
    expect(balanceButton).toHaveClass('to-emerald-500');
  });

  test.skip('grace period countdown decrements correctly', async () => {
    render(
      <Provider store={store}>
        <ChatUI
          socket={mockSocket}
          selectedChatId="chat123"
          user={mockUser}
        />
      </Provider>
    );

    // Simulate low balance warning with 30 second grace period
    const lowBalanceData = {
      sessionId: 'session123',
      balancePaise: 500,
      requiredPaise: 2000,
      message: 'Low balance warning',
      graceTimeSeconds: 30
    };

    const lowBalanceHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'billing:low-balance'
    )?.[1];

    if (lowBalanceHandler) {
      act(() => {
        lowBalanceHandler(lowBalanceData);
      });
    }

    // Check initial countdown
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return content.includes('Grace time') && content.includes('30') && content.includes('s');
      })).toBeInTheDocument();
    });

    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Check countdown decremented
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return content.includes('Grace time') && content.includes('29') && content.includes('s');
      })).toBeInTheDocument();
    });

    // Advance timer by 29 more seconds (total 30)
    act(() => {
      jest.advanceTimersByTime(29000);
    });

    // Check that session ended
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('consult:end', {
        sessionId: 'session123',
        reason: 'insufficient_balance_timeout'
      });
    });
  });

  test('chat input is disabled during low balance grace period', async () => {
    // Create store with chat disabled state
    const disabledChatStore = createTestStore({
      ...initialState,
      chatUI: {
        ...initialState.chatUI,
        chatDisabled: true,
        lowBalanceWarning: {
          active: true,
          sessionId: 'session123',
          balancePaise: 500,
          requiredPaise: 2000,
          message: 'Low balance',
          graceTimeSeconds: 30
        }
      }
    });

    render(
      <Provider store={disabledChatStore}>
        <ChatUI
          socket={mockSocket}
          selectedChatId="chat123"
          user={mockUser}
        />
      </Provider>
    );

    // Check that input is disabled
    const chatInput = screen.getByPlaceholderText(/Chat disabled - Please recharge to continue/);
    expect(chatInput).toBeDisabled();

    // Check that send button is disabled
    const sendButton = screen.getByLabelText('Send');
    expect(sendButton).toBeDisabled();
  });
}); 