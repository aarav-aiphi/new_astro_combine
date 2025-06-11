"use client";

import React from 'react';

interface PromoRibbonProps {
  show: boolean;
  className?: string;
}

const PromoRibbon: React.FC<PromoRibbonProps> = ({ show, className = '' }) => {
  if (!show) return null;

  return (
    <div className={`absolute top-0 -right-4 z-20 ${className}`}>
      <div className="relative">
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-8 py-1 transform rotate-45 shadow-lg">
          <span className="block whitespace-nowrap">
            FIRST SESSION 50% OFF
          </span>
        </div>
        {/* Optional: Add a small shadow/border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 transform rotate-45 -z-10 blur-sm opacity-30"></div>
      </div>
    </div>
  );
};

export default PromoRibbon; 