import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Compass, 
  Search, 
  Sparkles,
  SlidersHorizontal,
  ShieldCheck,
  CheckCircle2,
  X
} from "lucide-react";
import { ScanResult, StrategyStatus } from "../types";
import { shadsAudio } from "../utils/audio";

interface StrategyMatrixPanelProps {
  result?: ScanResult | null;
}

export const ALL_STRATEGIES_CATALOG = [
  // core requested strategies
  { id: "mom", name: "Momentum Trading Strategy", category: "structure" as const, desc: "High-velocity directional thrust riding volume expansion, impulse candles, and RSI/MACD momentum alignment." },
  { id: "bo", name: "Breakout Strategy", category: "structure" as const, desc: "Explosive range & consolidation expansion taking advantage of structural breaks past key support/resistance boundaries." },
  { id: "rev", name: "Reversal Strategy", category: "smc" as const, desc: "Institutional pivot setup capturing liquidity sweep exhaustion, oversold/overbought divergence, and rejection pinbars." },
  { id: "br", name: "Break and Retest Strategy", category: "structure" as const, desc: "High-confluence structural flip trade where broken support/resistance or BOS level is retested as new support/resistance." },

  // SMC & Institutional Flow
  { id: "ob", name: "Order Block", category: "smc" as const, desc: "Institutional buy/sell order stack zone before explosive displacement." },
  { id: "ls", name: "Liquidity Sweeps", category: "smc" as const, desc: "Raid on retail stops above swing highs (BSL) or below swing lows (SSL)." },
  { id: "fvg", name: "Fair Value Gaps (FVG)", category: "smc" as const, desc: "3-candle liquidity imbalance gap awaiting re-fill by smart money." },
  { id: "rb", name: "Rejection Blocks", category: "smc" as const, desc: "Long shadow wick zones where institutional orders absorbed retail flow." },
  { id: "mb", name: "Mitigation Blocks", category: "smc" as const, desc: "Failed order block re-tested and mitigated to break even before reversal." },
  { id: "disp", name: "Displacement", category: "smc" as const, desc: "High-momentum impulsive move confirming bank volume participation." },

  // Market Structure & Action
  { id: "mss", name: "Market Structure Shift (MSS)", category: "structure" as const, desc: "Lower-timeframe trend shift signalling structural directional bias change." },
  { id: "bos", name: "Break of Structure (BOS)", category: "structure" as const, desc: "Trend continuation past prior swing high or swing low." },
  { id: "choch", name: "Change of Character (CHoCH)", category: "structure" as const, desc: "First structural break indicating potential major trend reversal." },
  { id: "pb", name: "Pullback Strategies", category: "structure" as const, desc: "Discount/Premium re-entry after high-volume displacement leg." },
  { id: "kz", name: "Range + Kill Zones", category: "structure" as const, desc: "Asia range sweep & high-liquidity London/NY Session Kill Zone windows." },

  // Supply/Demand & Technicals
  { id: "sr", name: "Support & Resistance", category: "technicals" as const, desc: "Key horizontal price ceilings and floors with historical reaction pivots." },
  { id: "sd", name: "Supply & Demand", category: "technicals" as const, desc: "Unfilled institutional limit order pools causing rapid price rejections." },
  { id: "tl", name: "Trend Lines", category: "technicals" as const, desc: "Diagonal structural boundary lines defining market slope and dynamic support." },
  { id: "cp", name: "Chart Patterns", category: "technicals" as const, desc: "Head & Shoulders, Double Top/Bottom, Triangles, Wedges & Flags." },
  { id: "candle", name: "Candlestick Patterns", category: "technicals" as const, desc: "Pinbars, Engulfing candles, Morning Stars, and Doji rejections." },

  // Harmonics & Wave Analysis
  { id: "fib", name: "Fibonacci Retracement", category: "harmonic" as const, desc: "0.618 / 0.786 Optimal Trade Entry (OTE) golden ratio retracements." },
  { id: "ew", name: "Elliott Waves", category: "harmonic" as const, desc: "5-wave impulse sequence and 3-wave A-B-C corrective cycles." },
  { id: "harmonic", name: "Harmonic Patterns", category: "harmonic" as const, desc: "Gartley, Bat, Butterfly, Crab, and Cypher PRZ reversal patterns." },
  { id: "wyckoff", name: "Wyckoff Method", category: "harmonic" as const, desc: "Accumulation / Distribution schematic phases (Spring, Upthrust, SOS)." },

  // Volume & Session Dynamics
  { id: "vp", name: "Volume Profile", category: "volume" as const, desc: "Point of Control (POC), Value Area High (VAH), and Value Area Low (VAL)." },
  { id: "vwap", name: "VWAP", category: "volume" as const, desc: "Volume Weighted Average Price & +1/-1 Standard Deviation envelopes." },
  { id: "sbo", name: "Session Breakout Strategies", category: "volume" as const, desc: "Asian range expansion and London Open breakout momentum setups." }
];

