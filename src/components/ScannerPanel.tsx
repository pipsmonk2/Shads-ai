import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Cpu, Zap, X, Image as ImageIcon, Sparkles, Check, RefreshCw, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { shadsAudio } from "../utils/audio";
import { getApiUrl } from "../utils/api";

interface ScannerPanelProps {
  onScan: (image: string, mimeType: string, pair: string, timeframe: string) => void;
  isScanning: boolean;
  selectedPair?: string;
  setSelectedPair?: (pair: string) => void;
  selectedTimeframe?: string;
  setSelectedTimeframe?: (tf: string) => void;
  audioEnabled?: boolean;
}

interface RecognizedInstrument {
  detectedPair: string;
  detectedTimeframe: string;
  confidence: number;
  details: string;
  isRecognized: boolean;
}

// Quick filename-based pair / timeframe heuristic for instant UI responsiveness
function parseFilenameHints(filename: string): { pair?: string; timeframe?: string } {
  if (!filename) return {};
  const upper = filename.toUpperCase();
  let pair: string | undefined;
  let timeframe: string | undefined;

  // Exact pair matches in filename
  if (/\b(EURUSD|EUR_USD|EUR-USD)\b/i.test(upper)) pair = "EUR/USD";
  else if (/\b(GBPUSD|GBP_USD|GBP-USD)\b/i.test(upper)) pair = "GBP/USD";
  else if (/\b(USDJPY|USD_JPY|USD-JPY)\b/i.test(upper)) pair = "USD/JPY";
  else if (/\b(XAUUSD|XAU_USD|XAU-USD|GOLD|SPOTGOLD)\b/i.test(upper)) pair = "XAU/USD (Gold)";
  else if (/\b(BTCUSD|BTC_USD|BTC-USD|BITCOIN|BTCUSDT)\b/i.test(upper)) pair = "BTC/USD (Bitcoin)";
  else if (/\b(ETHUSD|ETH_USD|ETH-USD|ETHEREUM|ETHUSDT)\b/i.test(upper)) pair = "ETH/USD (Ethereum)";
  else if (/\b(SOLUSD|SOL_USD|SOL-USD|SOLANA)\b/i.test(upper)) pair = "SOL/USD (Solana)";
  else if (/\b(US30|DJI|DJ30|DOWJONES|WALLSTREET)\b/i.test(upper)) pair = "US30 (Dow Jones)";
  else if (/\b(NAS100|NASDAQ|NDX|USTEC|US100)\b/i.test(upper)) pair = "NAS100 (Nasdaq)";
  else if (/\b(SPX500|SP500|US500|SPX)\b/i.test(upper)) pair = "SPX500 (S&P 500)";
  else if (/\b(GER40|GER30|DAX|GERMANY40)\b/i.test(upper)) pair = "GER40 (DAX)";
  else if (/\b(AUDUSD|AUD_USD)\b/i.test(upper)) pair = "AUD/USD";
  else if (/\b(USDCAD|USD_CAD)\b/i.test(upper)) pair = "USD/CAD";
  else if (/\b(USDCHF|USD_CHF)\b/i.test(upper)) pair = "USD/CHF";
  else if (/\b(NZDUSD|NZD_USD)\b/i.test(upper)) pair = "NZD/USD";
  else if (/\b(EURJPY|EUR_JPY)\b/i.test(upper)) pair = "EUR/JPY";
  else if (/\b(GBPJPY|GBP_JPY)\b/i.test(upper)) pair = "GBP/JPY";
  else if (/\b(EURGBP|EUR_GBP)\b/i.test(upper)) pair = "EUR/GBP";
  else if (/\b(AUDJPY|AUD_JPY)\b/i.test(upper)) pair = "AUD/JPY";
  else if (/\b(CADJPY|CAD_JPY)\b/i.test(upper)) pair = "CAD/JPY";

  // Timeframes
  if (upper.match(/\b(M1|1M|1MIN)\b/)) timeframe = "M1";
  else if (upper.match(/\b(M5|5M|5MIN)\b/)) timeframe = "M5";
  else if (upper.match(/\b(M15|15M|15MIN)\b/)) timeframe = "M15";
  else if (upper.match(/\b(M30|30M|30MIN)\b/)) timeframe = "M30";
  else if (upper.match(/\b(H1|1H|60M)\b/)) timeframe = "H1";
  else if (upper.match(/\b(H4|4H|240M)\b/)) timeframe = "H4";
  else if (upper.match(/\b(D1|1D|DAILY)\b/)) timeframe = "D1";
  else if (upper.match(/\b(W1|1W|WEEKLY)\b/)) timeframe = "W1";

  return { pair, timeframe };
}

