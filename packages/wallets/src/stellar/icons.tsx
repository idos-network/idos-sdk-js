import React from 'react';

interface StellarIconProps {
  className?: string;
  size?: number;
}

export const StellarIcon: React.FC<StellarIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      fill="#ffffff"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      id="stellar"
      data-name="Flat Line"
      xmlns="http://www.w3.org/2000/svg"
      className={`icon flat-line ${className}`}
    >
      <path
        id="primary"
        d="M21,6.22,4,13H4a8.43,8.43,0,0,1-.06-1,7.86,7.86,0,0,1,.87-3.62A8,8,0,0,1,11.94,4a7.88,7.88,0,0,1,2.67.46"
        style={{
          fill: 'none',
          stroke: 'rgb(255, 255, 255)',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2
        }}
      />
      <path
        id="primary-2"
        data-name="primary"
        d="M9.38,19.54a8,8,0,0,0,9.81-3.92A7.86,7.86,0,0,0,20.06,12,8.26,8.26,0,0,0,20,11h0L3,17.78"
        style={{
          fill: 'none',
          stroke: 'rgb(255, 255, 255)',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2
        }}
      />
    </svg>
  );
};

export default StellarIcon; 