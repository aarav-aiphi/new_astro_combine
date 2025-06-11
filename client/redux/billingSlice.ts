import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
interface BillingSession {
  sessionId: string;
  astrologerId: string;
  astrologerName?: string;
  sessionType: 'chat' | 'call';
  ratePaisePerMin: number;
  secondsElapsed: number;
  currentCostPaise: number;
  isLive: boolean;
  startedAt: string;
  endedAt?: string;
}

interface BillingTick {
  sessionId: string;
  secondsElapsed: number;
  balancePaise: number;
  deductedPaise: number;
}

interface Receipt {
  sessionId: string;
  astrologer: any;
  sessionType: string;
  ratePaisePerMin: number;
  durationSeconds: number;
  durationMinutes: number;
  totalCostPaise: number;
  isLive: boolean;
  startedAt: string;
  endedAt?: string;
  costBreakdown: {
    ratePerMinute: string;
    totalMinutes: number;
    totalCost: string;
  };
}

interface BillingState {
  activeSession: BillingSession | null;
  lastTick: BillingTick | null;
  receipt: Receipt | null;
  loading: boolean;
  error: string | null;
  // Real-time display
  timeElapsed: string;
  amountSpent: string;
}

// Initial state
const initialState: BillingState = {
  activeSession: null,
  lastTick: null,
  receipt: null,
  loading: false,
  error: null,
  timeElapsed: '00:00',
  amountSpent: '₹0.00',
};

// Helper function to format time
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to format amount
const formatAmount = (paise: number): string => {
  return `₹${(paise / 100).toFixed(2)}`;
};

// Async thunks
export const fetchActiveSession = createAsyncThunk(
  'billing/fetchActiveSession',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get('/api/v1/billing/active', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No active session
      }
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch active session'
      );
    }
  }
);

export const fetchSessionReceipt = createAsyncThunk(
  'billing/fetchSessionReceipt',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`/api/v1/billing/session/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data.receipt;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch receipt'
      );
    }
  }
);

// Slice
const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setActiveSession: (state, action: PayloadAction<BillingSession>) => {
      state.activeSession = action.payload;
      state.timeElapsed = formatTime(action.payload.secondsElapsed);
      state.amountSpent = formatAmount(action.payload.currentCostPaise);
    },
    
    clearActiveSession: (state) => {
      state.activeSession = null;
      state.lastTick = null;
      state.timeElapsed = '00:00';
      state.amountSpent = '₹0.00';
    },
    
    processBillingTick: (state, action: PayloadAction<BillingTick>) => {
      const tick = action.payload;
      state.lastTick = tick;
      
      if (state.activeSession && state.activeSession.sessionId === tick.sessionId) {
        state.activeSession.secondsElapsed = tick.secondsElapsed;
        state.activeSession.currentCostPaise += tick.deductedPaise;
        
        // Update display strings
        state.timeElapsed = formatTime(tick.secondsElapsed);
        state.amountSpent = formatAmount(state.activeSession.currentCostPaise);
      }
    },
    
    sessionEnded: (state, action: PayloadAction<{ sessionId: string; totalCostPaise: number; reason: string }>) => {
      if (state.activeSession && state.activeSession.sessionId === action.payload.sessionId) {
        state.activeSession.isLive = false;
        state.activeSession.currentCostPaise = action.payload.totalCostPaise;
        state.amountSpent = formatAmount(action.payload.totalCostPaise);
      }
    },
    
    clearBillingError: (state) => {
      state.error = null;
    },
    
    clearReceipt: (state) => {
      state.receipt = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch active session
    builder
      .addCase(fetchActiveSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveSession.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.activeSession = {
            sessionId: action.payload.sessionId,
            astrologerId: action.payload.astrologerId,
            sessionType: action.payload.sessionType,
            ratePaisePerMin: action.payload.ratePaisePerMin,
            secondsElapsed: action.payload.durationSeconds,
            currentCostPaise: action.payload.currentCostPaise,
            isLive: action.payload.isLive,
            startedAt: action.payload.startedAt,
          };
          state.timeElapsed = formatTime(action.payload.durationSeconds);
          state.amountSpent = formatAmount(action.payload.currentCostPaise);
        } else {
          state.activeSession = null;
        }
      })
      .addCase(fetchActiveSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch session receipt
      .addCase(fetchSessionReceipt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessionReceipt.fulfilled, (state, action) => {
        state.loading = false;
        state.receipt = action.payload;
      })
      .addCase(fetchSessionReceipt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setActiveSession,
  clearActiveSession,
  processBillingTick,
  sessionEnded,
  clearBillingError,
  clearReceipt,
} = billingSlice.actions;

// Selectors
export const selectActiveSession = (s: { billing?: BillingState }) =>
  s.billing?.activeSession ?? null;
export const selectLastTick = (s: { billing?: BillingState }) =>
  s.billing?.lastTick ?? null;
export const selectReceipt = (s: { billing?: BillingState }) =>
  s.billing?.receipt ?? null;
export const selectBillingLoading = (s: { billing?: BillingState }) =>
  s.billing?.loading ?? false;
export const selectBillingError = (s: { billing?: BillingState }) =>
  s.billing?.error ?? null;
export const selectTimeElapsed = (s: { billing?: BillingState }) =>
  s.billing?.timeElapsed ?? '00:00';
export const selectAmountSpent = (s: { billing?: BillingState }) =>
  s.billing?.amountSpent ?? '₹0.00';

export type { BillingState, BillingSession, BillingTick, Receipt };
export { initialState };
export default billingSlice.reducer; 