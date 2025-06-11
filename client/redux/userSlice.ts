import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './types';
import { sessionEnded } from './billingSlice';

interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    _id: string;
    name: string;
    username: string;
    email: string;
    avatar: string;
    role: 'User' | 'Astrologer' | 'Admin';
    createdAt: string;
    updatedAt: string;
    __v: number;
    sessionsCompleted?: number;
  };
  token: string;
}

export interface UserState {
  user: {
    _id: string;
    name: string;
    username: string;
    email: string;
    avatar: string;
    role: 'User' | 'Astrologer' | 'Admin';
    createdAt: string;
    updatedAt: string;
    __v: number;
    sessionsCompleted?: number;
  } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

// 3) Async thunk for signing out
export const signoutUser = createAsyncThunk(
  'user/signout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/signout', { method: 'GET' });
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }

      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      return response.json();
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  }
);

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token'); 
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      console.log("🔍 fetchCurrentUser - token from localStorage:", token);
      
      if (!token) {
        console.log("🔍 fetchCurrentUser - no token found");
        return rejectWithValue("No token found");
      }

      const isValid = isAuthenticated();
      console.log("🔍 fetchCurrentUser - token valid:", isValid);
      
      if (!isValid) {
        console.log("🔍 fetchCurrentUser - token expired or invalid");
        localStorage.removeItem('token'); // Clean up invalid token
        return rejectWithValue("Token expired or invalid");
      }

      console.log("🔍 fetchCurrentUser - making API call to /api/v1/users/profile");
      const response = await fetch('/api/v1/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("🔍 fetchCurrentUser - API error:", error);
        throw new Error(error.message || "Failed to fetch profile");
      }

      const userData = await response.json();
      console.log("🔍 fetchCurrentUser - API success:", userData);
      
      // Return both user data and token for Redux state restoration
      return {
        user: userData,
        token: token
      };
    } catch (err: any) {
      console.error("🔍 fetchCurrentUser - error:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // For any synchronous reducers if needed
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    incrementSessionsCompleted: (state) => {
      if (state.user) {
        state.user.sessionsCompleted = (state.user.sessionsCompleted || 0) + 1;
      }
    },
  },
  extraReducers: (builder) => {
    // ============== SIGNOUT THUNKS ==============
    builder.addCase(signoutUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(signoutUser.fulfilled, (state) => {
      state.token = null;
      localStorage.removeItem('token');
    });
    builder.addCase(signoutUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Then handle in extraReducers
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.token = payload.token;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, { payload }) => {
        state.user = null;    // means not logged in or error
        state.token = null;
        state.loading = false;
        state.error = payload as string;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle session completion from billing
      .addCase(sessionEnded, (state) => {
        if (state.user) {
          state.user.sessionsCompleted = (state.user.sessionsCompleted || 0) + 1;
        }
      });
  },
});

export const { setUser, setToken, incrementSessionsCompleted } = userSlice.actions;

export const selectUser = (state: RootState) => state.user.user;
export const selectLoading = (state: RootState) => state.user.loading;
export const selectError = (state: RootState) => state.user.error;
export const selectToken = (state: RootState) => state.user.token;
export default userSlice.reducer;
