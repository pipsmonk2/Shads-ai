import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Target, 
  Layers, 
  Volume2, 
  Zap, 
  Sparkles, 
  Copy, 
  Check, 
  X, 
  Send, 
  ArrowUpRight, 
  ArrowDownRight, 
  Crosshair, 
  Activity, 
  BarChart3, 
  Minimize2, 
  Maximize2 
} from "lucide-react";
import { ScanResult } from "../types";
import { shadsAudio } from "../utils/audio";
import { copyToClipboard } from "../utils/clipboard";
import StrategyMatrixPanel from "./StrategyMatrixPanel";

interface ResultsHudProps {
  result: ScanResult | null;
  isScanning?: boolean;
  onReadAloud: (text: string) => void;
  isReading: boolean;
  onClose?: () => void;
}

export default function ResultsHud({ result, isScanning, onReadAloud, isReading, onClose }: ResultsHudProps) {
  const [activeHudTab, setActiveHudTab] = useState<"overview" | "matrix" | "smc">("overview");
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!result && !isScanning) return null;

  const isBuy = result?.signal === "BUY";
  const isSell = result?.signal === "SELL";
  const isNoTrade = !result || result.signal === "NO_TRADE";

  const handleCopySingleCoord = async (fieldKey: string, value: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!value) return;
    shadsAudio.playClick();
    const success = await copyToClipboard(value);
    if (success) {
      setCopiedTarget(fieldKey);
      setTimeout(() => {
        setCopiedTarget((prev) => (prev === fieldKey ? null : prev));
      }, 2000);
    }
  };

  const handleCopyOrderTicket = async () => {
    if (!result) return;
    shadsAudio.playClick();
    const effectiveOrderType = result.orderType || (isBuy ? "BUY NOW" : isSell ? "SELL NOW" : "STAND DOWN");
    const cleanPair = (result.pair || "EURUSD").replace(/[^a-zA-Z0-9]/g, "");
    const orderCmd = `⚡ SHADS AI ORDER EXECUTION TICKET ⚡
ORDER: ${effectiveOrderType}
SYMBOL: ${cleanPair} (${result.pair})
TIMEFRAME: ${result.timeframe}
ENTRY: ${result.entryPrice}
STOP LOSS (SL - Structure Invalidation): ${result.stopLoss}${result.structureSLNote ? ` (${result.structureSLNote})` : ""}
TAKE PROFIT 1 (Internal Structure Target): ${result.takeProfit1}${result.structureTP1Note ? ` (${result.structureTP1Note})` : ""}
TAKE PROFIT 2 (External Liquidity): ${result.takeProfit2}${result.structureTP2Note ? ` (${result.structureTP2Note})` : ""}
${result.takeProfit3 ? `TAKE PROFIT 3: ${result.takeProfit3}\n` : ""}${result.takeProfit4 ? `TAKE PROFIT 4: ${result.takeProfit4}\n` : ""}${result.takeProfit5 ? `TAKE PROFIT 5: ${result.takeProfit5}\n` : ""}${result.takeProfit6 ? `TAKE PROFIT 6: ${result.takeProfit6}\n` : ""}R:R RATIO: ${result.riskRewardRatio}
CONFIDENCE: ${result.confidence}%
REASON: ${result.orderExecutionReason || "Confluence of 24 Institutional Trading Engines"}`;

    const success = await copyToClipboard(orderCmd);
    if (success) {
      setCopiedTarget("order_ticket");
      setTimeout(() => setCopiedTarget(null), 2500);
    }
  };

  const handleCopyCoordinates = async () => {
    if (!result) return;
    shadsAudio.playClick();
    const summary = `📊 SHADS AI COORDINATES (STRUCTURE-BASED) 📊
PAIR: ${result.pair} | TF: ${result.timeframe}
SIGNAL: ${result.signal}
ENTRY: ${result.entryPrice}
STOP LOSS: ${result.stopLoss} [Structure Invalidation]
TP1: ${result.takeProfit1} [Internal Liquidity]
TP2: ${result.takeProfit2} [External Liquidity]
${result.takeProfit3 ? `TP3: ${result.takeProfit3} [Macro Expansion]\n` : ""}${result.takeProfit4 ? `TP4: ${result.takeProfit4}\n` : ""}CONFIDENCE: ${result.confidence}% | R:R: ${result.riskRewardRatio}`;

    const success = await copyToClipboard(summary);
    if (success) {
      setCopiedTarget("coords");
      setTimeout(() => setCopiedTarget(null), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full relative z-30 font-mono select-none"
      >
        {/* FLOATING HOLOGRAPHIC CYBER HUD CONTAINER WITH GLOWING BORDERS */}
        <div
          className={`relative w-full rounded-2xl backdrop-blur-2xl border-2 transition-all duration-300 shadow-[0_25px_70px_rgba(0,0,0,1)] overflow-hidden glowing-border-panel ${
            isBuy
              ? "bg-black border-[#00FF66] shadow-[0_0_35px_rgba(0,255,102,0.4)]"
              : isSell
              ? "bg-black border-[#00FF66] shadow-[0_0_35px_rgba(0,255,102,0.4)]"
              : "bg-black border-[#00FF66]/80 shadow-[0_0_35px_rgba(0,255,102,0.3)]"
          }`}
        >
          {/* Cyber Digital Corner Brackets with Glow */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00FF66] shadow-[0_0_8px_#00FF66] opacity-95 z-20" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00FF66] shadow-[0_0_8px_#00FF66] opacity-95 z-20" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00FF66] shadow-[0_0_8px_#00FF66] opacity-95 z-20" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00FF66] shadow-[0_0_8px_#00FF66] opacity-95 z-20" />

          {/* Thin Scanline Overlay */}
          <div className="absolute inset-0 scanlines-overlay opacity-25 pointer-events-none" />

          {/* TOP HUD HEADER BAR */}
          <div className="px-4 py-3 border-b border-[#00FF66]/30 flex items-center justify-between bg-black relative z-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_12px_#00FF66] animate-ping" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#34d399] flex items-center gap-2">
                <span className="neon-glow-text floating-text">SHADS AI // SCAN RESULT</span>
                {result && (
                  <span className="text-[10px] px-2 py-0.5 rounded border border-[#00FF66]/60 bg-black text-[#34d399] font-bold floating-text-delay shadow-[0_0_10px_rgba(0,255,102,0.15)]">
                    {result.pair} &bull; {result.timeframe}
                  </span>
                )}
              </h2>
            </div>

            {/* Top Right Controls: Read, Minimize, Close */}
            <div className="flex items-center gap-2">
              {result && (
                <button
                  type="button"
                  onClick={() => {
                    const speech = `Shads AI signal for ${result.pair}. Signal is ${result.signal}. Entry at ${result.entryPrice}. Stop loss at ${result.stopLoss}. Take profit at ${result.takeProfit1}. Risk to reward is ${result.riskRewardRatio}. Confidence level is ${result.confidence} percent.`;
                    onReadAloud(speech);
                  }}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isReading
                      ? "bg-[#00FF66]/20 border-[#00FF66] text-[#34d399] shadow-[0_0_12px_rgba(0,255,102,0.3)]"
                      : "border-[#00FF66]/40 hover:border-[#00FF66] text-[#34d399]/70 hover:text-[#34d399]"
                  }`}
                  title="Voice AI Reader"
                >
                  <Volume2 className="w-4 h-4 text-[#34d399]" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg border border-[#00FF66]/40 hover:border-[#00FF66] text-[#34d399]/70 hover:text-[#34d399] transition-colors"
                title={isMinimized ? "Expand HUD" : "Minimize HUD"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4 text-[#34d399]" /> : <Minimize2 className="w-4 h-4 text-[#34d399]" />}
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg border border-[#00FF66]/40 hover:border-[#00FF66] text-[#34d399] hover:bg-[#00FF66]/20 transition-colors"
                  title="Close Scan Result"
                >
                  <X className="w-4 h-4 text-[#34d399]" />
                </button>
              )}
            </div>
          </div>

          {!isMinimized && result && (
            <div className="p-4 sm:p-5 space-y-4 relative z-10">

              {/* 1. PRIMARY SIGNAL & BIAS BANNER WITH GLOWING BORDER */}
              <div
                className="p-4 rounded-xl border-2 border-[#00FF66] bg-black flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(0,255,102,0.3)] glowing-card-border"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border-2 font-black text-xl shrink-0 bg-black text-[#34d399] border-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.4)] floating-text"
                  >
                    {isBuy ? (
                      <ArrowUpRight className="w-7 h-7 stroke-[3] text-[#34d399]" />
                    ) : isSell ? (
                      <ArrowDownRight className="w-7 h-7 stroke-[3] text-[#34d399]" />
                    ) : (
                      <Crosshair className="w-6 h-6 stroke-[2.5] text-[#34d399]" />
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-[#34d399]/75 uppercase tracking-widest block font-bold floating-text-slow">
                      MARKET BIAS &bull; {result.signal === "BUY" ? "BULLISH" : result.signal === "SELL" ? "BEARISH" : "NEUTRAL / RANGE"}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <h3
                        className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-[#34d399] neon-glow-text floating-text"
                      >
                        {result.signal === "BUY" ? "BUY BIAS" : result.signal === "SELL" ? "SELL BIAS" : "NO TRADE"}
                      </h3>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-black tracking-wider uppercase border border-[#00FF66] bg-black text-[#34d399] shadow-[0_0_12px_rgba(0,255,102,0.25)] floating-text-delay"
                      >
                        {result.orderType || (isBuy ? "BUY NOW" : isSell ? "SELL NOW" : "STAND DOWN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick 1-Click Order Tickets */}
                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyOrderTicket}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black hover:bg-[#00FF66]/20 border border-[#00FF66] text-[#34d399] text-xs font-black uppercase transition-all shadow-[0_0_15px_rgba(0,255,102,0.25)] cursor-pointer active:scale-95"
                    title="Copy MT4/MT5 Execution Ticket"
                  >
                    {copiedTarget === "order_ticket" ? (
                      <>
                        <Check className="w-4 h-4 text-[#34d399]" />
                        <span className="text-[#34d399]">TICKET COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#34d399]" />
                        <span className="text-[#34d399]">COPY MT4/MT5 ORDER</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCoordinates}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black hover:bg-[#00FF66]/15 border border-[#00FF66]/60 text-[#34d399] text-xs font-bold uppercase transition-all cursor-pointer active:scale-95"
                  >
                    {copiedTarget === "coords" ? (
                      <Check className="w-4 h-4 text-[#34d399]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#34d399]" />
                    )}
                    <span className="text-[#34d399]">COORDINATES</span>
                  </button>
                </div>
              </div>

              {/* 2. CORE TRADE EXECUTION COORDINATES GRID WITH GLOWING BORDERS & FLOATING TEXTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 text-xs">
                {/* Entry Price */}
                <div className="bg-black p-2.5 sm:p-3 rounded-xl border border-[#00FF66]/50 flex flex-col justify-between shadow-[0_0_15px_rgba(0,255,102,0.15)] min-w-0 glowing-card-border relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/70 uppercase tracking-widest font-bold truncate">
                      ENTRY LEVEL
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopySingleCoord("entry", result.entryPrice, e)}
                      className="p-1 rounded bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#34d399] transition-all flex items-center gap-1 text-[9px] font-bold cursor-pointer"
                      title="Copy Entry Price"
                    >
                      {copiedTarget === "entry" ? (
                        <>
                          <Check className="w-3 h-3 text-[#34d399]" />
                          <span className="text-[8.5px]">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#34d399]" />
                          <span className="text-[8.5px]">COPY</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg font-black text-[#34d399] mt-1 neon-glow-text truncate floating-text">
                    {result.entryPrice}
                  </span>
                  <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/60 mt-0.5 truncate">
                    Optimal Entry Zone
                  </span>
                </div>

                {/* Stop Loss (Structure Invalidation) */}
                <div className="bg-black p-2.5 sm:p-3 rounded-xl border border-[#00FF66]/50 flex flex-col justify-between shadow-[0_0_15px_rgba(0,255,102,0.15)] min-w-0 glowing-card-border relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/85 uppercase tracking-widest font-bold truncate flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#34d399]" />
                      STOP LOSS (SL)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopySingleCoord("sl", result.stopLoss, e)}
                      className="p-1 rounded bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#34d399] transition-all flex items-center gap-1 text-[9px] font-bold cursor-pointer"
                      title="Copy Stop Loss Coordinate"
                    >
                      {copiedTarget === "sl" ? (
                        <>
                          <Check className="w-3 h-3 text-[#34d399]" />
                          <span className="text-[8.5px]">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#34d399]" />
                          <span className="text-[8.5px]">COPY</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg font-black text-[#34d399] mt-1 truncate floating-text-delay">
                    {result.stopLoss}
                  </span>
                  <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/70 mt-0.5 truncate font-semibold" title={result.structureSLNote || "Structure Invalidation: Key Swing Low/High & Order Block Base"}>
                    {result.structureSLNote || "Structure Invalidation Level"}
                  </span>
                </div>

                {/* Take Profit 1 (Structure Target) */}
                <div className="bg-black p-2.5 sm:p-3 rounded-xl border border-[#00FF66]/50 flex flex-col justify-between shadow-[0_0_15px_rgba(0,255,102,0.15)] min-w-0 glowing-card-border relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/85 uppercase tracking-widest font-bold truncate flex items-center gap-1">
                      <Target className="w-3 h-3 text-[#34d399]" />
                      TAKE PROFIT (TP1)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopySingleCoord("tp1", result.takeProfit1, e)}
                      className="p-1 rounded bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#34d399] transition-all flex items-center gap-1 text-[9px] font-bold cursor-pointer"
                      title="Copy Take Profit 1 Coordinate"
                    >
                      {copiedTarget === "tp1" ? (
                        <>
                          <Check className="w-3 h-3 text-[#34d399]" />
                          <span className="text-[8.5px]">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#34d399]" />
                          <span className="text-[8.5px]">COPY</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg font-black text-[#34d399] mt-1 neon-glow-text truncate floating-text">
                    {result.takeProfit1}
                  </span>
                  <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/70 mt-0.5 truncate font-semibold" title={result.structureTP1Note || "Internal Structure Target: Nearest Swing High/Low & FVG"}>
                    {result.structureTP1Note || "Internal Liquidity Target"}
                  </span>
                </div>

                {/* Risk / Reward & Confidence */}
                <div className="bg-black p-2.5 sm:p-3 rounded-xl border border-[#00FF66]/50 flex flex-col justify-between shadow-[0_0_15px_rgba(0,255,102,0.15)] min-w-0 glowing-card-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/70 uppercase tracking-widest font-bold truncate">
                      R:R &bull; CONFIDENCE
                    </span>
                    <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-[#00FF66]/15 border border-[#00FF66]/40 text-[#34d399] font-bold">
                      {result.confidence}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 mt-1 flex-wrap floating-text-delay">
                    <span className="text-sm sm:text-base lg:text-lg font-black text-[#34d399]">
                      {result.riskRewardRatio}
                    </span>
                  </div>
                  <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/50 mt-0.5 truncate">Structure Confluence</span>
                </div>
              </div>

              {/* Extended Structure-Based TP Levels with Individual Copy Buttons */}
              {(result.takeProfit2 || result.takeProfit3 || result.takeProfit4 || result.takeProfit5 || result.takeProfit6) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                  {result.takeProfit2 && (
                    <div className="bg-black p-2 sm:p-2.5 rounded-lg border border-[#00FF66]/35 flex items-center justify-between min-w-0 glowing-card-border">
                      <div className="flex flex-col min-w-0 mr-1">
                        <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/70 font-bold truncate">
                          TP2 (External Liquidity):
                        </span>
                        <span className="text-[#34d399] font-extrabold truncate text-xs sm:text-sm floating-text-slow">
                          {result.takeProfit2}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopySingleCoord("tp2", result.takeProfit2, e)}
                        className="p-1 rounded bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#34d399] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Copy TP2"
                      >
                        {copiedTarget === "tp2" ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3 text-[#34d399]" />}
                        <span className="text-[8px] font-bold">{copiedTarget === "tp2" ? "COPIED" : "COPY"}</span>
                      </button>
                    </div>
                  )}

                  {result.takeProfit3 && (
                    <div className="bg-black p-2 sm:p-2.5 rounded-lg border border-[#00FF66]/35 flex items-center justify-between min-w-0 glowing-card-border">
                      <div className="flex flex-col min-w-0 mr-1">
                        <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/70 font-bold truncate">
                          TP3 (Macro Expansion):
                        </span>
                        <span className="text-[#34d399] font-extrabold truncate text-xs sm:text-sm floating-text-slow">
                          {result.takeProfit3}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopySingleCoord("tp3", result.takeProfit3, e)}
                        className="p-1 rounded bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#34d399] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Copy TP3"
                      >
                        {copiedTarget === "tp3" ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3 text-[#34d399]" />}
                        <span className="text-[8px] font-bold">{copiedTarget === "tp3" ? "COPIED" : "COPY"}</span>
                      </button>
                    </div>
                  )}

                  {result.takeProfit4 && (
                    <div className="bg-black p-2 sm:p-2.5 rounded-lg border border-[#00FF66]/35 flex items-center justify-between min-w-0 glowing-card-border">
                      <div className="flex flex-col min-w-0 mr-1">
                        <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/70 font-bold truncate">
                          TP4 (HTF Extension):
                        </span>
                        <span className="text-[#34d399] font-extrabold truncate text-xs sm:text-sm floating-text-slow">
                          {result.takeProfit4}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopySingleCoord("tp4", result.takeProfit4, e)}
                        className="p-1 rounded bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#34d399] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Copy TP4"
                      >
                        {copiedTarget === "tp4" ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3 text-[#34d399]" />}
                        <span className="text-[8px] font-bold">{copiedTarget === "tp4" ? "COPIED" : "COPY"}</span>
                      </button>
                    </div>
                  )}

                  {result.takeProfit5 && (
                    <div className="bg-black p-2 sm:p-2.5 rounded-lg border border-[#00FF66]/35 flex items-center justify-between min-w-0 glowing-card-border">
                      <div className="flex flex-col min-w-0 mr-1">
                        <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/70 font-bold truncate">
                          TP5 (Extended Target):
                        </span>
                        <span className="text-[#34d399] font-extrabold truncate text-xs sm:text-sm floating-text-slow">
                          {result.takeProfit5}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopySingleCoord("tp5", result.takeProfit5, e)}
                        className="p-1 rounded bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#34d399] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Copy TP5"
                      >
                        {copiedTarget === "tp5" ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3 text-[#34d399]" />}
                        <span className="text-[8px] font-bold">{copiedTarget === "tp5" ? "COPIED" : "COPY"}</span>
                      </button>
                    </div>
                  )}

                  {result.takeProfit6 && (
                    <div className="bg-black p-2 sm:p-2.5 rounded-lg border border-[#00FF66]/35 flex items-center justify-between min-w-0 glowing-card-border">
                      <div className="flex flex-col min-w-0 mr-1">
                        <span className="text-[8.5px] sm:text-[9px] text-[#34d399]/70 font-bold truncate">
                          TP6 (Terminal Target):
                        </span>
                        <span className="text-[#34d399] font-extrabold truncate text-xs sm:text-sm floating-text-slow">
                          {result.takeProfit6}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopySingleCoord("tp6", result.takeProfit6, e)}
                        className="p-1 rounded bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#34d399] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Copy TP6"
                      >
                        {copiedTarget === "tp6" ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3 text-[#34d399]" />}
                        <span className="text-[8px] font-bold">{copiedTarget === "tp6" ? "COPIED" : "COPY"}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. INSTITUTIONAL ORDER FLOW RATIONALE WITH GLOWING BORDER */}
              <div className="bg-black p-3.5 rounded-xl border border-[#00FF66]/40 space-y-1.5 shadow-[0_0_15px_rgba(0,255,102,0.15)] glowing-card-border">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[#34d399] uppercase tracking-widest font-black flex items-center gap-1.5 floating-text-slow">
                    <Zap className="w-3.5 h-3.5 text-[#34d399]" />
                    <span className="text-[#34d399]">INSTITUTIONAL ORDER FLOW REASONING</span>
                  </span>
                  <span className="text-[9px] text-[#34d399]/70 font-bold floating-text-delay">
                    STRUCTURE: {result.marketStructure}
                  </span>
                </div>
                <p className="text-xs text-[#34d399]/90 font-sans leading-relaxed">
                  {result.orderExecutionReason || (
                    result.reasoning && result.reasoning.length > 0
                      ? result.reasoning.join(" ")
                      : isBuy
                      ? `Bullish liquidity sweep confirmed. Price respected discount order block and printed displacement with Fair Value Gap confluence. Favorable ${result.riskRewardRatio} risk-reward.`
                      : isSell
                      ? `Bearish break of structure identified. Premium mitigation block rejected with institutional volume displacement targeting sell-side liquidity.`
                      : `Market is consolidating within chop range. No high-probability institutional setup meets risk-reward thresholds.`
                  )}
                </p>
              </div>

              {/* 4. TABS FOR DEEP CONFLUENCE MATRIX & SMC AUDIT */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2 border-b border-[#00FF66]/30 pb-2 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => {
                      shadsAudio.playClick();
                      setActiveHudTab("overview");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      activeHudTab === "overview"
                        ? "bg-[#00FF66]/20 border border-[#00FF66] text-[#34d399] shadow-[0_0_12px_rgba(0,255,102,0.25)]"
                        : "text-[#34d399]/60 hover:text-[#34d399]"
                    }`}
                  >
                    Engine Confluence
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      shadsAudio.playClick();
                      setActiveHudTab("matrix");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      activeHudTab === "matrix"
                        ? "bg-[#00FF66]/20 border border-[#00FF66] text-[#34d399] shadow-[0_0_12px_rgba(0,255,102,0.25)]"
                        : "text-[#34d399]/60 hover:text-[#34d399]"
                    }`}
                  >
                    24-Strategy Matrix
                  </button>
                </div>

                {activeHudTab === "matrix" && (
                  <StrategyMatrixPanel result={result} />
                )}

                {activeHudTab === "overview" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* SMC & Liquidity Confluence */}
                    <div className="bg-black p-3 rounded-xl border border-[#00FF66]/40 space-y-2 glowing-card-border">
                      <span className="text-[9px] text-[#34d399] uppercase tracking-wider font-bold block floating-text-slow">
                        SMC &amp; LIQUIDITY MAPPING
                      </span>
                      <div className="space-y-1 text-[11px] text-[#34d399]/90">
                        <div className="flex justify-between">
                          <span className="text-[#34d399]/60">Order Block:</span>
                          <span className="text-[#34d399] font-bold">{result.smcAnalysis?.orderBlocks || "Confirmed Invalidation Zone"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#34d399]/60">Fair Value Gap (FVG):</span>
                          <span className="text-[#34d399] font-bold">{result.smcAnalysis?.marketImbalance || "Imbalance Swept"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#34d399]/60">Liquidity Target:</span>
                          <span className="text-[#34d399] font-bold">{result.smcAnalysis?.liquiditySweeps || "Equal Highs/Lows Target"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Technical Indicators Confluence */}
                    <div className="bg-black p-3 rounded-xl border border-[#00FF66]/40 space-y-2 glowing-card-border">
                      <span className="text-[9px] text-[#34d399] uppercase tracking-wider font-bold block floating-text-slow">
                        QUANT &amp; MOMENTUM ENGINES
                      </span>
                      <div className="space-y-1 text-[11px] text-[#34d399]/90">
                        <div className="flex justify-between">
                          <span className="text-[#34d399]/60">Support / Resistance:</span>
                          <span className="text-[#34d399] font-bold">{result.technicalAnalysis?.supportResistance || "Key S/R Flipped"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#34d399]/60">Supply / Demand:</span>
                          <span className="text-[#34d399] font-bold">{result.technicalAnalysis?.supplyDemand || "Institutional Zone"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#34d399]/60">Execution Mode:</span>
                          <span className="text-[#34d399] font-bold">{result.orderTypeCategory || "MARKET / PENDING"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
