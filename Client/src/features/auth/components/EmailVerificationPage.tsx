
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BeakerIcon, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import axios from 'axios';

export const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userEmail = searchParams.get('email');
    
    if (userEmail) {
      setEmail(userEmail);
    }

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/verify-email`, {
        token
      });

      if (response.data.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        setEmail(response.data.email || email);
        
        // Redirect to profile setup after 3 seconds
        setTimeout(() => {
          navigate('/signupprofile', { state: { email: response.data.email || email } });
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Verification failed. Please try again.');
      }
    } catch (error: any) {
      if (error.response?.status === 410) {
        setStatus('expired');
        setMessage('This verification link has expired. Please request a new one.');
      } else {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    }
  };

  const handleRequestNewLink = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen neural-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <div className="flex flex-col items-center">
          {status === 'verifying' && (
            <>
              <div className="relative">
                <BeakerIcon className="h-16 w-16 text-primary-400" />
                <Loader className="h-6 w-6 text-primary-400 absolute -top-1 -right-1 animate-spin" />
              </div>
              <h2 className="mt-6 text-center text-4xl font-display font-bold">
                <GradientText>Verifying Email</GradientText>
              </h2>
              <p className="mt-2 text-center text-lg text-gray-300">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-emerald-400" />
              </div>
              <h2 className="mt-6 text-center text-4xl font-display font-bold">
                <GradientText>Email Verified!</GradientText>
              </h2>
              <p className="mt-2 text-center text-lg text-gray-300">
                Welcome to GoLabing.ai
              </p>
            </>
          )}

          {(status === 'error' || status === 'expired') && (
            <>
              <div className="relative">
                <AlertCircle className="h-16 w-16 text-red-400" />
              </div>
              <h2 className="mt-6 text-center text-4xl font-display font-bold">
                <GradientText>Verification Failed</GradientText>
              </h2>
              <p className="mt-2 text-center text-lg text-gray-300">
                {status === 'expired' ? 'Link Expired' : 'Something went wrong'}
              </p>
            </>
          )}
        </div>

        <GlowingBorder>
          <div className="glass-panel p-8 space-y-6 text-center">
            {status === 'verifying' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Loader className="h-5 w-5 text-primary-400 animate-spin" />
                  <span className="text-gray-300">Verifying your email address...</span>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-emerald-300 font-medium">
                    {message}
                  </p>
                  {email && (
                    <p className="text-emerald-400 text-sm mt-2">
                      Email: {email}
                    </p>
                  )}
                </div>
                
                <div className="text-sm text-gray-400">
                  <p>You'll be redirected to complete your profile in a few seconds...</p>
                  <div className="mt-4">
                    <button
                      onClick={() => navigate('/signupprofile', { state: { email } })}
                      className="btn-primary"
                    >
                      Continue to Profile Setup
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(status === 'error' || status === 'expired') && (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-300">
                    {message}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleRequestNewLink}
                    className="btn-primary w-full"
                  >
                    Request New Verification Link
                  </button>
                  
                  <p className="text-sm text-gray-400">
                    Or{' '}
                    <Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors">
                      sign in
                    </Link>
                    {' '}if you already have an account
                  </p>
                </div>
              </div>
            )}
          </div>
        </GlowingBorder>

        <div className="text-center text-sm">
          <p className="text-gray-400">
            Need help?{' '}
            <a href="mailto:support@golabing.ai" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// GlowingBorder component
const GlowingBorder: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`glow ${className}`}>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
