import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '../../redux/store';
import SignupUserForm from '../../app/auth/signup/user/page';
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
}));

// Mock fetch
global.fetch = jest.fn();

const mockUser = {
  _id: '123',
  name: 'John Doe',
  username: 'johndoe123456789',
  email: 'john@example.com',
  avatar: '',
  role: 'User' as const,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  __v: 0,
  sessionsCompleted: 0,
};

const renderWithProviders = (ui: React.ReactElement) => {
  const store = setupStore();
  return render(
    <Provider store={store}>
      {ui}
    </Provider>
  );
};

describe('SignupUserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now for consistent username generation
    jest.spyOn(Date, 'now').mockReturnValue(123456789);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders signup form correctly', () => {
    renderWithProviders(<SignupUserForm />);
    
    expect(screen.getByLabelText('First name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('generates username correctly and calls API', async () => {
    const mockResponse = {
      user: mockUser,
      token: 'mock-token-123',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderWithProviders(<SignupUserForm />);
    
    const firstNameInput = screen.getByLabelText('First name');
    const lastNameInput = screen.getByLabelText('Last name');
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          username: 'johndoe123456789', // auto-generated lowercase
          email: 'john@example.com',
          password: 'password123',
          role: 'User',
        }),
        credentials: 'include',
      });
    });

    expect(authHelpers.storeAuth).toHaveBeenCalledWith('mock-token-123');
  });

  it('validates form fields correctly', async () => {
    renderWithProviders(<SignupUserForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    // Since the form has client-side validation that prevents submission,
    // we just need to verify that fetch was not called
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('handles signup error correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Email already exists' }),
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(<SignupUserForm />);
    
    const firstNameInput = screen.getByLabelText('First name');
    const lastNameInput = screen.getByLabelText('Last name');
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('❌ User signup error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
}); 