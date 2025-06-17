import type React from 'react';

interface GemWalletIconProps {
  className?: string;
  size?: number;
}

export const GemWalletIcon: React.FC<GemWalletIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256" fill="none" className={className}>
    <g clip-path="url(#clip0_3879_8959)">
    <rect width="256" height="256" rx="90" fill="#2D5BE6"/>
    <path d="M128 194.37L213.333 128.632H42.6667L128 194.37Z" fill="white" fill-opacity="0.7"/>
    <path d="M128.001 194.37L170.667 71.1111H85.3339L128.001 194.37Z" fill="white" fill-opacity="0.5"/>
    <path d="M85.3334 71.1111H170.667L213.333 128.632H42.6667L85.3334 71.1111Z" fill="white" fill-opacity="0.8"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M105.239 128.632H150.762L170.667 71.1418H85.3339L105.239 128.632Z" fill="white" fill-opacity="0.9"/>
    </g>
    <defs>
    <clipPath id="clip0_3879_8959">
    <rect width="256" height="256" rx="90" fill="white"/>
    </clipPath>
    </defs>
    </svg>
  );
};

export default GemWalletIcon; 