import React from 'react';
import { useBrandingStore } from '../../store/brandingStore';

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
  const { primaryColor, secondaryColor } = useBrandingStore();
  
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    filter: glow ? `drop-shadow(0 0 12px ${primaryColor}80)` : undefined
  };
  
  return (
    <span 
      className={`font-semibold ${
        animated ? 'bg-[length:200%_auto] animate-gradient' : ''
      } ${className}`}
      style={gradientStyle}
    >
      {children}
    </span>
  );
};