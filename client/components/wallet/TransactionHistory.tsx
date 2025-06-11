"use client";
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "../ui/toast-simple";
import { formatDistanceToNow } from 'date-fns';
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { 
  fetchTransactions, 
  selectWalletTransactions, 
  selectWalletLoading, 
  selectWalletError,
  clearWalletError,
  type Transaction 
} from '@/redux/walletSlice';
import { selectUser } from '@/redux/userSlice';
import { Clock, IndianRupee } from 'lucide-react';

export default function TransactionHistory() {
  const { toast } = useToast();
  
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const transactions = useAppSelector(selectWalletTransactions);
  const loading = useAppSelector(selectWalletLoading);
  const error = useAppSelector(selectWalletError);
  const isAuthenticated = !!user;

  // Fetch transactions when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTransactions());
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

  const formatAmount = (amountPaise: number) => {
    return (amountPaise / 100).toFixed(2);
  };

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case 'recharge':
        return 'default';
      case 'debit':
        return 'destructive';
      case 'credit':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'recharge':
        return '💰';
      case 'debit':
        return '💸';
      case 'credit':
        return '💚';
      default:
        return '💳';
    }
  };

  const formatTransactionDescription = (transaction: Transaction) => {
    // Fallback to description if it exists, otherwise create one based on type
    if (transaction.description) {
      return transaction.description;
    }
    
    switch (transaction.type) {
      case 'recharge':
        return 'Wallet recharge';
      case 'debit':
        return 'Service usage';
      case 'credit':
        return 'Credit received';
      default:
        return 'Transaction';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Transaction History
        </CardTitle>
        <CardDescription>Your recent wallet transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <IndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No transactions found</p>
            <p className="text-sm text-gray-400">
              Your transaction history will appear here once you start using services
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.transactionId}>
                    <TableCell className="font-medium">
                      {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTransactionBadgeVariant(transaction.type)} className="capitalize">
                        {getTransactionIcon(transaction.type)} {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {formatTransactionDescription(transaction)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={`${
                        transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'debit' ? '-' : '+'}₹{formatAmount(transaction.amountPaise)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 