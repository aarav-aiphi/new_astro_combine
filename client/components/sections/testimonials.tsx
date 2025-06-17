'use client';

import { motion } from "framer-motion";
import { FaOm, FaStar, FaQuoteLeft } from "react-icons/fa";
import Image from "next/image";

  const testimonials = [
    {
    quote: "AstroAlert's AI-powered astrology completely transformed my business strategy. The accuracy of their predictions helped me make the right investment decisions at the perfect time. ROI increased by 340% in just 6 months!",
      name: "Priya Sharma",
    designation: "CEO, TechVentures Inc.",
    company: "Fortune 500 Company",
    rating: 5,
      src: "https://img.freepik.com/free-photo/young-girl-red-t-shirt-jean-jacket-leaning-chin-hand-smiling-looking-happy_176474-86837.jpg",
    result: "340% ROI Increase"
  },
  {
    quote: "As a skeptical data scientist, I was amazed by the mathematical precision behind AstroAlert's Vedic calculations. Their platform combines traditional wisdom with modern AI in ways I never thought possible.",
    name: "Dr. Rahul Patel",
    designation: "Senior Data Scientist",
    company: "Google DeepMind",
    rating: 5,
      src: "https://img.freepik.com/free-photo/smiling-businessman-with-phone-downtown_23-2147689110.jpg?t=st=1737013649~exp=1737017249~hmac=7331fe6f4117d180361321698583a009889832add18bea74a34a84f7b8b90202&w=1480",
    result: "Patent Filed"
    },
    {
    quote: "The Vastu Intelligence consultation from AstroAlert revolutionized my architectural practice. We now integrate their smart space optimization in all our luxury projects. Client satisfaction has reached an all-time high.",
      name: "Anita Desai",
    designation: "Principal Architect",
    company: "Desai & Associates",
    rating: 5,
      src: "https://img.freepik.com/free-photo/woman-teaching-classroom_23-2151696436.jpg",
    result: "98% Client Satisfaction"
  },
  {
    quote: "AstroAlert's spiritual guidance helped me navigate through the most challenging period of my startup journey. Their insights on timing and decision-making were phenomenally accurate. We secured Series A funding exactly when they predicted!",
    name: "Arjun Gupta",
    designation: "Founder & CTO",
    company: "Startup Unicorn",
    rating: 5,
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    result: "$50M Series A"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-amber-50 via-orange-50 to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, 180],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{ duration: 35, repeat: Infinity }}
          className="absolute top-20 left-1/4 w-80 h-80 bg-amber-400 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [180, 0],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute bottom-20 right-1/4 w-96 h-96 bg-orange-400 rounded-full blur-3xl"
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
            <FaOm className="w-12 h-12 mx-auto text-amber-500 animate-pulse mb-6" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-500 to-red-600">
            Success Stories
          </h2>
          <p className="text-xl text-amber-700/80 max-w-3xl mx-auto leading-relaxed">
            Discover how industry leaders and visionaries trust AstroAlert's spiritual intelligence to guide their most important decisions.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="h-full bg-gradient-to-br from-white to-amber-50/30 p-8 rounded-3xl border border-amber-100 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 text-amber-300/30">
                  <FaQuoteLeft className="w-8 h-8" />
                </div>

                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-amber-800/90 text-lg leading-relaxed mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>

                {/* Result Badge */}
                <div className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  ✨ {testimonial.result}
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Image
                      src={testimonial.src}
                      alt={testimonial.name}
                      width={60}
                      height={60}
                      className="rounded-full object-cover border-3 border-amber-200"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                      <FaStar className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-900">{testimonial.name}</div>
                    <div className="text-amber-700/70 text-sm">{testimonial.designation}</div>
                    <div className="text-amber-600/60 text-xs font-medium">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-block p-8 bg-gradient-to-r from-white to-amber-50/50 rounded-3xl border border-amber-200">
            <h3 className="text-2xl font-bold text-amber-900 mb-4">
              Join 50,000+ Successful Leaders
            </h3>
            <p className="text-amber-700/80 mb-6 max-w-lg mx-auto">
              From Fortune 500 CEOs to startup founders, discover why industry leaders choose AstroAlert by aiphi for their spiritual intelligence needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                Start Your Success Story
              </motion.button>
              <div className="flex items-center gap-2 text-amber-600 font-medium">
                <span>📞</span>
                <span>Enterprise: info@aiphi.ai</span>
              </div>
            </div>
            
            {/* Company Logos */}
            <div className="mt-8 pt-6 border-t border-amber-100">
              <p className="text-amber-600/70 text-sm mb-4">Trusted by leaders at:</p>
              <div className="flex flex-wrap justify-center items-center gap-6 opacity-60">
                <span className="text-amber-700 font-semibold">Google</span>
                <span className="text-amber-600">•</span>
                <span className="text-amber-700 font-semibold">Microsoft</span>
                <span className="text-amber-600">•</span>
                <span className="text-amber-700 font-semibold">Tesla</span>
                <span className="text-amber-600">•</span>
                <span className="text-amber-700 font-semibold">Apple</span>
                <span className="text-amber-600">•</span>
                <span className="text-amber-700 font-semibold">Meta</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 