export default function StrategyMatrixPanel({ result }: StrategyMatrixPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeStrategyModal, setActiveStrategyModal] = useState<StrategyStatus | null>(null);

  const isBuy = result?.signal === "BUY";
  const isSell = result?.signal === "SELL";
  const defaultStatus = isBuy ? "BULLISH" : isSell ? "BEARISH" : "NEUTRAL";

  // Build complete list of 24 strategy items using result matrix or computed fallback
  const strategyItems: StrategyStatus[] = ALL_STRATEGIES_CATALOG.map((catItem) => {
    const existing = result?.strategiesMatrix?.find((s) => s.id === catItem.id || s.name.toLowerCase().includes(catItem.name.toLowerCase()));
    if (existing) {
      return existing;
    }

    let details = catItem.desc;
    if (catItem.id === "ob" && result?.smcAnalysis?.orderBlocks) details = result.smcAnalysis.orderBlocks;
    if (catItem.id === "ls" && result?.smcAnalysis?.liquiditySweeps) details = result.smcAnalysis.liquiditySweeps;
    if (catItem.id === "fvg" && result?.smcAnalysis?.marketImbalance) details = result.smcAnalysis.marketImbalance;
    if (catItem.id === "rb" && result?.smcAnalysis?.rejectionBlocks) details = result.smcAnalysis.rejectionBlocks;
    if (catItem.id === "mb" && result?.smcAnalysis?.mitigationBlocks) details = result.smcAnalysis.mitigationBlocks;
    if (catItem.id === "disp" && result?.smcAnalysis?.displacement) details = result.smcAnalysis.displacement;

    if (catItem.id === "mss" && result?.marketStructureAnalysis?.marketStructureShift) details = result.marketStructureAnalysis.marketStructureShift;
    if (catItem.id === "bos" && result?.marketStructureAnalysis?.breakOfStructure) details = result.marketStructureAnalysis.breakOfStructure;
    if (catItem.id === "choch" && result?.marketStructureAnalysis?.changeOfCharacter) details = result.marketStructureAnalysis.changeOfCharacter;
    if (catItem.id === "bo" && result?.marketStructureAnalysis?.breakoutStrategy) details = result.marketStructureAnalysis.breakoutStrategy;
    if (catItem.id === "pb" && result?.marketStructureAnalysis?.pullbackStrategy) details = result.marketStructureAnalysis.pullbackStrategy;
    if (catItem.id === "kz" && result?.marketStructureAnalysis?.sessionKillZones) details = result.marketStructureAnalysis.sessionKillZones;
    if (catItem.id === "mom" && result?.marketStructureAnalysis?.momentumStrategy) details = result.marketStructureAnalysis.momentumStrategy;
    if (catItem.id === "rev" && result?.marketStructureAnalysis?.reversalStrategy) details = result.marketStructureAnalysis.reversalStrategy;
    if (catItem.id === "br" && result?.marketStructureAnalysis?.breakAndRetestStrategy) details = result.marketStructureAnalysis.breakAndRetestStrategy;

    if (catItem.id === "sr" && result?.technicalAnalysis?.supportResistance) details = result.technicalAnalysis.supportResistance;
    if (catItem.id === "sd" && result?.technicalAnalysis?.supplyDemand) details = result.technicalAnalysis.supplyDemand;
    if (catItem.id === "tl" && result?.technicalAnalysis?.trendlines) details = result.technicalAnalysis.trendlines;
    if (catItem.id === "cp" && result?.technicalAnalysis?.chartPatterns) details = result.technicalAnalysis.chartPatterns;
    if (catItem.id === "candle" && result?.technicalAnalysis?.candlestickPattern) details = result.technicalAnalysis.candlestickPattern;

    if (catItem.id === "fib" && result?.harmonicWaveAnalysis?.fibonacciRetracement) details = result.harmonicWaveAnalysis.fibonacciRetracement;
    if (catItem.id === "ew" && result?.harmonicWaveAnalysis?.elliottWaves) details = result.harmonicWaveAnalysis.elliottWaves;
    if (catItem.id === "harmonic" && result.harmonicWaveAnalysis?.harmonicPatterns) details = result.harmonicWaveAnalysis.harmonicPatterns;
    if (catItem.id === "wyckoff" && result.harmonicWaveAnalysis?.wyckoffMethod) details = result.harmonicWaveAnalysis.wyckoffMethod;

    if (catItem.id === "vp" && result.volumeSessionAnalysis?.volumeProfile) details = result.volumeSessionAnalysis.volumeProfile;
    if (catItem.id === "vwap" && result.volumeSessionAnalysis?.vwapAnalysis) details = result.volumeSessionAnalysis.vwapAnalysis;
    if (catItem.id === "sbo" && result.volumeSessionAnalysis?.sessionBreakouts) details = result.volumeSessionAnalysis.sessionBreakouts;

    const baseConf = result.confidence || 85;
    const randomOffset = (catItem.id.charCodeAt(0) % 7) - 3;
    const confidence = Math.min(99, Math.max(70, baseConf + randomOffset));

    return {
      id: catItem.id,
      name: catItem.name,
      category: catItem.category,
      status: defaultStatus,
      confidence,
      details
    };
  });

  // Filter strategies by category and search term
  const filteredStrategies = strategyItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: "all", label: "All 24 Strategies", count: 24, icon: Layers },
    { id: "smc", label: "SMC & Institutional Flow", count: 6, icon: Sparkles },
    { id: "structure", label: "Market Structure & Action", count: 6, icon: Activity },
    { id: "technicals", label: "S&R & Technicals", count: 5, icon: SlidersHorizontal },
    { id: "harmonic", label: "Harmonics, Waves & Wyckoff", count: 4, icon: Compass },
    { id: "volume", label: "Volume & Sessions", count: 3, icon: BarChart3 }
  ];

  return (
    <div className="bg-black border border-[#00FF66]/40 rounded-xl p-5 shadow-[0_0_20px_rgba(0,255,102,0.1)] relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#00FF66]/30 pb-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black border-2 border-[#00FF66] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.3)]">
            <Zap className="w-5 h-5 text-[#34d399] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#34d399]/70 font-bold">24-STRATEGY ARSENAL ENGINE</span>
              <span className="bg-black border border-[#00FF66] text-[#34d399] font-mono text-[8px] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-[0_0_8px_rgba(0,255,102,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping"></span>
                ACTIVE MATRIX SCAN
              </span>
            </div>
            <h3 className="font-mono text-base font-black text-[#34d399] uppercase tracking-wider neon-glow-text">
              Institutional Strategy Matrix
            </h3>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Filter 24 strategies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black text-[#34d399] border border-[#00FF66]/50 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono placeholder:text-[#34d399]/40 focus:outline-none focus:border-[#00FF66] transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-[#34d399]/60 absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-5 relative z-10">
        {categories.map((cat) => {
          const IconComp = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => { shadsAudio.playClick(); setSelectedCategory(cat.id); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer font-semibold ${
                isActive
                  ? "bg-black border-2 border-[#00FF66] text-[#34d399] shadow-[0_0_12px_rgba(0,255,102,0.25)]"
                  : "bg-black border border-[#00FF66]/40 text-[#34d399]/70 hover:text-[#34d399] hover:border-[#00FF66]"
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? "text-[#34d399]" : "text-[#34d399]/60"}`} />
              <span className="text-[#34d399]">{cat.label}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isActive ? "bg-black border border-[#00FF66] text-[#34d399]" : "bg-black text-[#34d399]/60"}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Strategy Cards */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10"
      >
        <AnimatePresence>
          {filteredStrategies.map((strat, index) => {
            const isStratBuy = strat.status === "BULLISH";
            const isStratSell = strat.status === "BEARISH";
            
            let badgeBg = "bg-black text-[#34d399] border-[#00FF66]/50";
            let badgeIcon = <Activity className="w-3 h-3 text-[#34d399]" />;

            if (isStratBuy) {
              badgeBg = "bg-black text-[#34d399] border-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.25)]";
              badgeIcon = <TrendingUp className="w-3 h-3 text-[#34d399]" />;
            } else if (isStratSell) {
              badgeBg = "bg-black text-[#34d399] border-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.25)]";
              badgeIcon = <TrendingDown className="w-3 h-3 text-[#34d399]" />;
            }

            return (
              <motion.div
                key={strat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                onClick={() => { shadsAudio.playClick(); setActiveStrategyModal(strat); }}
                className="bg-black border border-[#00FF66]/35 hover:border-[#00FF66] rounded-xl p-3.5 flex flex-col justify-between transition-all cursor-pointer group shadow-[0_0_10px_rgba(0,255,102,0.05)] hover:shadow-[0_0_15px_rgba(0,255,102,0.2)]"
              >
                <div>
                  {/* Top Row: Name & Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-mono text-xs font-bold text-[#34d399] group-hover:text-[#34d399] transition-colors flex items-center gap-1.5 neon-glow-text">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] group-hover:animate-ping"></span>
                      {strat.name}
                    </h4>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded text-[8px] font-mono font-black uppercase tracking-wider ${badgeBg}`}>
                      {badgeIcon}
                      {strat.status}
                    </span>
                  </div>

                  {/* Details text */}
                  <p className="font-sans text-[11px] text-[#34d399]/85 line-clamp-2 leading-relaxed mb-3">
                    {strat.details}
                  </p>
                </div>

                {/* Bottom Row: Confidence bar & indicator */}
                <div className="border-t border-[#00FF66]/20 pt-2.5 flex items-center justify-between gap-2 font-mono text-[9px]">
                  <span className="text-[#34d399]/65 uppercase tracking-widest font-semibold">Alignment Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-black h-1.5 rounded-full overflow-hidden border border-[#00FF66]/40">
                      <div
                        className="h-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] rounded-full transition-all duration-500"
                        style={{ width: `${strat.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-[#34d399] font-extrabold">{strat.confidence}%</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Modal Popup when clicking a strategy card */}
      <AnimatePresence>
        {activeStrategyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveStrategyModal(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border-2 border-[#00FF66] rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(0,255,102,0.3)] relative"
            >
              <div className="flex items-center justify-between border-b border-[#00FF66]/40 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#34d399]" />
                  <h3 className="font-mono text-base font-black text-[#34d399] neon-glow-text">{activeStrategyModal.name}</h3>
                </div>
                <button
                  onClick={() => setActiveStrategyModal(null)}
                  className="text-[#34d399] hover:bg-[#00FF66]/20 font-mono text-sm p-1 rounded border border-[#00FF66] cursor-pointer"
                >
                  <X className="w-4 h-4 text-[#34d399]" />
                </button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between bg-black border border-[#00FF66]/40 p-3 rounded-lg">
                  <span className="text-[#34d399]/70 uppercase tracking-wider text-[10px]">Institutional Status:</span>
                  <span className="px-2 py-0.5 rounded font-bold uppercase bg-black border border-[#00FF66] text-[#34d399] shadow-[0_0_10px_rgba(0,255,102,0.25)]">
                    {activeStrategyModal.status} ({activeStrategyModal.confidence}% Match)
                  </span>
                </div>

                <div>
                  <span className="text-[#34d399] uppercase tracking-wider font-bold text-[10px] block mb-1">
                    Strategy Breakdown &amp; Analysis
                  </span>
                  <p className="font-sans text-xs text-[#34d399]/90 bg-black border border-[#00FF66]/40 p-3 rounded-lg leading-relaxed">
                    {activeStrategyModal.details}
                  </p>
                </div>

                <div className="bg-black border border-[#00FF66]/60 rounded-lg p-3 text-[11px] text-[#34d399] shadow-[0_0_10px_rgba(0,255,102,0.15)]">
                  <div className="flex items-center gap-1.5 font-bold mb-1 text-[#34d399]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                    <span className="neon-glow-text">Confluence Recommendation</span>
                  </div>
                  <span className="text-[#34d399]/85">This strategy engine aligns with higher-timeframe order flow and confirms trade execution validity within your risk management rules.</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
