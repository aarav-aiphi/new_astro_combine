'use client'

import { useState, useEffect } from 'react';
import * as motion from 'framer-motion/client';
import { SparklesCore } from '@/components2/ui/sparkles';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search, Star, Compass } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  // Auto redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const quickLinks = [
    {
      href: "/free-kundli",
      title: "Free Kundli",
      description: "Generate your birth chart instantly",
      icon: "🌟"
    },
    {
      href: "/chat-with-astrologer",
      title: "Chat with Astrologer",
      description: "Connect with expert astrologers",
      icon: "💬"
    },
    {
      href: "/horoscopes",
      title: "Horoscopes",
      description: "Daily predictions and insights",
      icon: "🔮"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl mx-auto text-center relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={1200}
            className="w-full h-full"
            particleColor="#f97316"
          />
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          {/* 404 Display */}
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative inline-block"
            >
              <div className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 mb-4">
                404
              </div>
              <div className="absolute -top-4 -right-4 text-4xl animate-bounce">🕉️</div>
            </motion.div>
          </div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Oops! Page Not Found
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              It seems like the cosmic energies have guided you to a path that doesn't exist yet. 
              Don't worry, the universe has other beautiful destinations for you! ✨
            </p>
          </motion.div>

          {/* Auto Redirect Counter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <Card className="inline-block bg-white/80 backdrop-blur-sm border-orange-200">
              <CardContent className="px-6 py-4">
                <div className="flex items-center gap-3 text-orange-600">
                  <Compass className="w-5 h-5 animate-spin" />
                  <span className="font-medium">
                    Redirecting to home in {countdown} seconds
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            <Link href="/">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </Link>
            
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 px-6 py-3 text-lg font-semibold"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </motion.div>

          {/* Quick Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              🌟 Explore Our Popular Services
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                >
                  <Link href={link.href}>
                    <Card className="h-full hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-orange-200 hover:border-orange-300 cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-4">{link.icon}</div>
                        <h3 className="text-xl font-semibold text-orange-600 mb-2">
                          {link.title}
                        </h3>
                        <p className="text-gray-600">
                          {link.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Inspirational Quote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-12 p-6 bg-gradient-to-r from-orange-100 to-amber-100 rounded-2xl max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center mb-3">
              <Star className="w-6 h-6 text-orange-500 mr-2" />
              <span className="text-lg font-semibold text-orange-600">Cosmic Wisdom</span>
              <Star className="w-6 h-6 text-orange-500 ml-2" />
            </div>
            <p className="text-gray-700 italic">
              "When you lose your way, remember that every detour is just the universe's way of showing you a new path to your destiny."
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 