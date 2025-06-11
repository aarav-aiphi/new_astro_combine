"use client";
import { useState, useEffect } from 'react';
import WalletBalance from "@/components/wallet/WalletBalance";
import TransactionHistory from "@/components/wallet/TransactionHistory";
import RechargeModal from "@/components/ui/RechargeModal";
import { ToastProvider } from "@/components/ui/toast-simple";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchWallet, fetchTransactions, selectWalletBalance } from '@/redux/walletSlice';
import { selectUser } from '@/redux/userSlice';
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, CreditCard, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import axios from 'axios';

interface PaginatedTransaction {
  _id: string;
  type: 'recharge' | 'debit' | 'credit';
  amountPaise: number;
  description: string;
  transactionId: string;
  timestamp: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function WalletPage() {
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'recharge' | 'history'>('recharge');
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedTransaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const router = useRouter();
  
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const balancePaise = useAppSelector(selectWalletBalance);
  const isAuthenticated = !!user;

  // Fetch wallet data when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWallet());
      dispatch(fetchTransactions());
    }
  }, [isAuthenticated, dispatch]);

  // Fetch paginated transactions when history tab is active
  useEffect(() => {
    if (activeTab === 'history' && isAuthenticated) {
      fetchPaginatedTransactions(1);
    }
  }, [activeTab, isAuthenticated]);

  const fetchPaginatedTransactions = async (page: number) => {
    setLoadingTransactions(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/v1/wallet/transactions?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setPaginatedTransactions(response.data.data.transactions);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleOpenRecharge = () => {
    setShowRechargeModal(true);
  };

  const formatBalance = (balancePaise: number) => {
    return (balancePaise / 100).toFixed(0);
  };

  const formatAmount = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
      case 'recharge':
        return 'text-green-600';
      case 'debit':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const isLowBalance = balancePaise < 2000;

  return (
    <ToastProvider>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Your Wallet</h1>
              <p className="text-gray-600 mt-1">
                Manage your balance and view transaction history
              </p>
            </div>
          </div>
          <Button 
            onClick={handleOpenRecharge}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Money
          </Button>
        </div>

        {/* Low Balance Alert */}
        {isLowBalance && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 rounded-full p-2">
                  <span className="text-red-600 text-lg">⚠️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Low Balance Alert</h3>
                  <p className="text-red-600 text-sm">
                    Your balance is ₹{formatBalance(balancePaise)}. Add money to continue using services.
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleOpenRecharge}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Recharge Now
              </Button>
            </div>
          </div>
        )}

        {/* Wallet Balance Card */}
        <div className="mb-8">
          <WalletBalance />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('recharge')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'recharge'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Recharge
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Transaction History
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'recharge' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* About Wallet */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
                    About Your Wallet
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">💬</span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Chat Sessions</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Pay per minute for text consultations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">📞</span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Call Sessions</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Voice consultations with expert astrologers
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">⚡</span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Instant Deduction</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Automatic billing every minute during sessions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">🔒</span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Secure Payments</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Safe and encrypted payment processing
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Recharge Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quick Recharge</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[100, 200, 500, 1000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => setShowRechargeModal(true)}
                        className="h-16 text-lg font-semibold"
                      >
                        ₹{amount}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={() => setShowRechargeModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Custom Amount
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Transaction History</h3>
                  {pagination && (
                    <p className="text-sm text-gray-500">
                      Page {pagination.currentPage} of {pagination.totalPages} 
                      ({pagination.totalItems} total transactions)
                    </p>
                  )}
                </div>

                {loadingTransactions ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50 sticky top-0">
                          <TableRow>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                            <TableHead className="font-semibold">Description</TableHead>
                            <TableHead className="font-semibold text-right">Amount</TableHead>
                            <TableHead className="font-semibold">Transaction ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedTransactions.map((transaction) => (
                            <TableRow key={transaction._id}>
                              <TableCell className="font-medium">
                                {formatDate(transaction.timestamp)}
                              </TableCell>
                              <TableCell>
                                <span className={`capitalize font-medium ${getTransactionColor(transaction.type)}`}>
                                  {transaction.type}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {transaction.description}
                              </TableCell>
                              <TableCell className={`text-right font-semibold ${getTransactionColor(transaction.type)}`}>
                                {transaction.type === 'debit' ? '-' : '+'}
                                {formatAmount(transaction.amountPaise)}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-gray-500">
                                {transaction.transactionId.slice(-8).toUpperCase()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <Button
                          variant="outline"
                          onClick={() => fetchPaginatedTransactions(pagination.currentPage - 1)}
                          disabled={pagination.currentPage <= 1}
                        >
                          Previous
                        </Button>
                        
                        <div className="flex items-center gap-2">
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                              <Button
                                key={page}
                                variant={pagination.currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => fetchPaginatedTransactions(page)}
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => fetchPaginatedTransactions(pagination.currentPage + 1)}
                          disabled={pagination.currentPage >= pagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recharge Modal */}
        <RechargeModal
          open={showRechargeModal}
          onOpenChange={setShowRechargeModal}
          onSuccess={() => {
            // Refresh wallet data after successful recharge
            dispatch(fetchWallet());
            dispatch(fetchTransactions());
          }}
        />
      </div>
    </ToastProvider>
  );
} 