import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Types
interface BillingSession {
  sessionId: string;
  userId?: string;
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
  // UI state
  isJoiningSession: boolean;
  isEndingSession: boolean;
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
  isJoiningSession: false,
  isEndingSession: false,
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
      state.isJoiningSession = false;
    },
    
    clearActiveSession: (state) => {
      state.activeSession = null;
      state.lastTick = null;
      state.timeElapsed = '00:00';
      state.amountSpent = '₹0.00';
      state.isJoiningSession = false;
      state.isEndingSession = false;
    },
    
    processBillingTick: (state, action: PayloadAction<BillingTick>) => {
      const tick = action.payload;
      state.lastTick = tick;
      
      if (state.activeSession && state.activeSession.sessionId === tick.sessionId) {
        // Update elapsed time
        state.activeSession.secondsElapsed = tick.secondsElapsed;
        
        // Calculate total cost based on elapsed time and rate (like server does)
        const minutesElapsed = tick.secondsElapsed / 60;
        const totalCostPaise = Math.ceil(minutesElapsed * state.activeSession.ratePaisePerMin);
        state.activeSession.currentCostPaise = totalCostPaise;
        
        // Update display strings
        state.timeElapsed = formatTime(tick.secondsElapsed);
        state.amountSpent = formatAmount(totalCostPaise);
      }
    },
    
    sessionEnded: (state, action: PayloadAction<{ sessionId: string; totalCostPaise: number; reason: string }>) => {
      if (state.activeSession && state.activeSession.sessionId === action.payload.sessionId) {
        state.activeSession.isLive = false;
        state.activeSession.currentCostPaise = action.payload.totalCostPaise;
        state.amountSpent = formatAmount(action.payload.totalCostPaise);
      }
      state.isEndingSession = false;
    },
    
    // New actions for Phase 2
    consultStarted: (state, action: PayloadAction<{
      sessionId: string;
      userId: string;
      astrologerId: string;
      sessionType: 'chat' | 'call';
      ratePaisePerMin: number;
      astrologerName?: string;
    }>) => {
      const payload = action.payload;
      state.activeSession = {
        sessionId: payload.sessionId,
        userId: payload.userId,
        astrologerId: payload.astrologerId,
        astrologerName: payload.astrologerName,
        sessionType: payload.sessionType,
        ratePaisePerMin: payload.ratePaisePerMin,
        secondsElapsed: 0,
        currentCostPaise: 0,
        isLive: true,
        startedAt: new Date().toISOString(),
      };
      state.timeElapsed = '00:00';
      state.amountSpent = '₹0.00';
      state.isJoiningSession = false;
    },
    
    sessionAlreadyActive: (state, action: PayloadAction<{
      sessionId: string;
      userId: string;
      astrologerId: string;
      sessionType: 'chat' | 'call';
      ratePaisePerMin: number;
      astrologerName?: string;
    }>) => {
      const payload = action.payload;
      // If we don't have an active session in Redux, create one
      if (!state.activeSession) {
        state.activeSession = {
          sessionId: payload.sessionId,
          userId: payload.userId,
          astrologerId: payload.astrologerId,
          astrologerName: payload.astrologerName,
          sessionType: payload.sessionType,
          ratePaisePerMin: payload.ratePaisePerMin,
          secondsElapsed: 0,
          currentCostPaise: 0,
          isLive: true,
          startedAt: new Date().toISOString(),
        };
        state.timeElapsed = '00:00';
        state.amountSpent = '₹0.00';
      }
      state.isJoiningSession = false;
    },
    
    consultEnded: (state, action: PayloadAction<{
      sessionId: string;
      reason: string;
      timestamp: string;
      totalCostPaise?: number;
      finalSettlementPaise?: number;
      unbilledSeconds?: number;
      actualSecondsElapsed?: number;
    }>) => {
      if (state.activeSession && state.activeSession.sessionId === action.payload.sessionId) {
        state.activeSession.isLive = false;
        state.activeSession.endedAt = action.payload.timestamp;
        
        // Update with final settlement data
        if (action.payload.totalCostPaise !== undefined) {
          state.activeSession.currentCostPaise = action.payload.totalCostPaise;
          state.amountSpent = formatAmount(action.payload.totalCostPaise);
        }
        
        // Update with actual elapsed time if provided
        if (action.payload.actualSecondsElapsed !== undefined) {
          state.activeSession.secondsElapsed = action.payload.actualSecondsElapsed;
          state.timeElapsed = formatTime(action.payload.actualSecondsElapsed);
        }
        
        console.log('💰 Session ended with final settlement:', {
          sessionId: action.payload.sessionId,
          totalCostPaise: action.payload.totalCostPaise,
          finalSettlementPaise: action.payload.finalSettlementPaise,
          unbilledSeconds: action.payload.unbilledSeconds,
          actualSecondsElapsed: action.payload.actualSecondsElapsed
        });
      }
      state.isEndingSession = false;
    },
    
    setJoiningSession: (state, action: PayloadAction<boolean>) => {
      state.isJoiningSession = action.payload;
    },
    
    setEndingSession: (state, action: PayloadAction<boolean>) => {
      state.isEndingSession = action.payload;
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
            astrologerId: action.payload.astrologer,
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
          state.timeElapsed = '00:00';
          state.amountSpent = '₹0.00';
        }
      })
      .addCase(fetchActiveSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.activeSession = null;
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
  consultStarted,
  sessionAlreadyActive,
  consultEnded,
  setJoiningSession,
  setEndingSession,
  clearBillingError,
  clearReceipt,
} = billingSlice.actions;

export default billingSlice.reducer;

// Selectors
export const selectActiveSession = (state: { billing: BillingState }) =>
  state.billing.activeSession;

export const selectLastTick = (state: { billing: BillingState }) =>
  state.billing.lastTick;

export const selectReceipt = (state: { billing: BillingState }) =>
  state.billing.receipt;

export const selectBillingLoading = (state: { billing: BillingState }) =>
  state.billing.loading;

export const selectBillingError = (state: { billing: BillingState }) =>
  state.billing.error;

export const selectTimeElapsed = (state: { billing: BillingState }) =>
  state.billing.timeElapsed;

export const selectAmountSpent = (state: { billing: BillingState }) =>
  state.billing.amountSpent;

export const selectIsJoiningSession = (state: { billing: BillingState }) =>
  state.billing.isJoiningSession;

export const selectIsEndingSession = (state: { billing: BillingState }) =>
  state.billing.isEndingSession;

export type { BillingState, BillingSession, BillingTick, Receipt };
export { initialState };