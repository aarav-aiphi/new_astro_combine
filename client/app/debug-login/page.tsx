"use client";
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { loginUser, selectLoading, selectError, selectUser, selectToken } from "@/redux/userSlice";
import { store } from "@/redux/store";

export default function DebugLoginPage() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  const user = useAppSelector(selectUser);
  const token = useAppSelector(selectToken);
  
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Add cookie debugging helper
  const checkCookies = () => {
    if (typeof document !== 'undefined') {
      const allCookies = document.cookie;
      const tokenCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      return {
        allCookies,
        tokenCookie,
        cookieLength: tokenCookie?.length || 0
      };
    }
    return { allCookies: 'N/A', tokenCookie: 'N/A', cookieLength: 0 };
  };

  const handleLogin = async (email: string, password: string) => {
    console.log("🔍 Starting login process for:", email);
    setDebugInfo({ step: "Starting login...", email });

    try {
      // Check cookies before login
      const cookiesBefore = checkCookies();
      console.log("🔍 Cookies before login:", cookiesBefore);

      // First, let's directly test the API call without Redux
      console.log("🔍 Making direct API call...");
      const directResponse = await fetch('/api/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      const directData = await directResponse.json();
      console.log("🔍 Direct API response:", directData);
      console.log("🔍 Direct API token:", directData.token);
      
      setDebugInfo((prev: any) => ({ 
        ...prev, 
        directApiResponse: directData,
        directApiToken: directData.token,
        cookiesBefore
      }));

      // Now test with Redux
      const resultAction = await dispatch(loginUser({ email, password }));
      
      console.log("🔍 Redux action result:", resultAction);
      setDebugInfo((prev: any) => ({ ...prev, reduxResult: resultAction }));

      if (loginUser.fulfilled.match(resultAction)) {
        console.log("✅ Login successful:", resultAction.payload);
        
        // Check what's in localStorage
        const tokenFromStorage = localStorage.getItem('token');
        console.log("🔍 Token in localStorage:", tokenFromStorage);
        
        // Check cookies after login
        setTimeout(() => {
          const cookiesAfter = checkCookies();
          console.log("🔍 Cookies after login:", cookiesAfter);
          
          const currentUser = selectUser(store.getState());
          const currentToken = selectToken(store.getState());
          console.log("🔍 Redux user after login:", currentUser);
          console.log("🔍 Redux token after login:", currentToken);
          
          setDebugInfo((prev: any) => ({
            ...prev,
            success: true,
            payload: resultAction.payload,
            tokenFromStorage,
            reduxUserAfter: currentUser,
            reduxTokenAfter: currentToken,
            cookiesAfter
          }));
        }, 500); // Increased timeout to ensure cookies are set
        
      } else {
        console.error("❌ Login failed:", resultAction.payload);
        setDebugInfo((prev: any) => ({ ...prev, error: resultAction.payload }));
      }
    } catch (err) {
      console.error("💥 Login error:", err);
      setDebugInfo((prev: any) => ({ ...prev, error: err }));
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Debug Login Page</h1>
      
      {/* Current Redux State */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Current Redux State</h2>
        <div className="text-sm space-y-2">
          <div><strong>User:</strong> {user ? `${user.name} (${user.role})` : "null"}</div>
          <div><strong>Token (Redux):</strong> {token ? `${token.substring(0, 20)}...` : "null"}</div>
          <div><strong>Token (localStorage):</strong> {typeof window !== 'undefined' ? 
            (localStorage.getItem('token') ? `${localStorage.getItem('token')?.substring(0, 20)}...` : 'null') : 'N/A'}</div>
          <div><strong>Current Cookies:</strong> {typeof window !== 'undefined' ? 
            (checkCookies().tokenCookie ? `${checkCookies().tokenCookie?.substring(0, 20)}...` : 'null') : 'N/A'}</div>
          <div><strong>All Cookies:</strong> {typeof window !== 'undefined' ? 
            (checkCookies().allCookies || 'none') : 'N/A'}</div>
          <div><strong>Loading:</strong> {loading.toString()}</div>
          <div><strong>Error:</strong> {error || "null"}</div>
        </div>
      </div>

      {/* Test Users Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Test User Login */}
        <div className="border p-6 rounded">
          <h2 className="text-xl font-semibold mb-4">Test User Login</h2>
          <button 
            onClick={() => handleLogin("testuser@example.com", "password123")}
            disabled={loading}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400 mb-2"
          >
            Login as User
          </button>
          <p className="text-sm text-gray-600">Email: testuser@example.com</p>
        </div>

        {/* Test Astrologer Login */}
        <div className="border p-6 rounded">
          <h2 className="text-xl font-semibold mb-4">Test Astrologer Login</h2>
          <button 
            onClick={() => handleLogin("testast@example.com", "password123")}
            disabled={loading}
            className="w-full bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400 mb-2"
          >
            Login as Astrologer
          </button>
          <p className="text-sm text-gray-600">Email: testast@example.com</p>
        </div>
      </div>

      {/* Custom Login Form */}
      <div className="border p-6 rounded mb-6">
        <h2 className="text-xl font-semibold mb-4">Custom Login</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input 
              type="email"
              className="w-full border p-2 rounded"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <input 
              type="password"
              className="w-full border p-2 rounded"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              placeholder="Enter password"
            />
          </div>
          <button 
            onClick={() => handleLogin(loginForm.email, loginForm.password)}
            disabled={loading || !loginForm.email || !loginForm.password}
            className="w-full bg-purple-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Custom Login"}
          </button>
        </div>
      </div>

      {/* Debug Information */}
      {debugInfo && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
          <pre className="text-xs overflow-auto bg-white p-2 rounded max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Test Navigation Buttons */}
      {user && (
        <div className="border p-6 rounded mt-6">
          <h2 className="text-xl font-semibold mb-4">Test Navigation & Chat</h2>
          <div className="space-y-4">
            <button 
              onClick={() => {
                console.log("🧪 Testing navigation to chat...");
                console.log("🧪 Current user:", user);
                console.log("🧪 Current token:", token);
                console.log("🧪 localStorage token:", localStorage.getItem('token'));
                window.location.href = '/chat-with-astrologer/chat';
              }}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              🧪 Test Navigate to Chat (as {user.role})
            </button>
            <button 
              onClick={() => {
                console.log("🧪 isAuthenticated result:", typeof window !== 'undefined' ? 
                  require('@/redux/userSlice').isAuthenticated() : 'N/A');
              }}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              🧪 Test isAuthenticated Function
            </button>
            
            {/* Chat Testing Buttons */}
            <button 
              onClick={async () => {
                try {
                  console.log("💬 Testing chat list fetch...");
                  const token = localStorage.getItem('token');
                  console.log("💬 Token from localStorage:", token);
                  console.log("💬 Token length:", token?.length);
                  console.log("💬 Current user role:", user.role);
                  
                  // Try to decode the token to see its contents
                  try {
                    if (token) {
                      const payload = JSON.parse(atob(token.split('.')[1]));
                      console.log("💬 Token payload:", payload);
                      console.log("💬 Token expiry:", new Date(payload.exp * 1000));
                      console.log("💬 Current time:", new Date());
                      console.log("💬 Token valid:", payload.exp > Date.now() / 1000);
                    } else {
                      console.log("💬 No token found in localStorage");
                    }
                  } catch (e) {
                    console.log("💬 Failed to decode token:", e);
                  }
                  
                  if (!token) {
                    console.log("💬 Cannot make API call - no token available");
                    return;
                  }
                  
                  const response = await fetch('/api/v1/chat/list', {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                  });
                  
                  console.log("💬 Response status:", response.status);
                  console.log("💬 Response headers:", Object.fromEntries(response.headers.entries()));
                  
                  const data = await response.json();
                  console.log("💬 Chat list response:", data);
                  
                  if (response.ok) {
                    console.log("💬 Number of chats:", data.length);
                  } else {
                    console.log("💬 API Error:", data.message);
                  }
                } catch (error) {
                  console.error("💬 Chat list error:", error);
                }
              }}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              💬 Test Chat List API (as {user.role}) [DEBUG]
            </button>
            
            {user.role === 'User' && (
              <button 
                onClick={async () => {
                  try {
                    console.log("💬 Testing chat initialization...");
                    const token = localStorage.getItem('token');
                    
                    // Test with the astrologer ID
                    const astrologerId = "6842b0a9d7c44a57347e1f50"; // Test Astrologer ID
                    
                    const response = await fetch('/api/v1/chat/init', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        astrologerId: astrologerId,
                        userDetails: {
                          name: "Test User",
                          gender: "Male",
                          date: "1990-01-01",
                          time: "10:00",
                          place: "New York"
                        }
                      })
                    });
                    const data = await response.json();
                    console.log("💬 Chat init response:", data);
                  } catch (error) {
                    console.error("💬 Chat init error:", error);
                  }
                }}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                💬 Test Chat Init with Astrologer (as User)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 