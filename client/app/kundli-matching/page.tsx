'use client'

import { useState, useEffect } from 'react';
import * as motion from 'framer-motion/client';
import { SparklesCore } from '@/components2/ui/sparkles';
import Link from 'next/link';
import { Heart, Users, Star, Calendar, ArrowRight, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function KundliMatchingPage() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the email to your backend
    setIsSubscribed(true);
    setEmail('');
  };

  const features = [
    {
      icon: <Heart className="w-8 h-8 text-red-500" />,
      title: "Ashtakoot Compatibility",
      description: "Complete 8-point compatibility analysis based on traditional Vedic principles"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Guna Milan Analysis",
      description: "Detailed matching of 36 gunas for perfect marital harmony assessment"
    },
    {
      icon: <Star className="w-8 h-8 text-yellow-500" />,
      title: "Manglik Dosha Check",
      description: "Advanced Mars dosha analysis with effective remedial solutions"
    },
    {
      icon: <Calendar className="w-8 h-8 text-green-500" />,
      title: "Muhurat Recommendations",
      description: "Auspicious timing suggestions for engagement and marriage ceremonies"
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
        <div className="relative z-10 max-w-4xl mx-auto">
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
                <div className="text-6xl md:text-7xl mb-6">💝</div>
                <div className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</div>
              </motion.div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 mb-6">
              Kundli Matching
            </h1>
            
            <p className="text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Find your perfect soulmate with ancient Vedic compatibility wisdom
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

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              What's Coming Your Way ✨
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-orange-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Newsletter Signup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mb-16"
          >
            <Card className="bg-gradient-to-r from-pink-100 via-red-100 to-orange-100 border-pink-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                  <Bell className="w-6 h-6 text-orange-500" />
                  Get Notified When We Launch!
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
                        className="flex-1 border-pink-300 focus:border-pink-500"
                        required
                      />
                      <Button 
                        type="submit"
                        className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
                      >
                        Notify Me
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 text-center">
                      Be the first to find your perfect match! 💕
                    </p>
                  </form>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-semibold text-green-600 mb-2">
                      Thank You for Subscribing!
                    </h3>
                    <p className="text-gray-600">
                      We'll notify you as soon as Kundli Matching is ready!
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
            transition={{ delay: 1.2 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              Meanwhile, Explore Our Available Services
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
              
              <Link href="/horoscopes">
                <Button variant="outline" className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 px-6 py-3">
                  🔮 Horoscopes
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-16 text-center"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Development Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full w-3/4 transition-all duration-1000"></div>
              </div>
              <p className="text-sm text-gray-600">75% Complete - Expected Launch: Q1 2025</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 