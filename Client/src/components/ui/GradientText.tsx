import React from 'react';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  glow?: boolean;
}

export const GradientText: React.FC<GradientTextProps> = ({ 
  children, 
  className = '', 
  animated = false,
  glow = true 
}) => {
  const glowStyle = glow ? { filter: 'drop-shadow(0 0 12px rgba(12, 142, 231, 0.5))' } : {};
  
  return (
    <span 
      className={`bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text font-semibold ${
        animated ? 'bg-[length:200%_auto] animate-gradient' : ''
      } ${className}`}
      style={glowStyle}
    >
      {children}
    </span>
  );
};