'use client'

import { useState, useEffect } from 'react';
import * as motion from 'framer-motion/client';
import { SparklesCore } from '@/components2/ui/sparkles';
import Link from 'next/link';
import { Flame, Home, Users, Star, ArrowRight, Bell, Calendar, Gift } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function BookPoojaPage() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribed(true);
    setEmail('');
  };

  const poojaTypes = [
    {
      icon: <Flame className="w-8 h-8 text-orange-500" />,
      title: "Ganesh Pooja",
      description: "Remove obstacles and bring prosperity to your home and business"
    },
    {
      icon: <Home className="w-8 h-8 text-blue-500" />,
      title: "Griha Pravesh",
      description: "Bless your new home with positive energies and divine protection"
    },
    {
      icon: <Users className="w-8 h-8 text-green-500" />,
      title: "Satyanarayan Pooja",
      description: "Seek Lord Vishnu's blessings for family harmony and well-being"
    },
    {
      icon: <Star className="w-8 h-8 text-purple-500" />,
      title: "Navgraha Pooja",
      description: "Balance planetary influences and enhance your horoscope's power"
    },
    {
      icon: <Calendar className="w-8 h-8 text-red-500" />,
      title: "Special Occasion Poojas",
      description: "Customized rituals for birthdays, anniversaries, and celebrations"
    },
    {
      icon: <Gift className="w-8 h-8 text-pink-500" />,
      title: "Online Pooja Services",
      description: "Join live poojas from anywhere with our virtual participation"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-12">
      <div className="container mx-auto px-4 relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={800}
            className="w-full h-full"
            particleColor="#f97316"
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative inline-block"
              >
                <div className="text-6xl md:text-7xl mb-6">🕉️</div>
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🪔</div>
              </motion.div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 mb-6">
              Book a Pooja
            </h1>
            
            <p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with divine energies through authentic Vedic rituals performed by experienced priests
            </p>

            {/* Coming Soon Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
              className="inline-block"
            >
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg">
                🚀 Coming Soon
              </div>
            </motion.div>
          </motion.div>

          {/* Newsletter Signup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mb-16"
          >
            <Card className="bg-gradient-to-r from-orange-100 via-yellow-100 to-amber-100 border-orange-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                  <Bell className="w-6 h-6 text-orange-500" />
                  Be First to Book When We Launch!
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isSubscribed ? (
                  <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
                    <div className="flex gap-3">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 border-orange-300 focus:border-orange-500"
                        required
                      />
                      <Button 
                        type="submit"
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                      >
                        Notify Me
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 text-center">
                      Get early access to divine blessings! 🙏
                    </p>
                  </form>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-semibold text-green-600 mb-2">
                      Blessed to have you with us!
                    </h3>
                    <p className="text-gray-600">
                      We'll notify you when pooja booking is available!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Current Services */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              Explore Our Available Services Meanwhile
            </h2>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/free-kundli">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  🌟 Free Kundli
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              
              <Link href="/chat-with-astrologer">
                <Button variant="outline" className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 px-6 py-3">
                  💬 Chat with Astrologer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 