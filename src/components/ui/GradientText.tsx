import React from 'react';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export const GradientText: React.FC<GradientTextProps> = ({ children, className = '' }) => {
  return (
    <span className={`bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400 text-transparent bg-clip-text animate-gradient ${className}`}>
      {children}
    </span>
  );
};