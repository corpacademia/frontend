import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BeakerIcon, AlertCircle } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm';
import { FormInput } from './FormInput';
import { GradientText } from '../../../components/ui/GradientText';
import { GlowingBorder } from '../../../components/ui/GlowingBorder';
import { DemoUsers } from './DemoUsers';
import axios from 'axios';

export const LoginForm: React.FC = () => {
  const { formData, errors, loading, handleChange, handleSubmit } = useLoginForm();
 
  
 return (
    <div className="min-h-screen neural-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <BeakerIcon className="h-12 w-12 text-primary-400" />
          <h2 className="mt-6 text-center text-4xl font-display font-bold">
            <GradientText>Welcome To Golabing.ai</GradientText>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Access your AI-powered learning environment
          </p>
        </div>

        <GlowingBorder>
          <form onSubmit={handleSubmit} className="glass-panel p-8 space-y-6">
            <div className="space-y-4">
              <FormInput
                id="email"
                name="email"
                type="email"
                label="Email address"
                value={formData.email}
                error={errors.email}
                onChange={handleChange}
                required
              />

              <FormInput
                id="password"
                name="password"
                type="password"
                label="Password"
                value={formData.password}
                error={errors.password}
                onChange={handleChange}
                required
              />
            </div>

            {errors.submit && (
              <div className="rounded-md bg-red-900/50 border border-red-500/50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-200">{errors.submit}</h3>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </GlowingBorder>

        <div className="space-y-4">
          {/* <DemoUsers /> */}
          
          <div className="text-center text-sm">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};