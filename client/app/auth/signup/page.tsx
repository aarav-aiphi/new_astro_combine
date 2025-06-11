"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiUser, FiStar } from "react-icons/fi";

export default function SignupPage() {
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Join JyotishConnect
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Choose how you&apos;d like to get started
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* User Signup Card */}
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6">
                <FiUser className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Sign Up as User
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Get personalized astrological consultations and insights from expert astrologers
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 mb-8 space-y-2">
                <li>✓ Chat with certified astrologers</li>
                <li>✓ Get personalized horoscopes</li>
                <li>✓ Book video consultations</li>
                <li>✓ Track your astrological journey</li>
              </ul>
              <Link href="/auth/signup/user">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200">
                  Sign Up as User
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Astrologer Signup Card */}
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-6">
                <FiStar className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Sign Up as Astrologer
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Share your astrological expertise and connect with clients seeking guidance
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 mb-8 space-y-2">
                <li>✓ Set your consultation rates</li>
                <li>✓ Manage your availability</li>
                <li>✓ Build your client base</li>
                <li>✓ Earn from your expertise</li>
              </ul>
              <Link href="/auth/signup/astrologer">
                <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200">
                  Sign Up as Astrologer
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
} 