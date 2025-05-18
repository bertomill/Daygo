import React from 'react';

interface DayGoLogoProps {
  size?: number;
  variant?: 'light' | 'dark' | 'system';
}

export function DayGoLogo({ size = 40, variant = 'system' }: DayGoLogoProps) {
  const iconSize = size;
  const textSize = size * 0.8;
  
  // For variant='system', we'll use CSS variables that change with theme
  // For explicit light/dark, we'll use those specific colors
  const getColorClass = () => {
    if (variant === 'light') return "text-white";
    if (variant === 'dark') return "text-[#4A4A4A]";
    return "text-foreground"; // Uses system theme color
  };
  
  return (
    <div className={`flex items-center gap-2 ${getColorClass()}`}>
      {/* Notebook Icon */}
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="stroke-current"
      >
        <rect 
          x="15" 
          y="15" 
          width="70" 
          height="70" 
          rx="8" 
          strokeWidth="6" 
          fill="none"
        />
        <rect 
          x="25" 
          y="25" 
          width="70" 
          height="70" 
          rx="8" 
          strokeWidth="6" 
          fill="none"
        />
      </svg>
      
      {/* DayGo Text */}
      <span 
        style={{ 
          fontSize: textSize,
          fontWeight: 'bold',
          letterSpacing: '-0.03em'
        }}
      >
        DayGo
      </span>
    </div>
  );
} 