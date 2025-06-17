"use client";
import React, { useState, Suspense } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { loginUser, selectLoading, selectError } from "@/redux/userSlice";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiStar, FiEye, FiEyeOff } from "react-icons/fi";

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

const LoginForm = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
    // Clear errors when user starts typing
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);
    
    try {
      const resultAction = await dispatch(loginUser({ 
        email: formData.email, 
        password: formData.password 
      }));
      
      if (loginUser.fulfilled.match(resultAction)) {
        router.push(redirectUrl);
      } else {
        // Handle rejected case
        const errorMessage = resultAction.payload as string;
        setLocalError(errorMessage || 'Login failed');
      }
    } catch (error: any) {
      setLocalError(error?.message || 'Something went wrong');
    }
  };

  return (
    <motion.form 
      className="my-8" 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
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
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
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
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
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

      {(error || localError) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
        >
          <p className="text-red-600 text-sm font-medium">{error || localError}</p>
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
              Connecting to Cosmos...
            </>
          ) : (
            <>
              <FiStar className="w-4 h-4" />
              Begin Your Journey →
            </>
          )}
        </div>
      </motion.button>

      <div className="text-center pt-6">
        <motion.div 
          className="inline-flex items-center gap-2 text-sacred-copper hover:text-sacred-gold transition-colors duration-300"
          whileHover={{ scale: 1.05 }}
        >
          <Link href="/auth/signup" className="font-medium">
            New to the cosmic realm? <span className="text-sacred-gold">Sign Up</span>
          </Link>
        </motion.div>
      </div>
    </motion.form>
  );
};

const LoginFormFallback = () => (
  <div className="my-8">
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="h-12 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

export default function LoginPage() {
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
            
            <h2 className="text-3xl font-bold text-sacred-copper mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sacred-vermilion via-sacred-gold to-sacred-copper">
                Welcome Back
              </span>
            </h2>
            <p className="text-sacred-copper/70 font-medium">
              Continue your cosmic journey
            </p>
          </motion.div>

          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
