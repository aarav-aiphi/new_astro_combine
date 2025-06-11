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
    
    if (experience && (Number(experience) < 0 || Number(experience) > 50)) {
      errors.push("Experience should be between 0 and 50 years");
    }
    
    if (costPerMinute && (Number(costPerMinute) < 1 || Number(costPerMinute) > 1000)) {
      errors.push("Cost per minute should be between 1 and 1000");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setValidationErrors([]);
    setStep((prev) => prev - 1);
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
    <div className="h-[100vh] flex items-center">
      <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
        <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
          Sign Up As Astrologer
        </h2>

        <form className="my-8" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="initial"
                animate="enter"
                exit="exit"
              >
                <div className="flex flex-col space-y-4">
                  <LabelInputContainer>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Tyler"
                      type="text"
                      value={name}
                      onChange={(e) => setname(e.target.value)}
                    />
                  </LabelInputContainer>
                  <LabelInputContainer>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Durden"
                      type="text"
                      value={username}
                      onChange={(e) => setusername(e.target.value)}
                    />
                  </LabelInputContainer>
                  <LabelInputContainer>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      placeholder="projectmayhem@fc.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </LabelInputContainer>
                  <LabelInputContainer>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      placeholder="••••••••"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </LabelInputContainer>
                </div>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="mt-4 w-full bg-black text-white py-2 rounded-md"
                >
                  Next Step →
                </button>
                {validationErrors.length > 0 && (
                  <div className="mt-4">
                    {validationErrors.map((error, index) => (
                      <p key={index} className="text-red-500 text-sm">
                        {error}
                      </p>
                    ))}
                  </div>
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
                <div className="flex flex-col space-y-4">
                  <LabelInputContainer>
                    <Label htmlFor="languages">Languages (comma separated)</Label>
                    <Input
                      id="languages"
                      placeholder="English, Hindi"
                      type="text"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      required
                    />
                  </LabelInputContainer>
                  <LabelInputContainer>
                    <Label htmlFor="experience">Experience (Years)</Label>
                    <Input
                      id="experience"
                      placeholder="5"
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      required
                      min="0"
                      max="50"
                    />
                  </LabelInputContainer>
                  <LabelInputContainer>
                    <Label htmlFor="costPerMinute">Cost Per Minute</Label>
                    <Input
                      id="costPerMinute"
                      placeholder="50"
                      type="number"
                      value={costPerMinute}
                      onChange={(e) => setCostPerMinute(e.target.value)}
                      required
                      min="1"
                      max="1000"
                    />
                  </LabelInputContainer>
                  <LabelInputContainer>
                    <Label htmlFor="about">About</Label>
                    <Input
                      id="about"
                      placeholder="I am an experienced astrologer..."
                      type="text"
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                    />
                  </LabelInputContainer>
                </div>
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="bg-gray-300 text-black py-2 px-4 rounded-md"
                  >
                    ← Previous Step
                  </button>
                  <button
                    type="submit"
                    className="bg-black text-white py-2 px-4 rounded-md disabled:bg-gray-400"
                    disabled={loading}
                  >
                    {loading ? "Signing up..." : "Sign Up →"}
                  </button>
                </div>
                {validationErrors.length > 0 && (
                  <div className="mt-4">
                    {validationErrors.map((error, index) => (
                      <p key={index} className="text-red-500 text-sm">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
                {error && (
                  <p className="text-red-500 mt-4 text-sm">{error}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence><div className="text-center p-2 text-blue-500 mt-4">
                  <Link href="/auth/login">Login Instead</Link>
                </div>
        </form>
      </div>
    </div>
  );
}
