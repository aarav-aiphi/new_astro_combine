import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
interface Transaction {
  type: 'recharge' | 'debit' | 'credit';
  amountPaise: number;
  description: string;
  transactionId: string;
  timestamp: string;
}

interface WalletState {
  balancePaise: number;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  showRechargeModal: boolean;
}

// Initial state
const initialState: WalletState = {
  balancePaise: 0,
  transactions: [],
  loading: false,
  error: null,
  showRechargeModal: false,
};

// Async thunks
export const fetchWallet = createAsyncThunk(
  'wallet/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Add retry logic for network issues
      let response;
      let lastError;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await fetch('/api/v1/wallet/balance', {
            method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            cache: 'no-cache'
          });
          
          break; // Success, exit retry loop
          
        } catch (fetchError: any) {
          lastError = fetchError;
          
          // If it's a Chrome extension interference, try alternative approach
          if (fetchError.message?.includes('Failed to fetch') && attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, attempt * 500));
            continue;
          }
          
          // If all attempts failed
          if (attempt === 3) {
            throw lastError;
          }
        }
      }

      if (!response) {
        throw new Error('All fetch attempts failed');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch wallet balance");
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const rechargeWallet = createAsyncThunk(
  'wallet/rechargeWallet',
  async (amountPaise: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Add retry logic for network issues
      let response;
      let lastError;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await fetch('/api/v1/wallet/recharge', {
            method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            cache: 'no-cache',
            body: JSON.stringify({ amountPaise })
          });
          
          break; // Success, exit retry loop
          
        } catch (fetchError: any) {
          lastError = fetchError;
          
          // If it's a Chrome extension interference, try alternative approach
          if (fetchError.message?.includes('Failed to fetch') && attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, attempt * 500));
            continue;
          }
          
          // If all attempts failed
          if (attempt === 3) {
            throw lastError;
          }
        }
      }

      if (!response) {
        throw new Error('All fetch attempts failed');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to recharge wallet");
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Add retry logic for network issues
      let response;
      let lastError;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await fetch('/api/v1/wallet/transactions', {
            method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            cache: 'no-cache'
          });
          
          break; // Success, exit retry loop
          
        } catch (fetchError: any) {
          lastError = fetchError;
          
          // If it's a Chrome extension interference, try alternative approach
          if (fetchError.message?.includes('Failed to fetch') && attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, attempt * 500));
            continue;
          }
          
          // If all attempts failed
          if (attempt === 3) {
            throw lastError;
          }
        }
      }

      if (!response) {
        throw new Error('All fetch attempts failed');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch transactions");
      }

      const data = await response.json();
      return data.data.transactions;
    } catch (error: any) {
      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Slice
const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
    openRechargeModal: (state) => {
      state.showRechargeModal = true;
    },
    closeRechargeModal: (state) => {
      state.showRechargeModal = false;
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      state.balancePaise = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch wallet balance
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action: PayloadAction<{ balancePaise: number }>) => {
        state.loading = false;
        state.balancePaise = action.payload.balancePaise;
        state.error = null;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Don't reset balance to 0 on network errors - keep existing value
      })
      
      // Recharge wallet
      .addCase(rechargeWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rechargeWallet.fulfilled, (state, action: PayloadAction<{ balancePaise: number; transaction: Transaction }>) => {
        state.loading = false;
        state.balancePaise = action.payload.balancePaise;
        state.transactions.unshift(action.payload.transaction);
        state.error = null;
      })
      .addCase(rechargeWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
        state.loading = false;
        state.transactions = action.payload;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Keep existing transactions on error
      });
  },
});

export const { clearWalletError, openRechargeModal, closeRechargeModal, updateBalance } = walletSlice.actions;

// Selectors
export const selectWalletBalance = (state: { wallet: WalletState }) => state.wallet.balancePaise;
export const selectWalletTransactions = (state: { wallet: WalletState }) => state.wallet.transactions;
export const selectWalletLoading = (state: { wallet: WalletState }) => state.wallet.loading;
export const selectWalletError = (state: { wallet: WalletState }) => state.wallet.error;
export const selectShowRechargeModal = (state: { wallet: WalletState }) => state.wallet.showRechargeModal;

// RootState selector for balance
export const selectBalancePaise = (state: any) => state.wallet.balancePaise ?? 0;

export type { WalletState, Transaction };
export default walletSlice.reducer; 