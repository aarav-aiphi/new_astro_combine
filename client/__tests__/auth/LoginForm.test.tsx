import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '../../redux/store';
import LoginForm from '../../app/auth/login/page';
import * as authHelpers from '../../lib/authHelpers';

// Mock the authHelpers module
jest.mock('../../lib/authHelpers', () => ({
  storeAuth: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => '/'),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUser = {
  _id: '123',
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  avatar: '',
  role: 'User' as const,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  __v: 0,
  sessionsCompleted: 3,
};

const renderWithProviders = (ui: React.ReactElement) => {
  const store = setupStore();
  return render(
    <Provider store={store}>
      {ui}
    </Provider>
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles successful login with sessionsCompleted', async () => {
    const mockResponse = {
      user: mockUser,
      token: 'mock-token-123',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithProviders(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        credentials: 'include',
      });
    });

    expect(authHelpers.storeAuth).toHaveBeenCalledWith('mock-token-123');
  });

  it('handles login error correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(<LoginForm />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Login failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
}); 