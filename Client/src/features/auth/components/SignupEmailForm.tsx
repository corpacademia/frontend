
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BeakerIcon, AlertCircle, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';

export const SignupEmailForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const sendVerificationEmail = async (emailAddress: string) => {
    try {
      // Replace with your actual API endpoint
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/send-verification`, {
        email: emailAddress
      });
      return response.data.success;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      const success = await sendVerificationEmail(email);
      if (success) {
        setShowVerification(true);
      } else {
        setError('Failed to send verification email. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      const success = await sendVerificationEmail(email);
      if (!success) {
        setError('Failed to resend verification email. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while resending. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen neural-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-8">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Mail className="h-16 w-16 text-primary-400" />
              <CheckCircle className="h-6 w-6 text-emerald-400 absolute -top-1 -right-1 bg-dark-600 rounded-full" />
            </div>
            <h2 className="mt-6 text-center text-4xl font-display font-bold">
              <GradientText>Check Your Email</GradientText>
            </h2>
            <p className="mt-2 text-center text-lg text-gray-300">
              Verification link sent successfully
            </p>
          </div>

          <GlowingBorder>
            <div className="glass-panel p-8 space-y-6 text-center">
              <div className="space-y-4">
                <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                  <p className="text-gray-300 leading-relaxed">
                    We've sent a verification link to <br />
                    <span className="font-semibold text-primary-400">{email}</span>
                  </p>
                </div>
                
                <div className="space-y-3 text-sm text-gray-400 text-left">
                  <p className="flex items-start space-x-2">
                    <span className="text-primary-400 font-bold">1.</span>
                    <span>Click the verification link in your email to activate your account</span>
                  </p>
                  <p className="flex items-start space-x-2">
                    <span className="text-primary-400 font-bold">2.</span>
                    <span>The link will redirect you to complete your profile setup</span>
                  </p>
                  <p className="flex items-start space-x-2">
                    <span className="text-primary-400 font-bold">3.</span>
                    <span>Check your spam folder if you don't see the email within 5 minutes</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-4">
                    Didn't receive the email? No worries, it happens sometimes.
                  </p>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <span className="text-red-200 text-sm">{error}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="btn-secondary w-full flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
                    <span>{resendLoading ? 'Sending...' : 'Resend Verification Email'}</span>
                  </button>
                </div>
              </div>
            </div>
          </GlowingBorder>

          <div className="text-center text-sm space-y-2">
            <p className="text-gray-400">
              Need help?{' '}
              <a href="mailto:support@golabing.ai" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
                Contact Support
              </a>
            </p>
            <p className="text-gray-500">
              Want to use a different email?{' '}
              <button 
                onClick={() => setShowVerification(false)}
                className="font-medium text-primary-400 hover:text-primary-300 transition-colors underline"
              >
                Go Back
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neural-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <BeakerIcon className="h-12 w-12 text-primary-400" />
          <h2 className="mt-6 text-center text-4xl font-display font-bold">
            <GradientText>Join GoLabing.ai</GradientText>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Begin your AI-powered learning journey
          </p>
        </div>

        <GlowingBorder>
          <form className="glass-panel p-8 space-y-6" onSubmit={handleContinue}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-400/70 border border-primary-500/30 rounded-lg
                           text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none
                           focus:ring-2 focus:ring-primary-500/30 transition-colors"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-900/50 border border-red-500/50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-200">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Sending Verification...' : 'Continue'}
            </button>
          </form>
        </GlowingBorder>

        <div className="text-center text-sm">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// This component is imported from another file
const GlowingBorder: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`glow ${className}`}>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
