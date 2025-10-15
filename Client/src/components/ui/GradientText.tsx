import React from 'react';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export const GradientText: React.FC<GradientTextProps> = ({ children, className = '' }) => {
  return (
    <span className={`bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 text-transparent bg-clip-text font-semibold ${className}`}>
      {children}
    </span>
  );
};