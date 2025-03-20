import React from 'react';

interface GlowingBorderProps {
  children: React.ReactNode;
  className?: string;
}

export const GlowingBorder: React.FC<GlowingBorderProps> = ({ children, className = '' }) => {
  return (
    <div className={`glow ${className}`}>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};