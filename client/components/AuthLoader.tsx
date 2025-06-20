"use client";

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCurrentUser, isAuthenticated, selectUser, selectLoading, setUser, setToken } from '@/redux/userSlice';
import { fetchActiveSession } from '@/redux/billingSlice';
import { fetchWallet } from '@/redux/walletSlice';

const AuthLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const authLoading = useAppSelector(selectLoading);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Restore user session and app state on load
    const restoreAppState = async () => {
      try {
        // Check if we have a token in localStorage first
        const hasToken = typeof window !== 'undefined' && localStorage.getItem('token');
        
        if (!hasToken) {
          setIsInitialized(true);
          return;
        }

        // Check if token is valid before making API calls
        const tokenValid = isAuthenticated();
        
        if (!tokenValid) {
          localStorage.removeItem('token');
          setIsInitialized(true);
          return;
        }

        // Fetch current user first
        try {
        await dispatch(fetchCurrentUser()).unwrap();
        } catch (userFetchError: any) {
          // If it's a network error, still allow the app to load
          if (userFetchError?.includes('Network connection failed') || 
              userFetchError?.includes('Failed to fetch')) {
            
            // Fallback: If we have a valid token, create a minimal user state
            const token = localStorage.getItem('token');
            if (token && isAuthenticated()) {
              try {
                // Decode the token to get user info
                const payload = JSON.parse(atob(token.split('.')[1]));
                
                // Create minimal user state from token
                const fallbackUser = {
                  _id: payload.id,
                  name: 'User', // Will be updated when API is available
                  username: 'user',
                  email: 'user@example.com',
                  avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
                  role: payload.role || 'User',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  __v: 0,
                  sessionsCompleted: 0
                };
                
                // Manually update Redux state
                dispatch(setUser(fallbackUser));
                dispatch(setToken(token));
                
                setInitError('Connected in offline mode. Some features may be limited.');
              } catch (tokenError) {
                localStorage.removeItem('token');
                setInitError('Authentication failed. Please log in again.');
              }
            } else {
              setInitError('Network connection issue. Some features may not work properly.');
            }
            
            setIsInitialized(true);
            return;
          }
          
          // For other errors (like invalid token), clean up and continue
          if (userFetchError?.includes('Token expired') || 
              userFetchError?.includes('Access token is missing')) {
            localStorage.removeItem('token');
          }
          
          throw userFetchError; // Re-throw other errors
        }
        
        // Then fetch wallet and active session in parallel
        const results = await Promise.allSettled([
          dispatch(fetchWallet()),
          dispatch(fetchActiveSession())
        ]);
        
        setInitError(null);
      } catch (error: any) {
        // Provide more user-friendly error messages
        let userFriendlyError = 'Failed to restore app state';
        if (error?.message?.includes('Network connection failed') || 
            error?.message?.includes('Failed to fetch')) {
          userFriendlyError = 'Network connection issue. Please check your internet connection.';
        } else if (error?.message?.includes('Token expired')) {
          userFriendlyError = 'Session expired. Please log in again.';
        }
        
        setInitError(userFriendlyError);
        // Don't throw - app should still load even if some restoration fails
      } finally {
        setIsInitialized(true);
      }
    };

    restoreAppState();
  }, [dispatch]);

  // Show loading spinner while initializing, but only for a short time
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          {initError && (
            <p className="text-red-500 text-sm mt-2">
              Error: {initError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthLoader;
