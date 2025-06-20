'use client'

import { useState } from 'react';
import * as motion from 'framer-motion/client';
import { SparklesCore } from '@/components2/ui/sparkles';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Download, Share2, Printer } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface KundaliFormData {
  name: string;
  gender: string;
  date: string;
  time: string;
  location: string;
  timezone: string;
}

export default function FreeKundliPage() {
  const [formData, setFormData] = useState<KundaliFormData>({
    name: '',
    gender: 'male',
    date: '',
    time: '',
    location: '',
    timezone: '+5:30'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [northChart, setNorthChart] = useState<string | null>(null);
  const [southChart, setSouthChart] = useState<string | null>(null);
  const [activeChartType, setActiveChartType] = useState<'north' | 'south'>('north');
  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatDateForAPI = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  const generateKundali = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formattedDate = formatDateForAPI(formData.date);
      
      // API URLs for both chart types
      const northUrl = `https://vedastro.azurewebsites.net/api/Calculate/NorthIndianChart/Location/${encodeURIComponent(formData.location)}/Time/${formData.time}/${formattedDate}/${formData.timezone}/ChartType/RasiD1/Ayanamsa/LAHIRI`;
      const southUrl = `https://vedastro.azurewebsites.net/api/Calculate/SouthIndianChart/Location/${encodeURIComponent(formData.location)}/Time/${formData.time}/${formattedDate}/${formData.timezone}/ChartType/RasiD1/Ayanamsa/LAHIRI`;
      
      const [northResponse, southResponse] = await Promise.all([
        fetch(northUrl),
        fetch(southUrl)
      ]);

      if (!northResponse.ok || !southResponse.ok) {
        throw new Error('Failed to generate Kundali. Please check your birth details.');
      }

      const northSvg = await northResponse.text();
      const southSvg = await southResponse.text();
      
      setNorthChart(northSvg);
      setSouthChart(southSvg);
      setShowResults(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating your Kundali');
    } finally {
      setLoading(false);
    }
  };

  const downloadChart = () => {
    const chartData = activeChartType === 'north' ? northChart : southChart;
    if (!chartData) return;
    
    const blob = new Blob([chartData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formData.name}-${activeChartType}-kundali.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printChart = () => {
    const chartData = activeChartType === 'north' ? northChart : southChart;
    if (!chartData) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${formData.name} - ${activeChartType === 'north' ? 'North Indian' : 'South Indian'} Kundali</title>
            <style>
              body { margin: 0; padding: 20px; text-align: center; font-family: Arial, sans-serif; }
              h1 { color: #f97316; margin-bottom: 20px; }
              .chart-container { display: flex; justify-content: center; }
            </style>
          </head>
          <body>
            <h1>${formData.name} - ${activeChartType === 'north' ? 'North Indian' : 'South Indian'} Kundali</h1>
            <div class="chart-container">${chartData}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8">
      <div className="container mx-auto px-4 relative">
        {/* Hero Section */}
        <div className="text-center mb-12 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="relative mb-8"
          >
            <div className="relative h-[60px] w-full mb-6">
              <SparklesCore
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={1200}
                className="w-full h-full"
                particleColor="#f97316"
              />
            </div>
            
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full blur-xl opacity-30"></div>
              <h1 className="relative text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-600 mb-4">
                🕉️ Free Kundali 🕉️
              </h1>
            </div>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-6">
              Discover your cosmic blueprint with authentic Vedic astrology. Generate your personalized birth chart instantly and unlock the secrets of your destiny.
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-orange-500">5M+</div>
                <div className="text-sm text-gray-600">Kundalis Generated</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-orange-500">100%</div>
                <div className="text-sm text-gray-600">Accurate Calculations</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-orange-500">FREE</div>
                <div className="text-sm text-gray-600">Always & Forever</div>
              </div>
            </div>
          </motion.div>
        </div>

        {!showResults ? (
          /* Birth Details Form */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl font-bold text-orange-600 mb-2">
                  Enter Your Birth Details
                </CardTitle>
                <p className="text-gray-600">
                  Accurate birth information ensures precise astrological calculations
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={generateKundali} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <span className="text-orange-500">👤</span>
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="text-lg p-4 border-2 border-orange-200 focus:border-orange-400 rounded-lg transition-all duration-300"
                        required
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <span className="text-orange-500">⚥</span>
                        Gender
                      </Label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full text-lg p-4 border-2 border-orange-200 focus:border-orange-400 rounded-lg transition-all duration-300 bg-white"
                        required
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        Date of Birth
                      </Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="text-lg p-4 border-2 border-orange-200 focus:border-orange-400 rounded-lg transition-all duration-300"
                        required
                      />
                    </div>

                    {/* Time of Birth */}
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        Time of Birth
                      </Label>
                      <Input
                        id="time"
                        name="time"
                        type="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className="text-lg p-4 border-2 border-orange-200 focus:border-orange-400 rounded-lg transition-all duration-300"
                        required
                      />
                    </div>

                    {/* Place of Birth */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="location" className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-orange-500" />
                        Place of Birth
                      </Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., New Delhi, India"
                        className="text-lg p-4 border-2 border-orange-200 focus:border-orange-400 rounded-lg transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-center">{error}</p>
                    </div>
                  )}

                  <div className="text-center">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Generating Your Kundali...
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span>✨</span>
                          Generate Free Kundali
                          <span>✨</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Kundali Results */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-6xl mx-auto space-y-8"
          >
            {/* Header with user details */}
            <Card className="shadow-xl border-0 bg-gradient-to-r from-orange-100 to-amber-100">
              <CardContent className="p-8">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-orange-600 mb-4">
                    🌟 {formData.name}'s Kundali 🌟
                  </h2>
                  <div className="flex flex-wrap justify-center gap-6 text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <span className="font-medium">{new Date(formData.date).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <span className="font-medium">{formData.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-500" />
                      <span className="font-medium">{formData.location}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart Type Selector */}
            <div className="flex justify-center">
              <div className="flex bg-white rounded-lg p-2 shadow-lg">
                <button
                  onClick={() => setActiveChartType('north')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    activeChartType === 'north'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  North Indian Style
                </button>
                <button
                  onClick={() => setActiveChartType('south')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    activeChartType === 'south'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  South Indian Style
                </button>
              </div>
            </div>

            {/* Kundali Chart Display */}
            <Card className="shadow-2xl border-0 bg-white">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-orange-600">
                  {activeChartType === 'north' ? 'North Indian' : 'South Indian'} Birth Chart
                </CardTitle>
                <div className="flex justify-center gap-4 mt-4">
                  <Button
                    onClick={downloadChart}
                    variant="outline"
                    className="flex items-center gap-2 hover:bg-orange-50"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    onClick={printChart}
                    variant="outline"
                    className="flex items-center gap-2 hover:bg-orange-50"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 flex justify-center items-center min-h-[600px]">
                  {activeChartType === 'north' && northChart && (
                    <div 
                      dangerouslySetInnerHTML={{ __html: northChart }} 
                      className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:drop-shadow-lg"
                    />
                  )}
                  {activeChartType === 'south' && southChart && (
                    <div 
                      dangerouslySetInnerHTML={{ __html: southChart }} 
                      className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:drop-shadow-lg"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="text-center space-y-4">
              <Button
                onClick={() => setShowResults(false)}
                variant="outline"
                className="px-8 py-3 text-lg border-2 border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                Generate Another Kundali
              </Button>
              
              <div className="text-center space-y-4">
                <div className="text-sm text-gray-600 max-w-2xl mx-auto">
                  <p>
                    🌟 Want a detailed analysis of your Kundali? Our expert astrologers can provide personalized insights about your career, relationships, health, and spiritual path.
                  </p>
                </div>
                
                {/* CTA to consultation */}
                <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-6 max-w-2xl mx-auto">
                  <h3 className="text-lg font-semibold text-orange-600 mb-2">🔮 Get Personalized Reading</h3>
                  <p className="text-gray-600 mb-4">Ready to dive deeper? Get expert insights about your Kundali from certified Vedic astrologers.</p>
                  <Link href="/chat-with-astrologer">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2">
                      Consult an Astrologer
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Features Section */}
        {!showResults && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 max-w-6xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center text-orange-600 mb-12">
              Why Choose Our Free Kundali Service?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🎯",
                  title: "100% Accurate",
                  description: "Based on authentic Vedic astrology calculations using traditional methods"
                },
                {
                  icon: "⚡",
                  title: "Instant Results",
                  description: "Get your complete birth chart generated within seconds"
                },
                {
                  icon: "🆓",
                  title: "Completely Free",
                  description: "No hidden charges, no registration required - just pure astrological wisdom"
                },
                {
                  icon: "📱",
                  title: "Mobile Friendly",
                  description: "Access your Kundali on any device, anywhere, anytime"
                },
                {
                  icon: "🖨️",
                  title: "Download & Print",
                  description: "Save or print your Kundali for future reference"
                },
                {
                  icon: "🌍",
                  title: "Global Locations",
                  description: "Supports birth locations from anywhere in the world"
                }
              ].map((feature, index) => (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-all duration-300 border-orange-100">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold text-orange-600 mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 