'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move, Square, Circle } from 'lucide-react';

interface ProfileImageCropperModalProps {
  imageFile: File | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCrop: (croppedFile: File) => void;
}

export default function ProfileImageCropperModal({
  imageFile,
  isOpen,
  onClose,
  onConfirmCrop
}: ProfileImageCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [maskShape, setMaskShape] = useState<'circle' | 'square'>('circle');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      // Reset transforms
      setScale(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImageSrc(null);
    }
  }, [imageFile]);

  if (!isOpen || !imageSrc) return null;

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleCropAndSave = () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const canvasSize = 500; // Output high resolution 500x500px
      const canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Crop viewport size in screen pixels
      const maskSize = 240; 
      const factor = canvasSize / maskSize;

      // Fill canvas background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      ctx.save();
      // Move to center of canvas
      ctx.translate(canvasSize / 2, canvasSize / 2);

      // Apply offset scaled to canvas coordinates
      ctx.translate(offset.x * factor, offset.y * factor);

      // Apply Rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply Scale
      ctx.scale(scale, scale);

      // Draw image centered
      const drawWidth = img.naturalWidth || img.width;
      const drawHeight = img.naturalHeight || img.height;
      
      // Calculate display aspect fit scale factor
      const fitScale = maskSize / Math.min(drawWidth, drawHeight);
      const scaledW = drawWidth * fitScale * factor;
      const scaledH = drawHeight * fitScale * factor;

      ctx.drawImage(img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
      ctx.restore();

      canvas.toBlob((blob) => {
        setIsProcessing(false);
        if (blob) {
          const fileName = imageFile?.name ? `cropped_${imageFile.name}` : 'cropped_profile.jpg';
          const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });
          onConfirmCrop(croppedFile);
          onClose();
        }
      }, 'image/jpeg', 0.92);
    } catch (err) {
      console.error('Error cropping image:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl text-right font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Move className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">تنظیم و برش تصویر پروفایل</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewport Box */}
        <div className="flex justify-center">
          <div 
            ref={containerRef}
            className="relative w-60 h-60 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 cursor-grab active:cursor-grabbing select-none flex items-center justify-center"
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={(e) => {
              if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={handlePointerUp}
          >
            {/* Image target */}
            <img 
              ref={imageRef}
              src={imageSrc} 
              alt="Crop target" 
              draggable={false}
              className="absolute max-w-none transition-transform duration-75 ease-out pointer-events-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
                maxHeight: '200px',
                maxWidth: '200px',
                objectFit: 'contain'
              }}
            />

            {/* Mask Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div 
                className={`w-48 h-48 border-2 border-dashed border-blue-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] ${
                  maskShape === 'circle' ? 'rounded-full' : 'rounded-xl'
                }`}
              />
            </div>

            <div className="absolute bottom-2 right-2 bg-slate-900/80 px-2 py-1 rounded text-[10px] text-slate-400 pointer-events-none flex items-center gap-1">
              <Move className="h-3 w-3 text-blue-400" />
              <span>برای جابجایی تصویر را درگ کنید</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-slate-400 shrink-0" />
            <input 
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <ZoomIn className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-[11px] text-blue-400 font-mono w-8 text-center">{Math.round(scale * 100)}%</span>
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
            {/* Shape toggle */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setMaskShape('circle')}
                className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] transition ${
                  maskShape === 'circle' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Circle className="h-3.5 w-3.5" />
                <span>دایره</span>
              </button>
              <button
                type="button"
                onClick={() => setMaskShape('square')}
                className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] transition ${
                  maskShape === 'square' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Square className="h-3.5 w-3.5" />
                <span>مربع</span>
              </button>
            </div>

            {/* Rotation */}
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg border border-slate-800 flex items-center gap-1 text-[11px] transition"
            >
              <RotateCw className="h-3.5 w-3.5 text-slate-400" />
              <span>چرخش ۹۰°</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleCropAndSave}
            className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{isProcessing ? 'در حال برش...' : 'تایید و برش تصویر'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
