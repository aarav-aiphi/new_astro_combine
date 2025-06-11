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

// Reusable container
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
    <div className="h-[100vh] flex items-center">
      <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
        <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
          Sign Up As User
        </h2>

        <form className="my-8" onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <LabelInputContainer>
              <Label htmlFor="firstname">First name</Label>
              <Input
                id="firstname"
                placeholder="Tyler"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="lastname">Last name</Label>
              <Input
                id="lastname"
                placeholder="Durden"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </LabelInputContainer>
          </div>

          <LabelInputContainer className="mb-4">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              placeholder="projectmayhem@fc.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </LabelInputContainer>

          {validationErrors.length > 0 && (
            <div className="mb-4">
              {validationErrors.map((error, index) => (
                <p key={index} className="text-red-500 text-sm">
                  {error}
                </p>
              ))}
            </div>
          )}

          {error && (
            <p className="text-red-500 mb-4 text-sm">
              {error}
            </p>
          )}

          <button
            className="relative group/btn bg-black bg-opacity-85 dark:from-zinc-900
                       dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800
                       w-full text-white rounded-md h-10 font-medium disabled:bg-gray-400"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up →"}
          </button>

          <div className="text-center p-2 text-blue-500 ">
            <Link href="/auth/login">Login Instead</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
