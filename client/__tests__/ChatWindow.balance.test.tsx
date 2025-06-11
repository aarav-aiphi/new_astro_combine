import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChatUI from '@/app/chat-with-astrologer/chat/ChatUI';
import userReducer from '@/redux/userSlice';
import chatReducer from '@/redux/chatSlice';
import walletReducer from '@/redux/walletSlice';
import { Socket } from 'socket.io-client';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  id: 'test-socket-id',
} as unknown as Socket;

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      user: userReducer,
      chatUI: chatReducer,
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
        balancePaise: 5000, // ₹50
        loading: false,
        error: null,
        showRechargeModal: false,
        transactions: [],
      },
      ...initialState,
    },
  });
};

const defaultProps = {
  socket: mockSocket,
  selectedChatId: 'chat123',
  user: {
    _id: 'user1',
    userId: 'user1',
    status: 'online' as const,
    name: 'Test User',
    email: 'test@example.com',
    role: 'User',
  },
};

describe('ChatUI Balance Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch for chat messages
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        messages: []
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render input as enabled when chat is not disabled', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <ChatUI {...defaultProps} />
      </Provider>
    );

    const input = screen.getByPlaceholderText('Type a message...');
    expect(input).not.toBeDisabled();
    expect(input).not.toHaveClass('cursor-not-allowed');
  });

  it('should disable input when chat is disabled', () => {
    const store = createTestStore({
      chatUI: {
        connectingAstrologer: null,
        onlineUsers: [],
        typingStatus: {},
        summaries: {},
        unreadCounts: {},
        chatDisabled: true,
        lowBalanceWarning: {
          active: true,
          sessionId: 'session123',
          balancePaise: 30,
          requiredPaise: 50,
          message: 'Insufficient balance to continue.',
          graceTimeSeconds: 30,
        },
      },
    });

    render(
      <Provider store={store}>
        <ChatUI {...defaultProps} />
      </Provider>
    );

    const input = screen.getByPlaceholderText('Chat disabled - Please recharge to continue...');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('cursor-not-allowed');
  });

  it('should display low balance warning banner when active', () => {
    const store = createTestStore({
      chatUI: {
        connectingAstrologer: null,
        onlineUsers: [],
        typingStatus: {},
        summaries: {},
        unreadCounts: {},
        chatDisabled: true,
        lowBalanceWarning: {
          active: true,
          sessionId: 'session123',
          balancePaise: 30,
          requiredPaise: 50,
          message: 'Insufficient balance to continue.',
          graceTimeSeconds: 30,
        },
      },
    });

    render(
      <Provider store={store}>
        <ChatUI {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('⚠️ Low Balance Warning')).toBeInTheDocument();
    expect(screen.getByText('Insufficient balance to continue.')).toBeInTheDocument();
  });
}); 