'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move, Square, Circle, RefreshCw, Image as ImageIcon } from 'lucide-react';

export interface ImageCropperModalProps {
  imageFile: File | null;
  isOpen: boolean;
  mode?: 'profile' | 'cover';
  onClose: () => void;
  onConfirmCrop: (croppedFile: File) => void;
}

export default function ImageCropperModal({
  imageFile,
  isOpen,
  mode = 'profile',
  onClose,
  onConfirmCrop
}: ImageCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);

  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [touchDistStart, setTouchDistStart] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const imageRef = useRef<HTMLImageElement>(null);

  // Viewport & Output dimensions based on mode
  const isProfile = mode === 'profile';
  const cropBoxWidth = isProfile ? 260 : 340;
  const cropBoxHeight = isProfile ? 260 : 120;
  const outputWidth = isProfile ? 600 : 1200;
  const outputHeight = isProfile ? 600 : 423; // ~2.83:1 ratio matching 340x120

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);

      // Preload image to get natural dimensions accurately
      const img = new Image();
      img.onload = () => {
        setNaturalWidth(img.naturalWidth || img.width);
        setNaturalHeight(img.naturalHeight || img.height);
        setZoom(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
      };
      img.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImageSrc(null);
      setNaturalWidth(0);
      setNaturalHeight(0);
    }
  }, [imageFile]);

  if (!isOpen || !imageSrc || !naturalWidth || !naturalHeight) return null;

  // Calculate base minScale to cover the crop box completely
  const rotW = (rotation === 90 || rotation === 270) ? naturalHeight : naturalWidth;
  const rotH = (rotation === 90 || rotation === 270) ? naturalWidth : naturalHeight;
  const minScale = Math.max(cropBoxWidth / rotW, cropBoxHeight / rotH);

  // Clamp offset so image always covers the crop box frame
  const clampOffset = (x: number, y: number, currentZoom: number, rot: number) => {
    const rw = (rot === 90 || rot === 270) ? naturalHeight : naturalWidth;
    const rh = (rot === 90 || rot === 270) ? naturalWidth : naturalHeight;
    const ms = Math.max(cropBoxWidth / rw, cropBoxHeight / rh);

    const currentW = rw * ms * currentZoom;
    const currentH = rh * ms * currentZoom;

    const maxOffsetX = Math.max(0, (currentW - cropBoxWidth) / 2);
    const maxOffsetY = Math.max(0, (currentH - cropBoxHeight) / 2);

    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, y))
    };
  };

  // Pointer & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setOffset(clampOffset(newX, newY, zoom, rotation));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
      setTouchDistStart(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDistStart(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      setOffset(clampOffset(newX, newY, zoom, rotation));
    } else if (e.touches.length === 2 && touchDistStart !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / touchDistStart;
      const newZoom = Math.min(3.5, Math.max(1, zoom * ratio));
      setZoom(newZoom);
      setTouchDistStart(currentDist);
      setOffset((prev) => clampOffset(prev.x, prev.y, newZoom, rotation));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchDistStart(null);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const newZoom = Math.min(3.5, Math.max(1, zoom + delta));
    setZoom(newZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, newZoom, rotation));
  };

  // Rotation Change
  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom, nextRot));
  };

  // Zoom Change from Slider
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, newZoom, rotation));
  };

  // Reset
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Export cropped canvas
  const handleCropAndSave = () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill canvas background
      ctx.fillStyle = isProfile ? '#ffffff' : '#0f172a';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      const scaleRatio = outputWidth / cropBoxWidth;

      ctx.save();
      // Move origin to canvas center plus scaled user offset
      ctx.translate(outputWidth / 2 + offset.x * scaleRatio, outputHeight / 2 + offset.y * scaleRatio);
      
      // Apply Rotation around image center
      ctx.rotate((rotation * Math.PI) / 180);

      // Drawn image size on canvas
      const drawW = naturalWidth * minScale * zoom * scaleRatio;
      const drawH = naturalHeight * minScale * zoom * scaleRatio;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (blob) {
            const prefix = isProfile ? 'cropped_profile' : 'cropped_cover';
            const fileName = imageFile?.name ? `${prefix}_${imageFile.name}` : `${prefix}.jpg`;
            const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });
            onConfirmCrop(croppedFile);
            onClose();
          }
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      console.error('Error cropping image:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 dir-rtl text-right font-sans selection:bg-blue-600 selection:text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl relative overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            {isProfile ? (
              <Move className="h-5 w-5 text-blue-400 shrink-0" />
            ) : (
              <ImageIcon className="h-5 w-5 text-amber-400 shrink-0" />
            )}
            <div>
              <h3 className="text-sm font-bold text-white">
                {isProfile ? 'تنظیم و برش تصویر پروفایل' : 'تنظیم و برش تصویر کاور (بنر)'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isProfile 
                  ? 'کادر را جابجا و زوم کنید تا تصویر پروفایل دقیقاً تنظیم شود' 
                  : 'کادر بنر بالای کارت را تنظیم و برش دهید'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewport Box */}
        <div className="flex flex-col items-center justify-center space-y-2 py-1">
          <div 
            className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-700 cursor-grab active:cursor-grabbing select-none flex items-center justify-center shadow-2xl"
            style={{ width: `${cropBoxWidth}px`, height: `${cropBoxHeight}px` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Image target */}
            <img 
              ref={imageRef}
              src={imageSrc} 
              alt="Crop target" 
              draggable={false}
              className="absolute pointer-events-none transition-transform duration-75 ease-out"
              style={{
                width: `${naturalWidth}px`,
                height: `${naturalHeight}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                top: '50%',
                left: '50%',
                transformOrigin: 'center center',
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${minScale * zoom})`,
              }}
            />

            {/* Mask Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {isProfile ? (
                <div className="w-full h-full border-2 border-dashed border-blue-400/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.75)] rounded-2xl relative flex items-center justify-center">
                  {/* Faint circle guide line to assist face centering for circular templates */}
                  <div className="w-full h-full rounded-full border border-blue-400/25 border-dashed" />
                </div>
              ) : (
                <div className="w-full h-full border-2 border-dashed border-amber-400/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.75)] rounded-lg flex items-center justify-center">
                  <span className="text-[10px] text-amber-300 font-bold bg-slate-900/90 px-2 py-0.5 rounded border border-amber-500/30">
                    محدوده بنر کاور
                  </span>
                </div>
              )}
            </div>

            <div className="absolute bottom-1.5 right-1.5 bg-slate-900/90 px-2 py-0.5 rounded text-[9px] text-slate-300 pointer-events-none flex items-center gap-1 border border-slate-800">
              <Move className="h-3 w-3 text-blue-400 shrink-0" />
              <span>کشیدن برای جابجایی | اسکرول برای زوم</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800/90">
          
          {/* Zoom Slider */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleZoomChange(Math.max(1, zoom - 0.1))}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition shrink-0"
              title="زوم اوت"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <input 
              type="range"
              min="1"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <button
              type="button"
              onClick={() => handleZoomChange(Math.min(3.5, zoom + 0.1))}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition shrink-0"
              title="زوم این"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <span className="text-[11px] text-blue-400 font-mono w-10 text-center shrink-0">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/70">
            {/* Format info for profile */}
            {isProfile ? (
              <div className="text-[11px] text-slate-300 flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                <Square className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>برش مربع (سازگار با همه قالب‌ها)</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>فرمت استاندارد بنر کاور</span>
              </div>
            )}

            {/* Utility Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotate}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 flex items-center gap-1 text-[11px] transition"
                title="چرخش تصویر"
              >
                <RotateCw className="h-3.5 w-3.5 text-slate-400" />
                <span>چرخش ۹۰°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition"
                title="بازنشانی موقعیت"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
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
            className={`w-2/3 py-2.5 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50 ${
              isProfile
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
            }`}
          >
            <Check className="h-4 w-4" />
            <span>{isProcessing ? 'در حال برش...' : 'تایید و برش تصویر'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
