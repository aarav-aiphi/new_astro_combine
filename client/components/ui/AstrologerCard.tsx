"use client";

import React, { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalTrigger,
} from "./animated-modal";
import { cn, getCookie, getApiBaseUrl } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setConnectingAstrologer, clearConnectingAstrologer } from '@/redux/chatSlice';
import { selectUser } from '@/redux/userSlice';
import Image from 'next/image';
import { AstrologerData, Specialization } from '@/types/astrologer';
import Link from 'next/link';
import PromoRibbon from './PromoRibbon';

interface AstrologerCardProps {
  astrologer: AstrologerData;
}

// Rate Badge Component
const RateBadge = ({ astrologer }: { astrologer: AstrologerData }) => {
  const hasSpecificRates = astrologer.ratePaisePerMinChat || astrologer.ratePaisePerMinCall;
  
  if (hasSpecificRates) {
    return (
      <div className="absolute top-10 right-2 flex flex-col gap-1 z-10">
        {astrologer.ratePaisePerMinChat && (
          <div 
            className="badge badge-info text-xs px-2 py-1 cursor-pointer"
            title="Chat rate - Applies to first minute; billed per sec"
          >
            Chat: ₹{(astrologer.ratePaisePerMinChat / 100).toFixed(0)}/min
          </div>
        )}
        {astrologer.ratePaisePerMinCall && (
          <div 
            className="badge badge-info text-xs px-2 py-1 cursor-pointer"
            title="Call rate - Applies to first minute; billed per sec"
          >
            Call: ₹{(astrologer.ratePaisePerMinCall / 100).toFixed(0)}/min
          </div>
        )}
      </div>
    );
  }
  
  // Fallback to costPerMinute
  const rate = astrologer.ratePaisePerMin 
    ? (astrologer.ratePaisePerMin / 100).toFixed(0)
    : astrologer.costPerMinute.toString();
    
  return (
    <div className="absolute top-10 right-2 z-10">
      <div 
        className="badge badge-info text-xs px-2 py-1 cursor-pointer"
        title="Rate - Applies to first minute; billed per sec"
      >
        ₹{rate}/min
      </div>
    </div>
  );
};

