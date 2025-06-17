"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks"; 
import { setUser, setToken, selectLoading, selectError } from "@/redux/userSlice";
import { storeAuth } from "@/lib/authHelpers";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiLock, FiStar, FiEye, FiEyeOff, FiUsers } from "react-icons/fi";

// Reusable container with enhanced astrology styling
const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const router   = useRouter();

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!firstName.trim()) errors.push("First name is required");
    if (!lastName.trim()) errors.push("Last name is required");
    if (!email.trim()) errors.push("Email is required");
    if (!password.trim()) errors.push("Password is required");
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Please enter a valid email address");
    }
    
    if (password && password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Date.now()}`;
      const body = { 
        name: `${firstName} ${lastName}`, 
        username, 
        email, 
        password, 
        role: 'User' 
      };
      
      console.log('🚀 Sending signup request:', { ...body, password: '[HIDDEN]' });
      
      const res = await fetch('/api/v1/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });
      
      console.log('📡 Response status:', res.status);
      const data = await res.json();
      console.log('📊 Response data:', data);
      
      if (!res.ok) {
        // Handle different response formats
        const errorMessage = typeof data === 'string' ? data : data.message || 'Signup failed';
        throw new Error(errorMessage);
      }
      
      console.log('✅ Signup successful, storing auth...');
      storeAuth(data.token);
      dispatch(setUser(data.user));
      dispatch(setToken(data.token));
      
      console.log('🏠 Redirecting to home...');
      router.push("/");
    } catch (err: any) {
      console.error("❌ User signup error:", err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden
                    bg-gradient-to-br from-sacred-sandal via-white to-sacred-saffron/10">
      
      {/* Cosmic Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-sacred-gold/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-sacred-vermilion/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-32 h-32 bg-sacred-copper/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-sacred-gold opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 8 + 8}px`,
            }}
            animate={{ 
              y: [-10, 10],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: "reverse",
              delay: Math.random() * 2,
            }}
          >
            ✦
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="relative z-10 max-w-md w-full mx-auto p-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-sacred-gold/20
                      hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-500">
          
          {/* Header with Sacred Symbol */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative inline-block mb-4">
              <motion.div
                className="text-4xl"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                🕉️
              </motion.div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <FiUsers className="w-6 h-6 text-sacred-gold" />
              <h2 className="text-3xl font-bold text-sacred-copper">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sacred-vermilion via-sacred-gold to-sacred-copper">
                  Join as Seeker
                </span>
              </h2>
            </div>
            <p className="text-sacred-copper/70 font-medium">
              Begin your spiritual journey
            </p>
          </motion.div>

          <motion.form 
            className="my-8" 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
              <LabelInputContainer>
                <Label htmlFor="firstname" className="text-sacred-copper font-medium flex items-center gap-2">
                  <FiUser className="w-4 h-4" />
                  First name
                </Label>
                <div className="relative">
                  <Input
                    id="firstname"
                    placeholder="Your first name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-sacred-gold/30 
                             focus:border-sacred-gold focus:ring-sacred-gold/20 rounded-xl
                             placeholder:text-gray-400 text-sacred-copper transition-all duration-300"
                  />
                  <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 w-4 h-4" />
                </div>
              </LabelInputContainer>
              
              <LabelInputContainer>
                <Label htmlFor="lastname" className="text-sacred-copper font-medium flex items-center gap-2">
                  <FiUser className="w-4 h-4" />
                  Last name
                </Label>
                <div className="relative">
                  <Input
                    id="lastname"
                    placeholder="Your last name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-sacred-gold/30 
                             focus:border-sacred-gold focus:ring-sacred-gold/20 rounded-xl
                             placeholder:text-gray-400 text-sacred-copper transition-all duration-300"
                  />
                  <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 w-4 h-4" />
                </div>
              </LabelInputContainer>
            </div>

            <LabelInputContainer className="mb-6">
              <Label htmlFor="email" className="text-sacred-copper font-medium flex items-center gap-2">
                <FiMail className="w-4 h-4" />
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  placeholder="your.email@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-sacred-gold/30 
                           focus:border-sacred-gold focus:ring-sacred-gold/20 rounded-xl
                           placeholder:text-gray-400 text-sacred-copper transition-all duration-300"
                />
                <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 w-4 h-4" />
              </div>
            </LabelInputContainer>

            <LabelInputContainer className="mb-6">
              <Label htmlFor="password" className="text-sacred-copper font-medium flex items-center gap-2">
                <FiLock className="w-4 h-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  placeholder="Create a secure password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-12 pr-12 h-12 bg-white/80 backdrop-blur-sm border-sacred-gold/30 
                           focus:border-sacred-gold focus:ring-sacred-gold/20 rounded-xl
                           placeholder:text-gray-400 text-sacred-copper transition-all duration-300"
                />
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 w-4 h-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 hover:text-sacred-gold transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </LabelInputContainer>

            {validationErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
              >
                {validationErrors.map((error, index) => (
                  <p key={index} className="text-red-600 text-sm font-medium">
                    • {error}
                  </p>
                ))}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
              >
                <p className="text-red-600 text-sm font-medium">
                  {error}
                </p>
              </motion.div>
            )}

            <motion.button
              className={cn(
                "relative w-full h-12 text-white rounded-xl font-medium overflow-hidden group",
                "bg-gradient-to-r from-sacred-vermilion via-sacred-gold to-sacred-copper",
                "hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300",
                loading && "opacity-70 cursor-not-allowed"
              )}
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-sacred-gold/20 to-transparent 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Creating Your Cosmic Profile...
                  </>
                ) : (
                  <>
                    <FiStar className="w-4 h-4" />
                    Begin My Journey →
                  </>
                )}
              </div>
            </motion.button>

            <div className="text-center pt-6">
              <motion.div 
                className="inline-flex items-center gap-2 text-sacred-copper hover:text-sacred-gold transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <Link href="/auth/login" className="font-medium">
                  Already exploring the cosmos? <span className="text-sacred-gold">Login</span>
                </Link>
              </motion.div>
            </div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
