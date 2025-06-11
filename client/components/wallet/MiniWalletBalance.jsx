"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Loader2, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from "@/redux/hooks";
import api from '@/lib/api';

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
      const response = await api.get('/wallet/balance');
      
      if (response.data.success) {
        setBalance(response.data.data.balance);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
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