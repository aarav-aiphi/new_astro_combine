"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { selectUser, fetchCurrentUser, isAuthenticated } from '@/redux/userSlice';
import { fetchFilterOptions } from '@/redux/filterOptionsSlice';

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const user = useAppSelector(selectUser);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔐 ChatLayout: Checking authentication...");
      
      // Check if user has valid token in localStorage
      const hasValidToken = isAuthenticated();
      console.log("🔐 ChatLayout: Has valid token:", hasValidToken);
      
      if (!hasValidToken) {
        console.log("🔐 ChatLayout: No valid token, redirecting to login");
        router.push('/auth/login?redirectUrl=' + encodeURIComponent(window.location.pathname));
        return;
      }

      // If token exists but no user in Redux, fetch current user
      if (!user) {
        console.log("🔐 ChatLayout: Token exists but no user, fetching current user");
        try {
          await dispatch(fetchCurrentUser()).unwrap();
          console.log("🔐 ChatLayout: Successfully fetched user");
        } catch (error) {
          console.error("🔐 ChatLayout: Failed to fetch user:", error);
          router.push('/auth/login?redirectUrl=' + encodeURIComponent(window.location.pathname));
          return;
        }
      }
      
      setAuthChecked(true);
    };

    checkAuth();
  }, [dispatch, user, router]);

  // Fetch filter options when component mounts
  useEffect(() => {
    dispatch(fetchFilterOptions());
  }, [dispatch]);

  // Show loading while checking authentication
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Show loading if we don't have user data yet
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  console.log("🔐 ChatLayout: Authentication successful, rendering children");
  return <>{children}</>;
}
