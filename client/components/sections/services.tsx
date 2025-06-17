'use client';
import Image from "next/image";
import { motion } from "framer-motion";
import { FaOm, FaStar, FaUsers, FaShieldAlt, FaClock } from "react-icons/fa";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";

const services = [
  {
    name: "Vedic Astrology",
    description: "Ancient wisdom for modern life decisions. Get personalized insights from certified Vedic astrologers.",
    image: "https://pujayagna.com/cdn/shop/products/horoscope-2015_grande.jpg?v=1569021287",
    icon: "🕉️",
    features: ["Birth Chart Analysis", "Career Guidance", "Relationship Compatibility"]
  },
  {
    name: "AI-Powered Predictions",
    description: "Revolutionary AI technology combined with traditional astrology for accurate life predictions.",
    image: "https://images.unsplash.com/photo-1627764574958-fb54cd7d7448?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHRhcm90fGVufDB8fDB8fHww",
    icon: "🔮",
    features: ["Machine Learning Models", "Pattern Recognition", "Real-time Analysis"]
  },
  {
    name: "Numerology Science",
    description: "Decode the mystical language of numbers with scientific precision and spiritual wisdom.",
    image: "https://img.freepik.com/free-photo/numerology-concept-still-life_23-2150171520.jpg?t=st=1737013108~exp=1737016708~hmac=f036da630ead226b2f117fa137b8e77b0ee4e3c12135584afee482da3d62074b&w=1480",
    icon: "🔢",
    features: ["Life Path Numbers", "Business Name Analysis", "Lucky Numbers"]
  },
  {
    name: "Vastu Intelligence",
    description: "Smart space harmonization using advanced Vastu principles and modern architecture.",
    image: "https://i.pinimg.com/736x/c1/47/3e/c1473ef3855bd7c5fcc8ab99c7cddbaa.jpg",
    icon: "🏠",
    features: ["Smart Home Design", "Energy Optimization", "3D Vastu Mapping"]
  }
];

const stats = [
  { icon: <FaUsers className="w-6 h-6" />, number: "50K+", label: "Happy Clients" },
  { icon: <FaStar className="w-6 h-6" />, number: "4.9/5", label: "Client Rating" },
  { icon: <FaShieldAlt className="w-6 h-6" />, number: "99%", label: "Accuracy Rate" },
  { icon: <FaClock className="w-6 h-6" />, number: "24/7", label: "Support Available" }
];

export function ServicesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-orange-50 via-white to-amber-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 360],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute top-10 right-10 w-64 h-64 bg-amber-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [360, 0],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-10 left-10 w-48 h-48 bg-orange-500 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block">
            <FaOm className="w-16 h-16 mx-auto text-amber-500 animate-pulse mb-6" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-500 to-red-600">
            Spiritual Intelligence Services
          </h2>
                     <p className="text-xl text-amber-700/80 max-w-3xl mx-auto leading-relaxed">
             AstroAlert combines ancient Vedic wisdom with cutting-edge AI technology to provide you with the most accurate and personalized spiritual guidance.
           </p>
           <div className="mt-6 flex items-center justify-center gap-2">
             <span className="text-amber-600 font-semibold">Powered by</span>
             <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
               aiphi
             </span>
             <span className="text-amber-500">✨</span>
           </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-amber-100"
            >
              <div className="text-amber-500 mb-3 flex justify-center">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-amber-900 mb-1">{stat.number}</div>
              <div className="text-amber-700/70 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <Card className="h-full bg-gradient-to-br from-white to-orange-50/50 border border-amber-100 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <CardHeader className="relative h-[200px] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="text-4xl">{service.icon}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <CardTitle className="text-xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                    {service.name}
                  </CardTitle>
                  <CardDescription className="text-amber-700/80 mb-4 leading-relaxed">
                    {service.description}
                  </CardDescription>
                  
                  <div className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-amber-600">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
                
                <CardFooter className="p-6 pt-0">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-200 transition-all duration-300"
                  >
                    Get Started
                  </motion.button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="inline-block p-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl border border-amber-200">
            <h3 className="text-2xl font-bold text-amber-900 mb-4">
              Ready to Discover Your Cosmic Blueprint?
            </h3>
                         <p className="text-amber-700/80 mb-6 max-w-md mx-auto">
               Join thousands who trust AstroAlert by aiphi for their spiritual guidance and life decisions.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
               >
                 Book Free Consultation
               </motion.button>
               <div className="text-amber-600 font-medium">
                 📧 info@aiphi.ai
               </div>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

