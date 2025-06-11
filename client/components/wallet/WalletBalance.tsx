"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "../ui/toast-simple";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { 
  fetchWallet, 
  selectWalletBalance, 
  selectWalletLoading, 
  selectWalletError,
  clearWalletError 
} from '@/redux/walletSlice';
import { selectUser } from '@/redux/userSlice';
import RechargeModal from '../ui/RechargeModal';
import { Wallet, Plus } from 'lucide-react';

export default function WalletBalance() {
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const { toast } = useToast();
  
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const balancePaise = useAppSelector(selectWalletBalance);
  const loading = useAppSelector(selectWalletLoading);
  const error = useAppSelector(selectWalletError);
  const isAuthenticated = !!user;

  // Fetch wallet balance when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWallet());
    }
  }, [isAuthenticated, dispatch]);

  // Show error toast when wallet error occurs
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error
      });
      dispatch(clearWalletError());
    }
  }, [error, toast, dispatch]);

  const handleOpenRecharge = () => {
    setShowRechargeModal(true);
  };

  const handleRechargeSuccess = () => {
    toast({
      title: "Success",
      description: "Wallet recharged successfully!"
    });
  };

  // Format balance from paise to rupees
  const formatBalance = (balancePaise: number) => {
    return (balancePaise / 100).toFixed(2);
  };

  // Determine if balance is low (less than ₹20)
  const isLowBalance = balancePaise < 2000;

  return (
    <>
      <Card className={`${isLowBalance ? 'border-red-200 bg-red-50/50' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className={`w-5 h-5 ${isLowBalance ? 'text-red-600' : 'text-blue-600'}`} />
            Wallet Balance
          </CardTitle>
          <CardDescription>
            {isLowBalance ? (
              <span className="text-red-600 font-medium">
                ⚠️ Low balance - Please recharge to continue using services
              </span>
            ) : (
              'Your current wallet balance'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`text-4xl font-bold ${isLowBalance ? 'text-red-600' : 'text-green-600'}`}>
                ₹{formatBalance(balancePaise)}
              </div>
              <p className="text-sm text-gray-500">
                Available for chat and call sessions
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            onClick={handleOpenRecharge}
            className={`flex items-center gap-2 ${
              isLowBalance 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            {isLowBalance ? 'Recharge Now' : 'Add Money'}
          </Button>
          {isLowBalance && (
            <Button 
              variant="outline" 
              onClick={handleOpenRecharge}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Quick ₹100
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Recharge Modal */}
      <RechargeModal
        open={showRechargeModal}
        onOpenChange={setShowRechargeModal}
        onSuccess={handleRechargeSuccess}
      />
    </>
  );
} 