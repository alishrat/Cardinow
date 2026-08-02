'use client';

import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  showText?: boolean;
  subText?: string;
  titleText?: string;
  textClassName?: string;
}

export default function BrandLogo({
  className = '',
  size = 'md',
  onClick,
  showText = false,
  subText,
  titleText = 'سامانه مگاکارت',
  textClassName = '',
}: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-base rounded-lg',
    md: 'h-9 w-9 md:h-10 md:w-10 text-lg md:text-xl rounded-xl',
    lg: 'h-12 w-12 text-2xl rounded-2xl',
    xl: 'h-16 w-16 text-3xl rounded-2xl',
  };

  const dim = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center gap-2.5 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {!imgError ? (
        <img
          src="/logo.png"
          alt="لوگوی مگاکارت"
          onError={() => setImgError(true)}
          className={`${dim} object-contain p-0.5 rounded-xl border border-slate-800/60 bg-slate-900/60 shadow-md ${className}`}
        />
      ) : (
        <div
          className={`${dim} bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20 shrink-0 ${className}`}
        >
          م
        </div>
      )}

      {showText && (
        <div className={textClassName}>
          <span className="text-sm md:text-lg font-black tracking-tight bg-gradient-to-l from-white to-slate-300 bg-clip-text text-transparent block">
            {titleText}
          </span>
          {subText && (
            <p className="text-[9px] md:text-[10px] text-blue-400 -mt-0.5 font-bold">
              {subText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
