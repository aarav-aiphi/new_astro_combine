"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectUser, signoutUser } from '@/redux/userSlice';
import { selectWalletBalance } from '@/redux/walletSlice';
import { MdLogout } from "react-icons/md";
import { User, Settings, CreditCard, HelpCircle } from 'lucide-react';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector(selectUser);
  const walletBalance = useAppSelector(selectWalletBalance);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Format balance from paise to rupees
  const formatBalance = (balancePaise: number) => {
    return (balancePaise / 100).toFixed(0);
  };

  // Check if balance is low (less than ₹20)
  const isLowBalance = walletBalance < 2000;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(signoutUser()).unwrap();
      setIsOpen(false);
      location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

      return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-orange-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
        title="Profile Menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Image
          src={user.avatar || "/default-avatar.svg"}
          alt="User Avatar"
          width={32}
          height={32}
          className="w-full h-full object-cover rounded-full"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={user.avatar || "/default-avatar.svg"}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user.email}
                </p>
                <div className="flex items-center mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
            >
              <User className="w-4 h-4 mr-3 text-gray-400" />
              View Profile
            </Link>
            
            <Link
              href="/dashboard/wallet"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
            >
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-3 text-gray-400" />
                Wallet & Billing
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                isLowBalance 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                ₹{formatBalance(walletBalance)}
              </span>
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400" />
              Settings
            </Link>

            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
            >
              <HelpCircle className="w-4 h-4 mr-3 text-gray-400" />
              Help & Support
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900 transition-colors duration-150"
            >
              <MdLogout className="w-4 h-4 mr-3 text-red-400" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 