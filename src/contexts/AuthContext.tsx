// Authentication Context - Manages user authentication state across the app

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authApi.getStoredUser();
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        try {
          // Verify token is still valid by fetching current user
          const response = await authApi.getMe();
          if (response.success && response.data) {
            setUser(response.data);
            // Update stored user with latest data
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            // Invalid token, clear storage
            authApi.logout();
            setUser(null);
          }
        } catch (error) {
          // Token expired or invalid
          authApi.logout();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        toast({
          title: 'Login successful',
          description: `Welcome back, ${response.data.user.name}!`,
        });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const response = await authApi.signup({ name, email, password, phone });
      
      if (response.success) {
        toast({
          title: 'Account created!',
          description: 'Please check your email for verification code (check console for development)',
        });
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
      const validationErrors = error.response?.data?.errors;
      
      if (validationErrors && Array.isArray(validationErrors)) {
        const errorMessages = validationErrors.map((err: any) => err.message).join(', ');
        toast({
          title: 'Validation error',
          description: errorMessages,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      throw error;
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      const response = await authApi.verifyEmail({ email, otp });
      
      if (response.success) {
        toast({
          title: 'Email verified!',
          description: 'You can now login to your account.',
        });
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Verification failed';
      toast({
        title: 'Verification failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const resendOtp = async (email: string) => {
    try {
      const response = await authApi.resendOtp({ email });
      
      if (response.success) {
        toast({
          title: 'OTP sent',
          description: 'Please check your email for new verification code (check console for development)',
        });
      } else {
        throw new Error(response.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resend OTP';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    verifyEmail,
    resendOtp,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
