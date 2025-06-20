'use client'

import { useState, useEffect } from 'react';
import * as motion from 'framer-motion/client';
import { SparklesCore } from '@/components2/ui/sparkles';
import Link from 'next/link';
import { ShoppingCart, Gem, Star, ArrowRight, Bell, Crown, Shield, Gift } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AstromallPage() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribed(true);
    setEmail('');
  };

  const productCategories = [
    {
      icon: <Gem className="w-8 h-8 text-blue-500" />,
      title: "Gemstones & Crystals",
      description: "Authentic precious stones for planetary remedies and healing"
    },
    {
      icon: <Crown className="w-8 h-8 text-yellow-500" />,
      title: "Spiritual Jewelry",
      description: "Sacred rings, pendants, and bracelets with astrological benefits"
    },
    {
      icon: <Star className="w-8 h-8 text-purple-500" />,
      title: "Yantras & Talismans",
      description: "Energized geometric symbols for protection and prosperity"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "Rudraksha Beads",
      description: "Sacred beads for meditation, healing, and spiritual growth"
    },
    {
      icon: <Gift className="w-8 h-8 text-red-500" />,
      title: "Pooja Items",
      description: "Complete sets for home worship and religious ceremonies"
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
                <div className="text-6xl md:text-7xl mb-6">🛍️</div>
                <div className="absolute -top-2 -right-2 text-2xl animate-pulse">💎</div>
              </motion.div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 mb-6">
              AstroMall
            </h1>
            
            <p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your one-stop destination for authentic spiritual products, gemstones, and astrological remedies
            </p>

            {/* Coming Soon Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
              className="inline-block"
            >
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg">
                🚀 Coming Soon
              </div>
            </motion.div>
          </motion.div>

          {/* Product Categories Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Premium Spiritual Collection ✨
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productCategories.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-purple-200">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4">
                        {category.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        {category.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Why Choose AstroMall? 🌟
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-gradient-to-br from-purple-100 to-blue-100 border-purple-200">
                <CardContent className="p-8">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Certified Authentic</h3>
                  <p className="text-gray-600">All products are lab-certified and blessed by expert astrologers for maximum effectiveness</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-100 to-green-100 border-blue-200">
                <CardContent className="p-8">
                  <div className="text-4xl mb-4">🚚</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Fast Delivery</h3>
                  <p className="text-gray-600">Quick and secure delivery with special packaging to preserve spiritual energy</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-100 to-yellow-100 border-green-200">
                <CardContent className="p-8">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Best Prices</h3>
                  <p className="text-gray-600">Direct sourcing from trusted suppliers ensures competitive pricing for premium quality</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-200">
                <CardContent className="p-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Personalized</h3>
                  <p className="text-gray-600">Customized recommendations based on your birth chart and astrological needs</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Newsletter Signup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="mb-16"
          >
            <Card className="bg-gradient-to-r from-purple-100 via-blue-100 to-green-100 border-purple-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                  <Bell className="w-6 h-6 text-purple-500" />
                  Get Exclusive Early Access!
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
                        className="flex-1 border-purple-300 focus:border-purple-500"
                        required
                      />
                      <Button 
                        type="submit"
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                      >
                        Notify Me
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 text-center">
                      Be first to shop our spiritual collection! 🛍️
                    </p>
                  </form>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-semibold text-green-600 mb-2">
                      Welcome to Our VIP List!
                    </h3>
                    <p className="text-gray-600">
                      You'll get exclusive access when AstroMall launches!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Special Offer Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mb-16"
          >
            <Card className="bg-gradient-to-r from-orange-200 to-red-200 border-orange-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-400/20"></div>
              <CardContent className="p-8 text-center relative z-10">
                <div className="text-5xl mb-4">🎁</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Launch Special Offer</h3>
                <p className="text-lg text-gray-700 mb-4">
                  First 1000 customers get <span className="font-bold text-red-600">30% OFF</span> on their first order!
                </p>
                <p className="text-sm text-gray-600">
                  Plus free consultation with our expert astrologer 🌟
                </p>
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
              Explore Our Available Services
            </h2>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/free-kundli">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  🌟 Free Kundli
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              
              <Link href="/chat-with-astrologer">
                <Button variant="outline" className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 px-6 py-3">
                  💬 Chat with Astrologer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9 }}
            className="mt-16 text-center"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Development Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full w-2/3 transition-all duration-1000"></div>
              </div>
              <p className="text-sm text-gray-600">65% Complete - Expected Launch: Q1 2025</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 