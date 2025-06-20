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

// Async thunk for logging in
export const loginUser = createAsyncThunk(
  'user/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message);
      }

      const data: LoginResponse = await response.json();
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  }
);

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
      
      if (!token) {
        return rejectWithValue("No token found");
      }

      const isValid = isAuthenticated();
      
      if (!isValid) {
        localStorage.removeItem('token'); // Clean up invalid token
        return rejectWithValue("Token expired or invalid");
      }

      // Add retry logic for network issues
      let response;
      let lastError;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await fetch('/api/v1/users/profile', {
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
        throw new Error(error.message || "Failed to fetch profile");
      }

      const userData = await response.json();
      
      // Return both user data and token for Redux state restoration
      return {
        user: userData,
        token: token
      };
    } catch (err: any) {
      // Provide more helpful error messages
      let errorMessage = err.message;
      if (err.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try refreshing the page.';
      }
      
      return rejectWithValue(errorMessage);
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
    // ============== LOGIN THUNKS ==============
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

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
