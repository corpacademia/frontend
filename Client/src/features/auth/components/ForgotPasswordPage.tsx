
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BeakerIcon, AlertCircle, Mail, RefreshCw, ArrowRight, Clock, Shield } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { GlowingBorder } from '../../../components/ui/GlowingBorder';
import axios from 'axios';

export const ForgotPasswordPage: React.FC = () => {
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

  useEffect(() => {
    if (showVerification && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showVerification, timeLeft]);

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setTimeLeft(600);
    setIsExpired(false);
  };

  const sendPasswordResetCode = async (emailAddress: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/send-password-reset-code`,
        { email: emailAddress }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send reset code');
    }
  };

  const verifyResetCode = async (emailAddress: string, code: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/verify-reset-code`,
        { email: emailAddress, code }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Invalid verification code');
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
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
      const data = await sendPasswordResetCode(email);
      if (data.success) {
        setShowVerification(true);
        resetTimer();
      } else {
        setError(data?.message || 'Failed to send reset code. Please try again.');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    setCodeError('');

    try {
      const data = await sendPasswordResetCode(email);
      if (data.success) {
        resetTimer();
      } else {
        setError(data?.message || 'Failed to resend code. Please try again.');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while resending. Please try again.');
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
      const data = await verifyResetCode(email, verificationCode);
      if (data.success) {
        navigate('/reset-password', { state: { email, resetToken: data.resetToken } });
      } else {
        setCodeError(data?.message || 'Invalid verification code. Please try again.');
      }
    } catch (error: any) {
      setCodeError(error.message || 'An error occurred during verification. Please try again.');
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
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center">
            <Shield className="h-12 w-12 text-primary-400" />
            <h2 className="mt-6 text-center text-4xl font-display font-bold">
              <GradientText>Verify Your Email</GradientText>
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Enter the code sent to {email}
            </p>
          </div>

          <GlowingBorder>
            <form onSubmit={handleVerifyCode} className="glass-panel p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className={`h-5 w-5 ${isExpired ? 'text-red-400' : 'text-primary-400'}`} />
                    <span className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-gray-300'}`}>
                      {isExpired ? 'Code Expired' : `Time remaining: ${formatTime(timeLeft)}`}
                    </span>
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
                    disabled={isExpired}
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
                      : "Didn't receive the code? Check your spam folder or request a new one."}
                  </p>

                  <button
                    type="button"
                    onClick={handleResendCode}
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
                        : 'Resend Code'}
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
          <Shield className="h-12 w-12 text-primary-400" />
          <h2 className="mt-6 text-center text-4xl font-display font-bold">
            <GradientText>Reset Password</GradientText>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your email to receive a verification code
          </p>
        </div>

        <GlowingBorder>
          <form onSubmit={handleSendCode} className="glass-panel p-8 space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-primary-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-300">Email Verification Required</p>
                    <p className="text-xs text-gray-400 mt-1">
                      We'll send a 6-digit verification code to your email address
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-dark-400/70 border border-primary-500/30 rounded-lg
                             text-white placeholder-gray-400 focus:border-primary-500/60 focus:outline-none
                             focus:ring-2 focus:ring-primary-500/30 transition-colors"
                    placeholder="you@example.com"
                    required
                  />
                </div>
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
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
