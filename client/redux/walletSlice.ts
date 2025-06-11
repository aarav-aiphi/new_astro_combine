import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

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

      const response = await axios.get('/api/v1/wallet/balance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wallet balance'
      );
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

      const response = await axios.post(
        '/api/v1/wallet/recharge',
        { amountPaise },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to recharge wallet'
      );
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

      const response = await axios.get('/api/v1/wallet/transactions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data.transactions;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch transactions'
      );
    }
  }
);

export const fetchPaginatedTransactions = createAsyncThunk(
  'wallet/fetchPaginatedTransactions',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`/api/v1/wallet/transactions?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        transactions: response.data.data.transactions,
        pagination: response.data.data.pagination
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch paginated transactions'
      );
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
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
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
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
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