export default function ScannerPanel({
  onScan,
  isScanning,
  selectedPair = "EUR/USD",
  setSelectedPair,
  selectedTimeframe = "H1",
  setSelectedTimeframe,
  audioEnabled = true
}: ScannerPanelProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [dragActive, setDragActive] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedInfo, setRecognizedInfo] = useState<RecognizedInstrument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanSteps = [
    "RECOGNIZING INSTRUMENT WATERMARK & PRICE SCALE OCR...",
    "ANALYZING CANDLESTICK HIGH/LOW STRUCTURE...",
    "DETECTING ORDER BLOCKS & LIQUIDITY POOLS...",
    "CALCULATING SMC IMBALANCES & FVGS...",
    "ANCHORING STRUCTURE-BASED STOP LOSS...",
    "CONSTRUCTING MULTI-ENGINE CONFLUENCE...",
    "FINALIZING TRADE SIGNAL & RISK:REWARD..."
  ];

  // Terminal scan cycle sound & progress
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
              shadsAudio.playScanBeep(320 + next * 60);
            }
            return next;
          }
          return prev;
        });
      }, 450);
    } else {
      setScanStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isScanning, audioEnabled]);

  const processFile = useCallback((file: File) => {
    setFileName(file.name || "chart_screenshot.png");
    setRecognizedInfo(null);
    console.log(`[ScannerPanel] 🖼️ Loading chart screenshot | File: "${file.name}" | Size: ${(file.size / 1024).toFixed(1)} KB | MIME: ${file.type || "image/png"}`);
    
    // Check filename hints for instant optimistic feedback
    let initialPair = selectedPair;
    let initialTf = selectedTimeframe;
    if (file.name) {
      const hints = parseFilenameHints(file.name);
      if (hints.pair) {
        initialPair = hints.pair;
        if (setSelectedPair) setSelectedPair(hints.pair);
      }
      if (hints.timeframe) {
        initialTf = hints.timeframe;
        if (setSelectedTimeframe) setSelectedTimeframe(hints.timeframe);
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = async () => {
        const origWidth = img.width;
        const origHeight = img.height;
        const maxDim = 3840;

        let finalDataUrl = dataUrl;
        let finalMime = file.type || "image/png";

        // Downscale ultra-large images cleanly to prevent memory overload
        if (origWidth > maxDim || origHeight > maxDim || file.size >= 6 * 1024 * 1024) {
          let width = origWidth;
          let height = origHeight;
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
            finalDataUrl = canvas.toDataURL("image/jpeg", 0.96);
            finalMime = "image/jpeg";
          }
        }

        setImagePreview(finalDataUrl);
        setMimeType(finalMime);
        if (audioEnabled) shadsAudio.playSuccess();

        // 1. Trigger fast automatic instrument recognition
        setIsRecognizing(true);
        let resolvedPair = initialPair;
        let resolvedTf = initialTf;

        try {
          console.log("[ScannerPanel] 🔍 Calling /api/recognize for automatic instrument identification...");
          const recRes = await fetch(getApiUrl("/api/recognize"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: finalDataUrl, mimeType: finalMime })
          });

          if (recRes.ok) {
            const recData = await recRes.json();
            if (recData && recData.detectedPair) {
              resolvedPair = recData.detectedPair;
              resolvedTf = recData.detectedTimeframe || resolvedTf;
              setRecognizedInfo(recData);
              if (setSelectedPair) setSelectedPair(resolvedPair);
              if (setSelectedTimeframe) setSelectedTimeframe(resolvedTf);
              console.log(`[ScannerPanel] 🎯 Auto-recognized instrument: "${resolvedPair}" (${resolvedTf}) - ${recData.details}`);
            }
          }
        } catch (recErr) {
          console.warn("[ScannerPanel] Background OCR recognition note:", recErr);
        } finally {
          setIsRecognizing(false);
        }

        // 2. Dispatch full multi-engine chart scan with recognized asset pair & timeframe
        onScan(finalDataUrl, finalMime, resolvedPair, resolvedTf);
      };

      img.onerror = () => {
        setImagePreview(dataUrl);
        const finalMime = file.type || "image/png";
        setMimeType(finalMime);
        if (audioEnabled) shadsAudio.playSuccess();
        onScan(dataUrl, finalMime, initialPair, initialTf);
      };

      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [audioEnabled, onScan, selectedPair, selectedTimeframe, setSelectedPair, setSelectedTimeframe]);

  // Global Clipboard Paste Support (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            if (audioEnabled) shadsAudio.playClick();
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFile, audioEnabled]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioEnabled) shadsAudio.playClick();
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
    if (e.target) {
      e.target.value = "";
    }
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
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLaunchScan = () => {
    if (!imagePreview || isScanning) return;
    if (audioEnabled) shadsAudio.playClick();
    const effectivePair = recognizedInfo?.detectedPair || selectedPair;
    const effectiveTf = recognizedInfo?.detectedTimeframe || selectedTimeframe;
    onScan(imagePreview, mimeType, effectivePair, effectiveTf);
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

      {/* 1. TOP INFORMATION BANNER */}
      <div className="relative rounded-xl border border-[#00FF66]/40 bg-[#000000] p-3.5 sm:p-4 shadow-[0_0_20px_rgba(0,255,102,0.15)] overflow-hidden circuit-pattern">
        <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#00FF66]/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00FF66]" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black border border-[#00FF66] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,255,102,0.3)]">
              <Zap className="w-4 h-4 text-[#00FF66] animate-pulse" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-[#00FF66] font-bold leading-relaxed flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#00FF66] shrink-0" />
                <span>Automatic AI Pair &amp; Timeframe Recognition</span>
              </p>
              <p className="text-[10px] sm:text-xs text-[#00FF66]/80 font-medium">
                Upload or paste (<kbd className="bg-black border border-[#00FF66]/50 px-1 py-0.5 rounded text-[10px]">Ctrl+V</kbd>) any chart screenshot. AI Vision auto-detects the pair and timeframe.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SCREENSHOT UPLOAD / PREVIEW DROPZONE */}
      <div
        id="zone-chart-upload"
        onClick={triggerFileInput}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative w-full min-h-[260px] sm:min-h-[320px] rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-4 sm:p-6 text-center overflow-hidden bg-[#000000] cyber-grid ${
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
          /* Image Preview Mode with Interactive Laser Overlay */
          <div className="relative w-full h-full min-h-[260px] flex flex-col items-center justify-center">
            
            {/* Top Status Banner on Preview */}
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 px-1 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-[#00FF66] truncate max-w-[280px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66] shrink-0" />
                <span className="truncate">{fileName || "Chart Screenshot Loaded"}</span>
              </span>
              
              <div className="flex items-center gap-2 flex-wrap">
                {isRecognizing ? (
                  <span className="text-[10px] text-[#00FF66] bg-black px-2.5 py-1 rounded border border-[#00FF66] shrink-0 font-mono font-bold tracking-wide flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,255,102,0.4)] animate-pulse">
                    <Sparkles className="w-3 h-3 text-[#00FF66] animate-spin" />
                    OCR RECOGNIZING INSTRUMENT...
                  </span>
                ) : recognizedInfo ? (
                  <span className="text-[10px] text-[#00FF66] bg-black px-2.5 py-1 rounded border border-[#00FF66] shrink-0 font-mono font-bold tracking-wide flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,102,0.3)]">
                    <Check className="w-3.5 h-3.5 text-[#00FF66]" />
                    <span>AUTO-DETECTED: <strong className="underline decoration-[#00FF66]">{recognizedInfo.detectedPair}</strong> &bull; {recognizedInfo.detectedTimeframe}</span>
                    <span className="ml-1 text-[9px] bg-[#00FF66]/20 px-1 py-0.2 rounded border border-[#00FF66]/40">{recognizedInfo.confidence}%</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-[#00FF66] bg-black px-2 py-0.5 rounded border border-[#00FF66]/50 shrink-0 font-mono font-bold tracking-wide">
                    {isScanning ? "RECOGNIZING & SCANNING..." : `ACTIVE: ${selectedPair} (${selectedTimeframe})`}
                  </span>
                )}
              </div>
            </div>

            {/* OCR Ground Truth Details Pill */}
            {recognizedInfo?.details && (
              <div className="w-full mb-2 px-3 py-1.5 rounded-lg bg-black border border-[#00FF66]/50 text-[10px] text-[#00FF66] flex items-center justify-between gap-2 shadow-[0_0_10px_rgba(0,255,102,0.15)]">
                <span className="truncate flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-[#00FF66] shrink-0" />
                  <strong className="text-[#00FF66]">OCR Vision Ground Truth:</strong>
                  <span className="text-[#00FF66]/90">{recognizedInfo.details}</span>
                </span>
                <span className="shrink-0 text-[9px] text-[#00FF66] font-bold px-1.5 py-0.5 bg-[#00FF66]/20 rounded border border-[#00FF66]/40">
                  {recognizedInfo.confidence}% CONFIDENCE
                </span>
              </div>
            )}

            <div className="relative max-h-[360px] w-full rounded-lg overflow-hidden border border-[#00FF66]/60 bg-black flex items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.9)]">
              <img
                src={imagePreview}
                alt="Uploaded Chart"
                className="max-h-[340px] w-auto max-w-full object-contain"
              />

              {/* Laser Scan Animation Overlay */}
              {isScanning && (
                <>
                  <div className="absolute inset-0 bg-[#00FF66]/10 pointer-events-none" />
                  <div className="absolute left-0 right-0 h-1.5 bg-[#00FF66] shadow-[0_0_25px_#00FF66,0_0_10px_#00FF66] animate-laser-scan pointer-events-none" />
                  <div className="absolute inset-0 scanlines-overlay pointer-events-none" />
                  
                  {/* Real-time Status Overlay */}
                  <div className="absolute top-3 left-3 bg-black/90 border border-[#00FF66] text-[#00FF66] px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.4)] animate-pulse pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                    ANALYZING CHART STRUCTURE...
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions (Change image / Clear / Paste hint) */}
            {!isScanning && (
              <div className="mt-3.5 flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (audioEnabled) shadsAudio.playClick();
                    if (!imagePreview) return;
                    setIsRecognizing(true);
                    try {
                      const res = await fetch(getApiUrl("/api/recognize"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image: imagePreview, mimeType })
                      });
                      if (res.ok) {
                        const rec = await res.json();
                        if (rec && rec.detectedPair) {
                          setRecognizedInfo(rec);
                          if (setSelectedPair) setSelectedPair(rec.detectedPair);
                          if (setSelectedTimeframe) setSelectedTimeframe(rec.detectedTimeframe);
                        }
                      }
                    } catch (err) {
                      console.warn(err);
                    } finally {
                      setIsRecognizing(false);
                    }
                  }}
                  disabled={isRecognizing}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66]/20 text-xs font-bold uppercase transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 text-[#00FF66] ${isRecognizing ? "animate-spin" : ""}`} />
                  <span className="text-[#00FF66]">{isRecognizing ? "Recognizing..." : "Re-Detect Instrument"}</span>
                </button>

                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66]/20 text-xs font-bold uppercase transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-[#00FF66]" />
                  <span className="text-[#00FF66]">Change Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-black border border-[#00FF66]/50 text-[#00FF66] hover:bg-[#00FF66]/20 text-xs font-bold uppercase transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
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
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black border-2 border-[#00FF66] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.3)] group-hover:scale-105 transition-transform">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-[#00FF66] stroke-[2.2] animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#00FF66] neon-glow-text">
                DRAG &amp; DROP FOREX CHART SCREENSHOT
              </h3>
              <p className="text-xs text-[#00FF66]/80 font-semibold tracking-wide">
                OR CLICK TO BROWSE LOCAL FILES &bull; PASTE (CTRL+V)
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-[#00FF66] bg-black text-[10px] font-bold text-[#00FF66] tracking-widest uppercase shadow-[0_0_10px_rgba(0,255,102,0.2)]">
              <Sparkles className="w-3 h-3 text-[#00FF66]" />
              <span className="text-[#00FF66]">PNG, JPG, WEBP, GIF, TRADINGVIEW, MT4/MT5</span>
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

      {/* 4. LARGE FULL-WIDTH LAUNCH SCAN BUTTON */}
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
          {isScanning ? "RECOGNIZING & SCANNING MARKET..." : "LAUNCH SHADS AI SCANNER"}
        </span>
      </button>
    </div>
  );
}
