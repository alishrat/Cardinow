'use client';

import React, { useMemo } from 'react';
import { generateStyledQRCodeSVG } from '../../lib/styledQrCode';

interface StyledQRCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export const StyledQRCode: React.FC<StyledQRCodeProps> = ({
  value,
  size = 300,
  fgColor = '#000000',
  bgColor = '#ffffff',
  className = '',
}) => {
  const svgMarkup = useMemo(() => {
    if (!value) return '';
    return generateStyledQRCodeSVG({
      value,
      size,
      fgColor,
      bgColor,
      margin: 2,
    });
  }, [value, size, fgColor, bgColor]);

  if (!svgMarkup) return null;

  return (
    <div
      className={`inline-block overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
};
