
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="circuit" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
           <path d="M 10 10 L 20 10 M 10 10 L 10 20" stroke="#334155" strokeWidth="1" opacity="0.3" fill="none"/>
           <circle cx="10" cy="10" r="1.5" fill="#334155" opacity="0.3"/>
        </pattern>
      </defs>
      
      {/* Background Container */}
      <rect width="100" height="100" rx="22" fill="url(#logoBg)" />
      <rect width="100" height="100" rx="22" fill="url(#circuit)" />
      
      {/* Stylized 'G' Arrow */}
      <g filter="url(#neonGlow)">
        {/* The Swoosh */}
        <path 
          d="M 68 32 
             A 30 30 0 1 0 65 80 
             L 65 50 
             L 85 50 
             L 85 35" 
          stroke="#4ade80" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        {/* The Arrow Head */}
        <path 
          d="M 75 45 L 85 35 L 95 45" 
          stroke="#4ade80" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
      </g>
      
      {/* Speed Trail */}
      <path d="M 15 85 L 35 85" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M 10 78 L 25 78" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
};

export default Logo;