const AstrologerCard = ({ astrologer }: AstrologerCardProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    date: '',
    time: '',
    place: ''
  });

  // Check if user is eligible for first session promo
  const isFirstSession = user?.sessionsCompleted === 0;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {  
    e.preventDefault();
    
    // Debug authentication
    const cookieToken = getCookie('token');
    const localStorageToken = localStorage.getItem('token');
    console.log('🔍 Cookie token:', cookieToken ? `${cookieToken.substring(0, 20)}...` : 'null');
    console.log('🔍 LocalStorage token:', localStorageToken ? `${localStorageToken.substring(0, 20)}...` : 'null');
    
    // Use localStorage token as fallback if cookie is empty
    const token = localStorageToken || cookieToken;
    
    if (!token) {
      alert('Please log in first to start a chat');
      return;
    }
    
    try {
      dispatch(setConnectingAstrologer({
        id: astrologer._id,
        name: astrologer.user.name,
      }));
      
      console.log('🚀 Making chat init request...');
      console.log('🚀 Astrologer ID:', astrologer._id);
      console.log('🚀 Form data:', formData);
      
      const response = await fetch(`${getApiBaseUrl()}/chat/init`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          astrologerId: astrologer.user._id,
          userDetails: formData
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response OK:', response.ok);
      console.log('📡 Response URL:', response.url);

      if (response.status === 401 || response.status === 403) {
        // Token invalid or expired – clear auth and redirect to login
        localStorage.removeItem('token');
        alert('Session expired. Please log in again.');
        router.push(`/auth/login?redirectUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Chat init successful:', data);
      
      dispatch(clearConnectingAstrologer());
      router.push(`/chat-with-astrologer/chat?chatId=${data.chatId}`);
    } catch (error: any) {
      dispatch(clearConnectingAstrologer());
      console.error('💥 Chat init error:', error);
      alert(`Failed to start chat: ${error.message}`);
    }
  };

  // Renders rating stars
  const renderStars = (rating: number) => {
    const stars = [];
    const roundedRating = Math.round(rating);

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i <= roundedRating ? 'text-green-500 fill-green-500' : 'text-gray-400'}`}
        />
      );
    }
    return stars;
  };

  const formatSpecializations = (specializations: Specialization[]) => {
    return specializations.map(spec => spec.specialization.name).join(', ');
  };

  const formatLanguages = (languages: string[]) => {
    return languages.join(', ');
  };

  return (
    <div className="flex flex-col bg-white shadow-sm border border-slate-200 rounded-lg my-6 w-96 relative overflow-hidden">
      <RateBadge astrologer={astrologer} />
      <PromoRibbon show={isFirstSession} />
      
      <Link href={`/chat-with-astrologer/${astrologer._id}`}>
        <div className="m-2.5 overflow-hidden rounded-md h-80 flex justify-center items-center">
          <Image
            className="w-full h-full object-cover"
            width={100}
            height={100}
            src={astrologer.user.avatar}
            alt={astrologer.user.name}
          />
        </div>
        <div className="p-3 text-center">
          <div className="flex justify-center mb-2">
            {renderStars(typeof astrologer.averageRating === 'number' ? astrologer.averageRating : 0)}
          </div>
          <h4 className="mb-1 text-xl font-semibold text-slate-800">
            {astrologer.user.name}
          </h4>
          <p className="text-sm font-medium text-gray-600">
            {formatSpecializations(astrologer.specializations)}
          </p>
          <p className="text-sm font-medium text-gray-600">{formatLanguages(astrologer.languages)}</p>
          <p className="text-sm font-medium text-gray-600">Exp: {astrologer.experience} Years</p>
          <p className="text-sm font-medium text-red-600">₹{astrologer.costPerMinute}/min</p>
        </div>
      </Link>
      <div className="flex justify-center p-6 pt-1">
        <Modal>
          <ModalTrigger className="bg-black dark:bg-white dark:text-black text-white flex justify-center group/modal-btn">
            <span className="group-hover/modal-btn:translate-x-40 text-center transition duration-500">
              Chat / Call
            </span>
            <div className="-translate-x-40 group-hover/modal-btn:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 text-white z-20">
              Now
            </div>
          </ModalTrigger>

          <ModalBody>
            <form onSubmit={handleSubmit}>
              <ModalContent>
                <h4 className="text-lg md:text-2xl text-neutral-600 dark:text-neutral-100 font-bold text-center mb-8">
                  We Need Your Info To Chat with{" "}
                  <span className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 dark:border-neutral-700 border border-gray-200">
                    {astrologer.user.name}
                  </span>
                </h4>

                <div className='flex'>
                  <LabelInputContainer>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Satyam"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </LabelInputContainer>
                  <LabelInputContainer>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="flex h-10 w-full bg-gray-50 dark:bg-zinc-800 text-black dark:text-white rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </LabelInputContainer>
                </div>
                <div className='flex'>
                  <LabelInputContainer>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      className="w-full"
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                  </LabelInputContainer>

                  <LabelInputContainer>
                    <Label htmlFor="time">Time of Birth</Label>
                    <Input
                      id="time"
                      type="time"
                      className="w-full"
                      value={formData.time}
                      onChange={handleInputChange}
                    />
                  </LabelInputContainer>
                </div>
                <LabelInputContainer>
                  <Label htmlFor="place">Place of Birth</Label>
                  <Input
                    id="place"
                    placeholder="Hyderabad"
                    type="text"
                    value={formData.place}
                    onChange={handleInputChange}
                  />
                </LabelInputContainer>

                <button
                  className="bg-black text-white dark:bg-white dark:text-black relative group/btn w-full rounded-md h-10 font-medium"
                  type="submit"
                >
                  Chat &rarr;
                </button>
              </ModalContent>
            </form>
          </ModalBody>
        </Modal>
      </div>
    </div>
  );
};

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

export default AstrologerCard;