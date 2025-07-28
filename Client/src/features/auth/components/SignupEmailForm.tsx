
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BeakerIcon, AlertCircle, Mail, RefreshCw, CheckCircle, Shield, ArrowRight, Clock } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';

export const SignupEmailForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const sendVerificationCode = async (emailAddress: string) => {
    try {
      // Replace with your actual API endpoint
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/send-verification-code`, {
        email: emailAddress
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send verification code:', error);
      return {success:false,message:error?.response?.data?.error || error?.response?.data?.message};
    }
  };

  const verifyCode = async (emailAddress: string, code: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/verify-code`, {
        email: emailAddress,
        code: code
      });
      return response.data;
    } catch (error) {
      console.error('Failed to verify code:', error);
      return {success:false,message:error?.response?.data?.error || error?.response?.data?.message};
    }
  };

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showVerification && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showVerification, timeLeft]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Reset timer when verification is sent
  const resetTimer = () => {
    setTimeLeft(600); // Reset to 10 minutes
    setIsExpired(false);
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
      const data = await sendVerificationCode(email);
      if (data.success) {
        setShowVerification(true);
        resetTimer();
      } else {
        setError( data?.message || 'Failed to send verification code. Please try again.');
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
    setCodeError('');
    
    try {
      const data = await sendVerificationCode(email);
      if (data.success) {
        resetTimer();
      } else {
        setError(data?.message || 'Failed to resend verification code. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while resending. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    
    if (!verificationCode || verificationCode.length !== 6) {
      setCodeError('Please enter a valid 6-digit verification code');
      return;
    }

    setVerifyLoading(true);
    
    try {
      const data = await verifyCode(email, verificationCode);
      if (data.success) {
        // Navigate to signup profile page
        navigate('/signupprofile', { state: { email, verified: true } });
      } else {
        setCodeError(data?.message || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      setCodeError('An error occurred during verification. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    setCodeError('');
  };

  if (showVerification) {
    return (
      <div className="min-h-screen neural-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-8">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Shield className="h-16 w-16 text-primary-400" />
              <Mail className="h-6 w-6 text-emerald-400 absolute -top-1 -right-1 bg-dark-600 rounded-full p-1" />
            </div>
            <h2 className="mt-6 text-center text-4xl font-display font-bold">
              <GradientText>Enter Verification Code</GradientText>
            </h2>
            <p className="mt-2 text-center text-lg text-gray-300">
              Check your email for the 6-digit code
            </p>
          </div>

          <GlowingBorder>
            <form className="glass-panel p-8 space-y-6" onSubmit={handleVerifyCode}>
              <div className="space-y-4">
                <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg text-center">
                  <p className="text-gray-300 text-sm mb-1">
                    Verification code sent to
                  </p>
                  <p className="font-semibold text-primary-400">{email}</p>
                </div>

                {/* Countdown Timer */}
                <div className={`p-4 rounded-lg border text-center transition-colors ${
                  isExpired 
                    ? 'bg-red-900/20 border-red-500/40' 
                    : timeLeft <= 60 
                      ? 'bg-orange-900/20 border-orange-500/40' 
                      : 'bg-emerald-900/20 border-emerald-500/40'
                }`}>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Clock className={`h-4 w-4 ${
                      isExpired 
                        ? 'text-red-400' 
                        : timeLeft <= 60 
                          ? 'text-orange-400' 
                          : 'text-emerald-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isExpired 
                        ? 'text-red-400' 
                        : timeLeft <= 60 
                          ? 'text-orange-400' 
                          : 'text-emerald-400'
                    }`}>
                      {isExpired ? 'Code Expired' : 'Time Remaining'}
                    </span>
                  </div>
                  <div className={`text-2xl font-mono font-bold ${
                    isExpired 
                      ? 'text-red-400' 
                      : timeLeft <= 60 
                        ? 'text-orange-400' 
                        : 'text-emerald-400'
                  }`}>
                    {isExpired ? '00:00' : formatTime(timeLeft)}
                  </div>
                  {isExpired && (
                    <p className="text-xs text-red-300 mt-2">
                      Your verification code has expired. Please request a new one.
                    </p>
                  )}
                  {!isExpired && timeLeft <= 60 && (
                    <p className="text-xs text-orange-300 mt-2">
                      Your code expires soon! Enter it quickly or request a new one.
                    </p>
                  )}
                </div>
                
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span>Code sent to your email</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <Shield className="h-4 w-4 text-primary-400" />
                    <span>Enter the 6-digit code to continue</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={handleCodeInputChange}
                    className="w-full px-4 py-3 bg-dark-400/70 border border-primary-500/30 rounded-lg
                             text-white text-center text-2xl font-mono tracking-widest
                             placeholder-gray-400 focus:border-primary-500/60 focus:outline-none
                             focus:ring-2 focus:ring-primary-500/30 transition-colors"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Enter the 6-digit code from your email
                  </p>
                </div>
              </div>

              {(error || codeError) && (
                <div className="rounded-md bg-red-900/50 border border-red-500/50 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-200">{error || codeError}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={verifyLoading || verificationCode.length !== 6 || isExpired}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {verifyLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-4 text-center">
                    {isExpired 
                      ? 'Your verification code has expired. Request a new one to continue.' 
                      : "Didn't receive the code? Check your spam folder or request a new one."
                    }
                  </p>
                  
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className={`w-full flex items-center justify-center space-x-2 ${
                      isExpired ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    <RefreshCw className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendLoading 
                        ? 'Sending...' 
                        : isExpired 
                          ? 'Get New Code' 
                          : 'Resend Code'
                      }
                    </span>
                  </button>
                </div>
              </div>
            </form>
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
                onClick={() => {
                  setShowVerification(false);
                  setVerificationCode('');
                  setCodeError('');
                  setError('');
                }}
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
              {loading ? 'Sending Code...' : 'Send Verification Code'}
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
