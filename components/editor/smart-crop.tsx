"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, SlidersHorizontal, Image as ImageIcon } from "lucide-react";
import { createPortal } from "react-dom";

type SmartCropProps = {
  imageUrl: string;
  onClose: () => void;
  onApply: (newImageUrl: string, filters: { brightness: number; contrast: number; tint: number }) => void;
};

// Helper function to extract cropped & filtered image using HTML5 Canvas
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  filters: { brightness: number; contrast: number; tint: number }
): Promise<string> => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not create canvas context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Apply CSS filters for Brightness, Contrast, and Sepia (tint)
  ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) sepia(${filters.tint}%) hue-rotate(${filters.tint * 0.5}deg)`;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/jpeg", 0.9);
};

export function SmartCropModal({ imageUrl, onClose, onApply }: SmartCropProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  // Filter states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [tint, setTint] = useState(0); // 0 to 100 for a spring/sepia tint

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    try {
      const filters = { brightness, contrast, tint };
      const result = await getCroppedImg(imageUrl, croppedAreaPixels, filters);
      onApply(result, filters);
    } catch (e) {
      console.error(e);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div
          className="relative flex flex-col md:flex-row bg-[#FAF9F6]/90 backdrop-blur-xl border border-[#D3A5B1]/30 rounded-2xl shadow-2xl w-full max-w-4xl h-[600px] overflow-hidden"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
        >
          {/* Cropper Area */}
          <div className="relative flex-1 bg-black/5" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) sepia(${tint}%) hue-rotate(${tint * 0.5}deg)` }}>
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          {/* Controls Sidebar */}
          <div className="w-full md:w-80 border-l border-[#D3A5B1]/20 p-6 flex flex-col gap-6 bg-white/50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#1A1A1A] flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#8b7355]" />
                Smart Crop
              </h3>
              <button onClick={onClose} className="text-[#645C52] hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#645C52]">Zoom</label>
                <input
                  type="range"
                  min={1} max={3} step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[#8b7355]"
                />
              </div>

              <hr className="border-[#D3A5B1]/20" />

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#645C52]">Brightness</label>
                <input
                  type="range"
                  min={50} max={150}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-[#8b7355]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#645C52]">Contrast</label>
                <input
                  type="range"
                  min={50} max={150}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-[#8b7355]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#645C52]">Spring Tint</label>
                <input
                  type="range"
                  min={0} max={100}
                  value={tint}
                  onChange={(e) => setTint(Number(e.target.value))}
                  className="w-full accent-[#D3A5B1]"
                />
              </div>
            </div>

            <button
              onClick={handleApply}
              className="w-full py-3 rounded-xl bg-[#1A1A1A] text-white font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-[#2a2a2a]"
            >
              <Check size={18} />
              Apply Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

