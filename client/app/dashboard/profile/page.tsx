"use client";

import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { selectUser, fetchCurrentUser } from '@/redux/userSlice';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { ArrowLeft, Edit, Save, X, Camera, User, Mail, Calendar, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from "@/components/ui/use-toast";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    avatar: ''
  });
  
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (!user) {
      dispatch(fetchCurrentUser());
    } else {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
    }
  }, [user, dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      dispatch(fetchCurrentUser()); // Refresh user data
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          </div>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save'}</span>
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full ring-4 ring-orange-200 overflow-hidden">
                      <Image
                        src={user.avatar || "/default-avatar.svg"}
                        alt={user.name}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-orange-500 hover:bg-orange-600"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-600">@{user.username}</p>
                    <div className="flex items-center justify-center mt-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      <Shield className="w-4 h-4 mr-1" />
                      {user.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="mt-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Account Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sessions Completed</span>
                    <span className="font-semibold text-orange-600">
                      {user.sessionsCompleted || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-semibold">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Full Name</span>
                    </Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="transition-all duration-200 focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                        {user.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Username</span>
                    </Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="transition-all duration-200 focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                        {user.username}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="transition-all duration-200 focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Member Since</span>
                    </Label>
                    <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Profile Picture URL</Label>
                    <Input
                      id="avatar"
                      name="avatar"
                      value={formData.avatar}
                      onChange={handleInputChange}
                      placeholder="Enter image URL"
                      className="transition-all duration-200 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 