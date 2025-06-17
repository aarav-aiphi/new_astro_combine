"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiUser, FiStar, FiUsers, FiBookOpen } from "react-icons/fi";

export default function SignupPage() {
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sacred-sandal via-white to-sacred-saffron/10 px-4 relative overflow-hidden">
      
      {/* Enhanced Cosmic Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-40 h-40 bg-sacred-gold/30 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-10 right-10 w-40 h-40 bg-sacred-vermilion/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-40 h-40 bg-sacred-copper/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Sacred Mandala Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('/mandala-pattern.png')] bg-repeat opacity-30" />
      </div>

      {/* Floating Sacred Symbols */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-sacred-gold opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 12 + 12}px`,
            }}
            animate={{ 
              y: [-15, 15],
              opacity: [0.2, 0.6, 0.2],
              rotate: [0, 360],
            }}
            transition={{
              duration: Math.random() * 5 + 4,
              repeat: Infinity,
              repeatType: "reverse",
              delay: Math.random() * 3,
            }}
          >
            {['✦', '⭐', '🌟', '✨', '🔯', '☪️', '🕉️', '☉', '☽'][Math.floor(Math.random() * 9)]}
          </motion.div>
        ))}
      </div>

      <div className="max-w-5xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Sacred Header */}
          <div className="relative inline-block mb-6">
            <motion.div
              className="text-6xl mb-4"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              🕉️
            </motion.div>
            <motion.div
              className="absolute -top-2 -right-4 text-2xl"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              ⭐
            </motion.div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-sacred-copper mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sacred-vermilion via-sacred-gold to-sacred-copper animate-sacred-shimmer bg-[length:200%_auto]">
              Choose Your Path
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-sacred-vermilion via-sacred-gold to-sacred-copper rounded-full mx-auto mb-6"></div>
          <p className="text-xl text-sacred-copper/80 max-w-2xl mx-auto font-medium">
            Join the cosmic community and discover your spiritual journey
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Enhanced User Signup Card */}
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-sacred-gold/20
                     hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] transition-all duration-500 relative overflow-hidden"
          >
            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sacred-gold/20 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-sacred-copper/20 rounded-full transform -translate-x-4 translate-y-4"></div>
            </div>

            <div className="text-center relative z-10">
              <motion.div 
                className="mx-auto w-20 h-20 bg-gradient-to-br from-sacred-gold/20 to-sacred-copper/20 rounded-full flex items-center justify-center mb-6
                         border-2 border-sacred-gold/30 shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FiUsers className="w-10 h-10 text-sacred-gold" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-sacred-copper mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sacred-vermilion to-sacred-gold">
                  Spiritual Seeker
                </span>
              </h2>
              
              <p className="text-sacred-copper/70 mb-6 leading-relaxed">
                Embark on a journey of self-discovery and cosmic wisdom. Connect with enlightened astrologers for personalized guidance.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-sacred-copper/80">
                  <div className="w-2 h-2 bg-sacred-gold rounded-full"></div>
                  <span>Chat with certified astrologers</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-sacred-copper/80">
                  <div className="w-2 h-2 bg-sacred-gold rounded-full"></div>
                  <span>Get personalized horoscopes & birth charts</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-sacred-copper/80">
                  <div className="w-2 h-2 bg-sacred-gold rounded-full"></div>
                  <span>Book video consultations</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-sacred-copper/80">
                  <div className="w-2 h-2 bg-sacred-gold rounded-full"></div>
                  <span>Access sacred remedies & rituals</span>
                </div>
              </div>
              
              <Link href="/auth/signup/user">
                <motion.button 
                  className="w-full bg-gradient-to-r from-sacred-vermilion via-sacred-gold to-sacred-copper text-white font-semibold py-4 px-6 rounded-xl 
                           hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all duration-300 relative overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-sacred-gold/20 to-transparent 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2">
                    <FiStar className="w-5 h-5" />
                    Begin My Journey
                  </div>
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Enhanced Astrologer Signup Card */}
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-sacred-gold/20
                     hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] transition-all duration-500 relative overflow-hidden"
          >
            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-28 h-28 bg-sacred-vermilion/20 rounded-full transform -translate-x-6 -translate-y-6"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-sacred-gold/20 rounded-full transform translate-x-8 translate-y-8"></div>
            </div>

            <div className="text-center relative z-10">
              <motion.div 
                className="mx-auto w-20 h-20 bg-gradient-to-br from-sacred-vermilion/20 to-sacred-gold/20 rounded-full flex items-center justify-center mb-6
                         border-2 border-sacred-vermilion/30 shadow-lg"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3 }}
              >
                <FiBookOpen className="w-10 h-10 text-sacred-vermilion" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-sacred-copper mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sacred-copper to-sacred-vermilion">
                  Cosmic Guru
                </span>
              </h2>
              
              <p className="text-sacred-copper/70 mb-6 leading-relaxed">
                Share your divine knowledge and guide souls on their spiritual path. Join our community of enlightened teachers.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-sacred-copper/80">
                  <div className="w-2 h-2 bg-sacred-vermilion rounded-full"></div>
                  <span>Conduct personalized consultations</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-sacred-copper/80">
                  <div className="w-2 h-2 bg-sacred-vermilion rounded-full"></div>
                  <span>Set your own consultation rates</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-sacred-copper/80">
                  <div className="w-2 h-2 bg-sacred-vermilion rounded-full"></div>
                  <span>Build your spiritual practice</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-sacred-copper/80">
                  <div className="w-2 h-2 bg-sacred-vermilion rounded-full"></div>
                  <span>Access advanced tools & analytics</span>
                </div>
              </div>
              
              <Link href="/auth/signup/astrologer">
                <motion.button 
                  className="w-full bg-gradient-to-r from-sacred-copper via-sacred-vermilion to-sacred-gold text-white font-semibold py-4 px-6 rounded-xl 
                           hover:shadow-[0_0_25px_rgba(156,85,51,0.4)] transition-all duration-300 relative overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-sacred-vermilion/20 to-transparent 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2">
                    <FiBookOpen className="w-5 h-5" />
                    Share My Wisdom
                  </div>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-12"
        >
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-sacred-gold/20 mb-8 max-w-2xl mx-auto">
            <p className="text-sacred-copper/70 mb-4">
              Already part of our cosmic community?
            </p>
            <Link href="/auth/login">
              <motion.button 
                className="inline-flex items-center gap-2 text-sacred-gold hover:text-sacred-copper font-semibold
                         px-6 py-2 border border-sacred-gold/30 rounded-lg hover:bg-sacred-gold/10 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <FiUser className="w-4 h-4" />
                Login to Continue
              </motion.button>
            </Link>
          </div>

          {/* Sacred Features Banner */}
          <div className="bg-gradient-to-r from-sacred-gold/10 via-white/60 to-sacred-copper/10 
                        backdrop-blur-sm border border-sacred-gold/20 rounded-2xl p-6">
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-sacred-copper/80">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔒</span> Bank-Grade Security
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🌍</span> Global Community
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span> Instant Connections
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💫</span> Sacred Wisdom
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 