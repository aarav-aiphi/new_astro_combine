"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { selectUser } from '@/redux/userSlice';
import { selectWalletBalance, fetchWallet } from '@/redux/walletSlice';
import { MdLogout } from "react-icons/md";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { signoutUser } from "@/redux/userSlice";
import BalanceChip from "@/components/ui/BalanceChip";

const navLinks = [
  {
    id: 'chat-with-astrologer',
    title: 'Chat with Astrologer',
  },
  {
    id: 'free-kundli',
    title: 'Free Kundli',
  },
  {
    id: 'kundli-matching',
    title: 'Kundli Matching',
  },
  {
    id: 'horoscopes',
    title: 'Horoscopes',
  },
  {
    id: 'book-pooja',
    title: 'Book a Pooja',
  },
  {
    id: 'astromall',
    title: 'Astromall',
  },
];

export function Header() {
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(true);
  const router = useRouter();

  const user = useAppSelector(selectUser);
  const walletBalance = useAppSelector(selectWalletBalance);
  const isAuthenticated = !!user;
  const dispatch = useAppDispatch();

  // Fetch wallet balance when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchWallet());
    }
  }, [isAuthenticated, user, dispatch]);

  useEffect(() => {
    let prevScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > prevScrollY) {
        setScrolled(false);
      } else if (currentScrollY < prevScrollY || currentScrollY === 0) {
        setScrolled(true);
      }

      prevScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleClick = () => {
    setToggle(!toggle);
  };

  const handleLogout = async () => {
    try {
      await dispatch(signoutUser()).unwrap();
      location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Format balance from paise to rupees
  const formatBalance = (balancePaise: number) => {
    return (balancePaise / 100).toFixed(0);
  };

  // Check if balance is low (less than ₹20)
  const isLowBalance = walletBalance < 2000;

  const handleWalletClick = () => {
    router.push('/dashboard/wallet');
  };

  return (
    <div className="relative z-50 mb-20">
      <nav className={`fixed top-0 w-full transition-all duration-300 ease-in-out ${scrolled ? 'bg-white/50 backdrop-blur-md shadow-sm' : 'bg-white shadow-md'} ${!scrolled ? 'transform translate-y-[-100%]' : ''}`}>
        {/* Balance Chip - Top Right */}
        {isAuthenticated && (
          <BalanceChip onClick={handleWalletClick} />
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left side - Logo and main nav */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-orange-200 transition-all duration-300">
                  <span className="text-white font-bold text-xl">AA</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-500 to-red-600 hover:from-amber-700 hover:via-orange-600 hover:to-red-700 transition-all duration-200">
                    AstroAlert
                  </span>
                  <span className="text-xs text-amber-600/70 font-medium -mt-1">
                    by aiphi
                  </span>
                </div>
              </Link>
              <div className="hidden sm:flex space-x-8">
                {navLinks.map((nav) => (
                  <Link
                    key={nav.id}
                    href={`/${nav.id}`}
                    className={`text-gray-700 hover:text-black transition-colors duration-200 text-md font-medium relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-black hover:after:w-full after:transition-all after:duration-200`}
                  >
                    {nav.title}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side - Auth and mobile menu */}
            <div className="flex items-center space-x-4">
              <div className="sm:hidden">
                <button
                  onClick={handleToggleClick}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Toggle mobile menu"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </button>
              </div>

              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  {/* Wallet Balance Badge - Clickable with red blinking for low balance */}
                  <button
                    onClick={handleWalletClick}
                    data-testid="wallet-badge"
                    className={`relative px-3 py-1 rounded-full text-sm font-medium border transition-all duration-200 ${
                      isLowBalance 
                        ? 'animate-pulse bg-red-500 text-white border-red-600 hover:bg-red-600' 
                        : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                    }`}
                  >
                    ₹{formatBalance(walletBalance)}
                  </button>
                  
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={user.avatar}
                      alt="User Avatar"
                      width={1000}
                      height={1000}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <MdLogout className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <Link href="/auth/login">
                  <button className="px-4 py-2 rounded-full bg-black text-white hover:bg-teal-700 transition-colors duration-200 shadow-sm">
                    Sign In
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {toggle && (
          <div className="absolute top-20 right-0 w-full sm:hidden bg-white shadow-xl rounded-t-xl">
            <div className="p-6">
              <div className="flex flex-col space-y-4">
                {navLinks.map((nav) => (
                  <Link
                    key={nav.id}
                    href={`/${nav.id === 'chat-with-astrologer' ? 'chat' : nav.id}`}
                    className="text-gray-600 hover:text-black transition-colors duration-200"
                  >
                    {nav.title}
                  </Link>
                ))}
                {/* Add Wallet link to mobile menu */}
                {isAuthenticated && (
                  <button
                    onClick={handleWalletClick}
                    className="text-gray-600 hover:text-black transition-colors duration-200 text-left"
                  >
                    Wallet - ₹{formatBalance(walletBalance)}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}