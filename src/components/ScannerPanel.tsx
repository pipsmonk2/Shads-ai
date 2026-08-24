import React, { useState, useRef, useEffect } from "react";
import { Upload, Cpu, Zap, X, Image as ImageIcon, Sparkles, Check, RefreshCw } from "lucide-react";
import { shadsAudio } from "../utils/audio";

interface ScannerPanelProps {
  onScan: (image: string, mimeType: string, pair: string, timeframe: string) => void;
  isScanning: boolean;
  selectedPair?: string;
  setSelectedPair?: (pair: string) => void;
  selectedTimeframe?: string;
  setSelectedTimeframe?: (tf: string) => void;
  audioEnabled?: boolean;
}

export default function ScannerPanel({
  onScan,
  isScanning,
  selectedPair = "EUR/USD",
  selectedTimeframe = "H1",
  audioEnabled = true
}: ScannerPanelProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/png");
  const [dragActive, setDragActive] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanSteps = [
    "ANALYZING CHART...",
    "DETECTING MARKET STRUCTURE...",
    "IDENTIFYING ORDER FLOW...",
    "DETECTING SUPPORT & RESISTANCE...",
    "VALIDATING ENTRY...",
    "CALCULATING RISK...",
    "GENERATING SIGNAL..."
  ];

  // Cycling terminal sequence while scanning
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      setScanStepIndex(0);
      if (audioEnabled) {
        shadsAudio.playScanBeep(320);
      }

      interval = setInterval(() => {
        setScanStepIndex((prev) => {
          const next = prev + 1;
          if (next < scanSteps.length) {
            if (audioEnabled) {
              shadsAudio.playScanBeep(320 + next * 70);
            }
            return next;
          }
          return prev;
        });
      }, 420);
    } else {
      setScanStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isScanning, audioEnabled]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioEnabled) shadsAudio.playClick();
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 1400;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
          setImagePreview(compressedDataUrl);
          setMimeType("image/jpeg");
        } else {
          setImagePreview(dataUrl);
          setMimeType(file.type || "image/png");
        }
      };
      img.onerror = () => {
        setImagePreview(dataUrl);
        setMimeType(file.type || "image/png");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (audioEnabled) shadsAudio.playClick();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (audioEnabled) shadsAudio.playClick();
    fileInputRef.current?.click();
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (audioEnabled) shadsAudio.playClick();
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLaunchScan = () => {
    if (!imagePreview || isScanning) return;
    if (audioEnabled) shadsAudio.playClick();
    onScan(imagePreview, mimeType, selectedPair, selectedTimeframe);
  };

  return (
    <div className="w-full flex flex-col gap-4 font-mono select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. TOP INFORMATION PANEL */}
      <div className="relative rounded-xl border border-[#00FF66]/40 bg-[#000000] p-3.5 sm:p-4 shadow-[0_0_20px_rgba(0,255,102,0.15)] overflow-hidden circuit-pattern">
        {/* Subtle Tech Circuit Grid Accent Lines */}
        <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#00FF66]/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00FF66]" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-black border border-[#00FF66] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,255,102,0.3)]">
            <Zap className="w-4 h-4 text-[#00FF66] animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm text-[#00FF66] font-medium leading-relaxed">
            Upload any chart screenshot &mdash;{" "}
            <span className="text-[#00FF66] font-black underline decoration-[#00FF66]/50">Shads AI automatically detects</span> the asset pair &amp; timeframe.
          </p>
        </div>
      </div>

      {/* 2. SCREENSHOT UPLOAD AREA */}
      <div
        id="zone-chart-upload"
        onClick={triggerFileInput}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative w-full min-h-[260px] sm:min-h-[300px] rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-6 text-center overflow-hidden bg-[#000000] cyber-grid ${
          dragActive
            ? "border-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_35px_rgba(0,255,102,0.4)] scale-[0.99]"
            : imagePreview
            ? "border-[#00FF66] shadow-[0_0_25px_rgba(0,255,102,0.25)]"
            : "border-[#00FF66]/40 hover:border-[#00FF66] hover:shadow-[0_0_25px_rgba(0,255,102,0.25)]"
        }`}
      >
        {/* Cyber Corner Markers */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#00FF66]" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#00FF66]" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#00FF66]" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#00FF66]" />

        {imagePreview ? (
          /* Image Preview Mode with Controls & Scan Laser */
          <div className="relative w-full h-full min-h-[240px] flex flex-col items-center justify-center">
            <div className="relative max-h-[320px] w-full rounded-lg overflow-hidden border border-[#00FF66]/50 bg-black flex items-center justify-center shadow-lg">
              <img
                src={imagePreview}
                alt="Uploaded Chart"
                className="max-h-[300px] w-auto max-w-full object-contain"
              />

              {/* Laser Scan Animation Overlay */}
              {isScanning && (
                <>
                  <div className="absolute inset-0 bg-[#00FF66]/10 pointer-events-none" />
                  <div className="absolute left-0 right-0 h-1 bg-[#00FF66] shadow-[0_0_20px_#00FF66,0_0_8px_#00FF66] animate-laser-scan pointer-events-none" />
                  <div className="absolute inset-0 scanlines-overlay" />
                </>
              )}
            </div>

            {/* Quick Re-upload / Clear Button */}
            {!isScanning && (
              <div className="mt-3 flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66]/20 text-xs font-bold uppercase transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-[#00FF66]" />
                  <span className="text-[#00FF66]">Change Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-black border border-[#00FF66]/50 text-[#00FF66] hover:bg-[#00FF66]/20 text-xs font-bold uppercase transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <X className="w-4 h-4 text-[#00FF66]" />
                  <span className="text-[#00FF66]">Remove</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty Drag & Drop Target Area */
          <div className="flex flex-col items-center justify-center gap-3.5 max-w-md">
            {/* Large Circular Upload Icon with Neon Green Arrow */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black border-2 border-[#00FF66] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.3)] group-hover:scale-105 transition-transform">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-[#00FF66] stroke-[2.2] animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#00FF66] neon-glow-text">
                DRAG &amp; DROP FOREX CHART SCREENSHOT
              </h3>
              <p className="text-xs text-[#00FF66]/80 font-semibold tracking-wide">
                OR CLICK TO BROWSE LOCAL FILES
              </p>
            </div>

            {/* Small Outlined Format Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-[#00FF66] bg-black text-[10px] font-bold text-[#00FF66] tracking-widest uppercase shadow-[0_0_10px_rgba(0,255,102,0.2)]">
              <Sparkles className="w-3 h-3 text-[#00FF66]" />
              <span className="text-[#00FF66]">PNG, JPG, WEBP, GIF</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. TERMINAL SCAN STATUS DURING ACTIVE SCAN */}
      {isScanning && (
        <div className="w-full bg-[#000000] border border-[#00FF66] rounded-xl p-3.5 font-mono text-xs shadow-[0_0_20px_rgba(0,255,102,0.3)] animate-pulse">
          <div className="flex items-center justify-between border-b border-[#00FF66]/30 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
              <span className="text-[#00FF66] font-bold tracking-wider">
                SHADS AI NEURAL COGNITION TERMINAL
              </span>
            </div>
            <span className="text-[10px] text-[#00FF66]/70 font-bold">
              ENGINE {scanStepIndex + 1}/{scanSteps.length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#00FF66] font-bold tracking-wide">
            <span className="text-[#00FF66]">&gt;</span>
            <span className="text-[#00FF66]">{scanSteps[scanStepIndex]}</span>
          </div>
        </div>
      )}

      {/* 4. LARGE FULL-WIDTH SCAN BUTTON */}
      <button
        id="btn-launch-scanner"
        type="button"
        disabled={!imagePreview || isScanning}
        onClick={handleLaunchScan}
        className={`w-full py-4 px-6 rounded-xl border-2 font-mono font-black text-sm sm:text-base tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer select-none ${
          !imagePreview
            ? "border-[#00FF66]/30 bg-black text-[#00FF66]/40 cursor-not-allowed opacity-50"
            : isScanning
            ? "border-[#00FF66] bg-black text-[#00FF66] shadow-[0_0_35px_rgba(0,255,102,0.5)] animate-pulse"
            : "border-[#00FF66] bg-black text-[#00FF66] hover:bg-[#00FF66]/20 hover:shadow-[0_0_35px_rgba(0,255,102,0.4)] hover:scale-[1.01] active:scale-[0.98]"
        }`}
      >
        <Cpu className={`w-5 h-5 ${isScanning ? "animate-spin text-[#00FF66]" : "text-[#00FF66]"}`} />
        <span className="text-[#00FF66]">
          {isScanning ? "SCANNING MARKET..." : "LAUNCH SHADS AI SCANNER"}
        </span>
      </button>
    </div>
  );
}
