"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Loader2, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from "@/redux/hooks";

export default function MiniWalletBalance({ 
  refreshInterval = 30000, // refresh every 30 seconds by default
  showAddFundsButton = true
}) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = useAppSelector((state) => state.user.token);

  useEffect(() => {
    if (token) {
      fetchWalletBalance();
      
      // Set up a timer to refresh the balance periodically
      const timer = setInterval(fetchWalletBalance, refreshInterval);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [refreshInterval, token]);

  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      
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
          
        } catch (fetchError) {
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
      
      if (data.success) {
        setBalance(data.data.balancePaise / 100); // Convert paise to rupees
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      
      // Provide more helpful error messages
      if (error.message?.includes('Failed to fetch')) {
        console.error('Network connection failed. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = () => {
    router.push('/dashboard/wallet');
  };

  // Determine if balance is low (less than ₹50)
  const isLowBalance = balance !== null && balance < 50;

  return (
    <Card className={`${isLowBalance ? 'border-destructive' : ''}`}>
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <div className={`font-medium ${isLowBalance ? 'text-destructive' : ''}`}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `₹${balance?.toFixed(2) || '0.00'}`
            )}
          </div>
        </div>
        
        {showAddFundsButton && (
          <Button 
            variant={isLowBalance ? "destructive" : "ghost"} 
            size="sm" 
            onClick={handleAddFunds}
            className="h-8"
          >
            {isLowBalance ? "Low Balance" : "Add Funds"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 