"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser, setToken, selectLoading, selectError } from "@/redux/userSlice";
import { motion, AnimatePresence } from "framer-motion";
import { storeAuth } from "@/lib/authHelpers";
import { FiUser, FiMail, FiLock, FiStar, FiEye, FiEyeOff, FiBookOpen, FiGlobe, FiDollarSign, FiArrowRight, FiArrowLeft, FiUser as FiGuru } from "react-icons/fi";

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
  const [step, setStep] = useState(1);

  const [name, setname] = useState("");
  const [username, setusername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [languages, setLanguages] = useState("");
  const [experience, setExperience] = useState("");
  const [costPerMinute, setCostPerMinute] = useState("");
  const [about, setAbout] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();

  const validateStep1 = () => {
    const errors: string[] = [];
    
    if (!name.trim()) errors.push("Name is required");
    if (!username.trim()) errors.push("Username is required");
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

  const validateStep2 = () => {
    const errors: string[] = [];
    
    if (!languages.trim()) errors.push("Languages are required");
    if (!experience.trim()) errors.push("Experience is required");
    if (!costPerMinute.trim()) errors.push("Cost per minute is required");
    if (!about.trim()) errors.push("About section is required");
    
    if (experience && (isNaN(Number(experience)) || Number(experience) < 0)) {
      errors.push("Experience must be a valid number");
    }
    
    if (costPerMinute && (isNaN(Number(costPerMinute)) || Number(costPerMinute) <= 0)) {
      errors.push("Cost per minute must be a valid positive number");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      setValidationErrors([]);
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
    setValidationErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const languagesArray = languages.split(",").map((lang) => lang.trim());

    try {
      const body = {
        name,
        username,
        email,
        password,
        languages: languagesArray,
        experience: Number(experience),
        costPerMinute: Number(costPerMinute),
        about,
        role: 'Astrologer'
      };

      console.log('🚀 Sending astrologer signup request:', { ...body, password: '[HIDDEN]' });

      const res = await fetch('/api/v1/signup/astrologer', {
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
      
      console.log('✅ Astrologer signup successful, storing auth...');
      storeAuth(data.token);
      dispatch(setUser(data.user));
      dispatch(setToken(data.token));
      
      console.log('🏠 Redirecting to home...');
      router.push("/");
    } catch (err: any) {
      console.error("❌ Astrologer signup error:", err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, x: -20 },
    enter: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden
                    bg-gradient-to-br from-sacred-sandal via-white to-sacred-saffron/10">
      
      {/* Enhanced Cosmic Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-sacred-gold/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-sacred-vermilion/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-32 h-32 bg-sacred-copper/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Sacred Symbols */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-sacred-gold opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 12 + 12}px`,
            }}
            animate={{ 
              y: [-15, 15],
              opacity: [0.2, 0.8, 0.2],
              rotate: [0, 360],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              repeatType: "reverse",
              delay: Math.random() * 2,
            }}
          >
            {['✦', '⭐', '🌟', '✨', '🔯', '☪️'][Math.floor(Math.random() * 6)]}
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="relative z-10 max-w-lg w-full mx-auto p-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-sacred-gold/20
                      hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-500">
          
          {/* Enhanced Header with Sacred Symbol */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative inline-block mb-4">
              <motion.div
                className="text-5xl"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              >
                🕉️
              </motion.div>
              <motion.div
                className="absolute -top-2 -right-2 text-xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⭐
              </motion.div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <FiGuru className="w-6 h-6 text-sacred-gold" />
              <h2 className="text-3xl font-bold text-sacred-copper">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sacred-vermilion via-sacred-gold to-sacred-copper">
                  Join as Guru
                </span>
        </h2>
            </div>
            <p className="text-sacred-copper/70 font-medium">
              Share your cosmic wisdom with seekers
            </p>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                step === 1 ? "bg-sacred-gold" : "bg-sacred-gold/30"
              )} />
              <div className="w-8 h-0.5 bg-sacred-gold/30" />
              <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                step === 2 ? "bg-sacred-gold" : "bg-sacred-gold/30"
              )} />
            </div>
            <p className="text-xs text-sacred-copper/60 mt-2">
              Step {step} of 2
            </p>
          </motion.div>

          <motion.form 
            className="my-8" 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="initial"
                animate="enter"
                exit="exit"
              >
                  <div className="flex flex-col space-y-6">
                  <LabelInputContainer>
                      <Label htmlFor="name" className="text-sacred-copper font-medium flex items-center gap-2">
                        <FiUser className="w-4 h-4" />
                        Full Name
                      </Label>
                      <div className="relative">
                    <Input
                      id="name"
                          placeholder="Your complete name"
                      type="text"
                      value={name}
                      onChange={(e) => setname(e.target.value)}
                          className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-sacred-gold/30 
                                   focus:border-sacred-gold focus:ring-sacred-gold/20 rounded-xl
                                   placeholder:text-gray-400 text-sacred-copper transition-all duration-300"
                    />
                        <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 w-4 h-4" />
                      </div>
                  </LabelInputContainer>

                  <LabelInputContainer>
                      <Label htmlFor="username" className="text-sacred-copper font-medium flex items-center gap-2">
                        <FiGuru className="w-4 h-4" />
                        Username
                      </Label>
                      <div className="relative">
                    <Input
                      id="username"
                          placeholder="Choose a unique username"
                      type="text"
                      value={username}
                      onChange={(e) => setusername(e.target.value)}
                          className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-sacred-gold/30 
                                   focus:border-sacred-gold focus:ring-sacred-gold/20 rounded-xl
                                   placeholder:text-gray-400 text-sacred-copper transition-all duration-300"
                    />
                        <FiGuru className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 w-4 h-4" />
                      </div>
                  </LabelInputContainer>

                  <LabelInputContainer>
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
                          className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-sacred-gold/30 
                                   focus:border-sacred-gold focus:ring-sacred-gold/20 rounded-xl
                                   placeholder:text-gray-400 text-sacred-copper transition-all duration-300"
                    />
                        <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 w-4 h-4" />
                      </div>
                  </LabelInputContainer>

                  <LabelInputContainer>
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
                </div>

                  <motion.button
                  type="button"
                  onClick={handleNextStep}
                    className="mt-8 w-full h-12 bg-gradient-to-r from-sacred-vermilion via-sacred-gold to-sacred-copper
                             text-white rounded-xl font-medium hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] 
                             transition-all duration-300 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue Journey <FiArrowRight className="w-4 h-4" />
                  </motion.button>

                {validationErrors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                    >
                    {validationErrors.map((error, index) => (
                        <p key={index} className="text-red-600 text-sm font-medium">
                          • {error}
                      </p>
                    ))}
                    </motion.div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="initial"
                animate="enter"
                exit="exit"
              >
                  <div className="flex flex-col space-y-6">
                  <LabelInputContainer>
                      <Label htmlFor="languages" className="text-sacred-copper font-medium flex items-center gap-2">
                        <FiGlobe className="w-4 h-4" />
                        Languages (comma separated)
                      </Label>
                      <div className="relative">
                    <Input
                      id="languages"
                          placeholder="e.g., English, Hindi, Sanskrit"
                      type="text"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                          className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-sacred-gold/30 
                                   focus:border-sacred-gold focus:ring-sacred-gold/20 rounded-xl
                                   placeholder:text-gray-400 text-sacred-copper transition-all duration-300"
                    />
                        <FiGlobe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 w-4 h-4" />
                      </div>
                  </LabelInputContainer>

                  <LabelInputContainer>
                      <Label htmlFor="experience" className="text-sacred-copper font-medium flex items-center gap-2">
                        <FiBookOpen className="w-4 h-4" />
                        Years of Experience
                      </Label>
                      <div className="relative">
                    <Input
                      id="experience"
                          placeholder="e.g., 5"
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                          className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-sacred-gold/30 
                                   focus:border-sacred-gold focus:ring-sacred-gold/20 rounded-xl
                                   placeholder:text-gray-400 text-sacred-copper transition-all duration-300"
                    />
                        <FiBookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 w-4 h-4" />
                      </div>
                  </LabelInputContainer>

                  <LabelInputContainer>
                      <Label htmlFor="costPerMinute" className="text-sacred-copper font-medium flex items-center gap-2">
                        <FiDollarSign className="w-4 h-4" />
                        Rate per Minute (₹)
                      </Label>
                      <div className="relative">
                    <Input
                      id="costPerMinute"
                          placeholder="e.g., 50"
                      type="number"
                      value={costPerMinute}
                      onChange={(e) => setCostPerMinute(e.target.value)}
                          className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-sacred-gold/30 
                                   focus:border-sacred-gold focus:ring-sacred-gold/20 rounded-xl
                                   placeholder:text-gray-400 text-sacred-copper transition-all duration-300"
                    />
                        <FiDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 w-4 h-4" />
                      </div>
                  </LabelInputContainer>

                  <LabelInputContainer>
                      <Label htmlFor="about" className="text-sacred-copper font-medium flex items-center gap-2">
                        <FiStar className="w-4 h-4" />
                        About Yourself
                      </Label>
                      <div className="relative">
                    <Input
                      id="about"
                          placeholder="Share your astrological journey and expertise..."
                      type="text"
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                          className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-sacred-gold/30 
                                   focus:border-sacred-gold focus:ring-sacred-gold/20 rounded-xl
                                   placeholder:text-gray-400 text-sacred-copper transition-all duration-300"
                    />
                        <FiStar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sacred-gold/60 w-4 h-4" />
                      </div>
                  </LabelInputContainer>
                </div>

                  <div className="flex justify-between mt-8 gap-4">
                    <motion.button
                    type="button"
                    onClick={handlePreviousStep}
                      className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium
                               transition-all duration-300 flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiArrowLeft className="w-4 h-4" /> Previous
                    </motion.button>
                    
                    <motion.button
                    type="submit"
                      className={cn(
                        "flex-1 h-12 text-white rounded-xl font-medium overflow-hidden group",
                        "bg-gradient-to-r from-sacred-vermilion via-sacred-gold to-sacred-copper",
                        "hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300",
                        loading && "opacity-70 cursor-not-allowed"
                      )}
                    disabled={loading}
                      whileHover={!loading ? { scale: 1.02 } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                    >
                      <div className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <motion.div
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Creating Profile...
                          </>
                        ) : (
                          <>
                            <FiStar className="w-4 h-4" />
                            Begin Teaching →
                          </>
                        )}
                      </div>
                    </motion.button>
                </div>

                {validationErrors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl"
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
                      className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                    >
                      <p className="text-red-600 text-sm font-medium">{error}</p>
                    </motion.div>
                )}
              </motion.div>
            )}
            </AnimatePresence>

            <div className="text-center pt-6">
              <motion.div 
                className="inline-flex items-center gap-2 text-sacred-copper hover:text-sacred-gold transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <Link href="/auth/login" className="font-medium">
                  Already sharing wisdom? <span className="text-sacred-gold">Login</span>
                </Link>
              </motion.div>
                </div>
          </motion.form>
      </div>
      </motion.div>
    </div>
  );
}
