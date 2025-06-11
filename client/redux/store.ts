import { configureStore, Reducer, AnyAction } from '@reduxjs/toolkit';
import userReducer from '@/redux/userSlice';
import chatUIReducer from './chatSlice';
import astrologerFilterReducer from './astrologerFilterSlice';
import filterOptionsReducer from './filterOptionsSlice';
import walletReducer from './walletSlice';
import billingReducer from './billingSlice';
import type { UserState } from './userSlice';
import type { ChatUIState } from './chatSlice';
import type { AstrologerFilterState } from './astrologerFilterSlice';
import type { FilterOptionsState } from './filterOptionsSlice';
import type { WalletState } from './walletSlice';
import type { BillingState } from './billingSlice';

export interface RootState {
  user: UserState;
  chatUI: ChatUIState;
  astrologerFilters: AstrologerFilterState;
  filterOptions: FilterOptionsState;
  wallet: WalletState;
  billing: BillingState;
}

// Create a more specific type for the reducer that includes undefined state
type ReducerWithUndefined<S> = Reducer<S, AnyAction, S | undefined>;

// Define the reducers with proper typing
const reducers = {
  user: userReducer as ReducerWithUndefined<UserState>,
  chatUI: chatUIReducer as ReducerWithUndefined<ChatUIState>,
  astrologerFilters: astrologerFilterReducer as ReducerWithUndefined<AstrologerFilterState>,
  filterOptions: filterOptionsReducer as ReducerWithUndefined<FilterOptionsState>,
  wallet: walletReducer as ReducerWithUndefined<WalletState>,
  billing: billingReducer as ReducerWithUndefined<BillingState>
};

export const setupStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: reducers,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST']
        }
      })
  });
};

// Create initial state
const initialState: Partial<RootState> = {
  user: {
    user: null,
    token: null, // Always null initially, AuthLoader will restore from localStorage
    loading: false,
    error: null,
  }
};

export const store = setupStore(initialState);

export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];