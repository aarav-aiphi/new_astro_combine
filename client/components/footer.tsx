'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FaOm, FaInstagram, FaFacebook, FaTwitter, FaYoutube } from 'react-icons/fa'

const socialLinks = [
  { icon: <FaInstagram className="w-6 h-6" />, href: '#', label: 'Instagram' },
  { icon: <FaFacebook className="w-6 h-6" />, href: '#', label: 'Facebook' },
  { icon: <FaTwitter className="w-6 h-6" />, href: '#', label: 'Twitter' },
  { icon: <FaYoutube className="w-6 h-6" />, href: '#', label: 'Youtube' }
]

export function Footer() {
  return (
    <footer className="pt-16 pb-8 bg-gradient-to-b from-orange-50 via-white to-orange-50 relative overflow-hidden">
      <div className="absolute inset-0">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 360],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-20 left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [360, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Sanskrit Verse Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-block">
            <FaOm className="w-12 h-12 mx-auto text-amber-500 animate-pulse mb-4" />
            <p className="text-xl font-sanskrit text-amber-900/80 mb-2">
              ॐ सर्वे भवन्तु सुखिनः
            </p>
            <p className="text-amber-700/60 italic">
              "May all beings be happy"
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-red-600">
              About Us
            </h3>
            <p className="text-amber-700/80">
              Expert astrology services and spiritual guidance for your life's journey.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-red-600">
              Sacred Links
            </h3>
            <ul className="space-y-2">
              {['Services', 'Blog', 'Contact'].map((item, index) => (
                <motion.li
                  key={item}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link 
                    href={`/${item.toLowerCase()}`} 
                    className="text-amber-700/80 hover:text-amber-500 transition-colors duration-300"
                  >
                    🕉️ {item}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-red-600">
              Divine Connect
            </h3>
            <ul className="text-amber-700/80 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-amber-500">✉️</span> info@aiphi.ai
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-500">📞</span> +1 (555) 123-7777
              </li>
            </ul>
          </motion.div>

          {/* New Enhanced Newsletter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-1"
          >
            <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-500 to-red-600">
              Divine Updates
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full p-3 rounded-lg bg-gradient-to-b from-orange-50/50 to-white border border-amber-100
                           focus:outline-none focus:border-amber-300 text-amber-700/80 pl-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500">✉️</span>
            </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600
                         text-white px-4 py-3 rounded-lg hover:shadow-lg hover:shadow-orange-200
                         transition-all duration-300 font-semibold"
              >
                Receive Sacred Wisdom
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Social Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="flex justify-center gap-6 mt-12 mb-8"
        >
          {socialLinks.map((social, index) => (
            <motion.a
              key={social.label}
              href={social.href}
              whileHover={{ y: -3, scale: 1.1 }}
              className="text-amber-700/70 hover:text-amber-500 transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {social.icon}
            </motion.a>
          ))}
        </motion.div>

        {/* Decorative Divider */}
        <div className="relative h-px w-full max-w-2xl mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2">
            <FaOm className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Copyright */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="text-amber-700/60">
            <span className="animate-glow inline-block">🕉️</span>
            <span className="mx-2">&copy; {new Date().getFullYear()} AstroAlert by aiphi. All rights reserved.</span>
            <span className="animate-glow inline-block">🕉️</span>
          </p>
        </motion.div>
      </div>
    </footer>
  )
}