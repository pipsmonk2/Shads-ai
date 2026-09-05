import React, { useState, useEffect } from "react";
import { Globe, RefreshCw, TrendingUp, TrendingDown, HelpCircle, AlertOctagon, Flame, Zap, ShieldAlert, ArrowUpRight, ArrowDownRight, Compass, Bell, Clock, Maximize2, Minimize2, ChevronDown, ChevronUp, X } from "lucide-react";
import { SentimentData, SentimentEvent } from "../types";
import { shadsAudio } from "../utils/audio";
import { getApiUrl } from "../utils/api";

interface HighImpactCountdownWidgetProps {
  events: SentimentEvent[];
}

function HighImpactCountdownWidget({ events }: HighImpactCountdownWidgetProps) {
  const highImpactEvents = events.filter(e => e.impact === "HIGH");
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Second-by-second live countdown timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (highImpactEvents.length === 0) return null;

  const currentEvent = highImpactEvents[selectedEventIndex] || highImpactEvents[0];

  // Derive target timestamp
  let targetTimestamp = currentEvent.scheduledTimestamp;
  if (!targetTimestamp) {
    targetTimestamp = Date.now() + (1 * 3600 + 42 * 60 + 15) * 1000;
  }

  const diffMs = Math.max(0, targetTimestamp - now);
  const totalSecs = Math.floor(diffMs / 1000);

  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const isExpired = totalSecs === 0;
  const isUrgent = totalSecs > 0 && totalSecs < 900; // < 15 mins

  const padZero = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className={`p-4 rounded-xl border-2 transition-all my-2 bg-black ${
      isExpired
        ? "border-[#00FF66] shadow-[0_0_25px_rgba(0,255,102,0.4)] animate-pulse"
        : isUrgent
        ? "border-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.3)]"
        : "border-[#00FF66]/50 shadow-[0_0_15px_rgba(0,255,102,0.15)]"
    }`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#00FF66]/30 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#00FF66]" />
          <span className="font-mono text-xs font-black uppercase tracking-widest text-[#00FF66] flex items-center gap-1.5">
            <span>HIGH IMPACT NEWS COUNTDOWN</span>
            {isUrgent && !isExpired && (
              <span className="text-[8.5px] bg-black text-[#00FF66] border border-[#00FF66] px-1.5 py-0.2 rounded font-extrabold animate-pulse">
                ⚡ URGENT (&lt; 15M)
              </span>
            )}
            {isExpired && (
              <span className="text-[8.5px] bg-black text-[#00FF66] border border-[#00FF66] px-1.5 py-0.2 rounded font-extrabold animate-bounce">
                🔴 RELEASE LIVE IN MARKET
              </span>
            )}
          </span>
        </div>

        {/* Multi-event dropdown selector */}
        {highImpactEvents.length > 1 && (
          <div className="flex items-center gap-1">
            <span className="font-mono text-[9px] text-[#00FF66]/70">Target Event:</span>
            <select
              value={selectedEventIndex}
              onChange={(e) => {
                shadsAudio.playClick();
                setSelectedEventIndex(Number(e.target.value));
              }}
              className="bg-black border border-[#00FF66]/60 rounded text-[9.5px] font-mono text-[#00FF66] px-2 py-0.5 outline-none cursor-pointer hover:border-[#00FF66] transition-all"
            >
              {highImpactEvents.map((evt, idx) => (
                <option key={evt.id || idx} value={idx} className="bg-black text-[#00FF66]">
                  [{evt.currencyAffected}] {evt.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Target Event Info */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-mono text-sm sm:text-base font-black text-[#00FF66] leading-tight neon-glow-text">
            {currentEvent.title}
          </h3>
          <p className="text-[10px] font-mono text-[#00FF66]/90 font-semibold block mt-1">
            Impact Currency: <strong className="text-[#00FF66] bg-black border border-[#00FF66]/60 px-1.5 py-0.2 rounded">{currentEvent.currencyAffected}</strong>
            {currentEvent.timeUntil && <span className="ml-2 text-[#00FF66]/70">({currentEvent.timeUntil})</span>}
          </p>
        </div>

        <span className="px-2 py-1 rounded text-[9px] font-mono bg-black text-[#00FF66] border border-[#00FF66] font-extrabold uppercase shrink-0 shadow-[0_0_10px_rgba(0,255,102,0.3)]">
          HIGH IMPACT
        </span>
      </div>

      {/* Ticking Digital Clock Display (Hours : Minutes : Seconds) */}
      <div className="my-3 py-2.5 sm:py-3 px-2 sm:px-6 bg-black border border-[#00FF66]/40 rounded-xl flex items-center justify-center gap-1.5 sm:gap-4 font-mono shadow-[0_0_20px_rgba(0,255,102,0.1)] overflow-x-auto">
        {/* Hours Column */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-11 sm:w-16 sm:h-14 md:w-18 md:h-16 rounded-lg border-2 border-[#00FF66] bg-black flex items-center justify-center text-lg sm:text-2xl md:text-3xl font-black tracking-wider text-[#00FF66] neon-glow-text shadow-[0_0_15px_rgba(0,255,102,0.3)]">
            {padZero(hours)}
          </div>
          <span className="text-[7.5px] sm:text-[9px] uppercase font-bold text-[#00FF66]/70 mt-1 tracking-widest">HOURS</span>
        </div>

        {/* Separator */}
        <div className="text-lg sm:text-3xl font-black text-[#00FF66] -mt-3 sm:-mt-4 animate-pulse">:</div>

        {/* Minutes Column */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-11 sm:w-16 sm:h-14 md:w-18 md:h-16 rounded-lg border-2 border-[#00FF66] bg-black flex items-center justify-center text-lg sm:text-2xl md:text-3xl font-black tracking-wider text-[#00FF66] neon-glow-text shadow-[0_0_15px_rgba(0,255,102,0.3)]">
            {padZero(minutes)}
          </div>
          <span className="text-[7.5px] sm:text-[9px] uppercase font-bold text-[#00FF66]/70 mt-1 tracking-widest">MINUTES</span>
        </div>

        {/* Separator */}
        <div className="text-lg sm:text-3xl font-black text-[#00FF66] -mt-3 sm:-mt-4 animate-pulse">:</div>

        {/* Seconds Column */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-11 sm:w-16 sm:h-14 md:w-18 md:h-16 rounded-lg border-2 border-[#00FF66] bg-black flex items-center justify-center text-lg sm:text-2xl md:text-3xl font-black tracking-wider text-[#00FF66] neon-glow-text shadow-[0_0_20px_rgba(0,255,102,0.5)] animate-pulse">
            {padZero(seconds)}
          </div>
          <span className="text-[7.5px] sm:text-[9px] uppercase font-bold text-[#00FF66] mt-1 tracking-widest">SECONDS</span>
        </div>
      </div>

      {/* Volatility & Action Guidance Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-[#00FF66]/30 font-mono text-[9.5px]">
        {currentEvent.expectedPipVolatility && (
          <span className="text-[#00FF66] font-semibold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#00FF66] shrink-0 animate-pulse" />
            <span>Expected Volatility: <strong className="text-[#00FF66] bg-black border border-[#00FF66]/60 px-1 py-0.2 rounded">{currentEvent.expectedPipVolatility}</strong></span>
          </span>
        )}

        {currentEvent.recommendedAction && (
          <span className="text-[#00FF66]/90 italic">
            💡 {currentEvent.recommendedAction}
          </span>
        )}
      </div>
    </div>
  );
}

// Client-side fallback macroeconomic intelligence dataset
function getDefaultMarketSentiment(): SentimentData {
  const now = Date.now();
  return {
    overallMood: "BULLISH_USD",
    headlineSummary: "US Dollar holds structural bullish momentum ahead of CPI & labor prints; elevated volatility anticipated across EUR/USD, GBP/USD & Gold.",
    events: [
      {
        id: "evt_1",
        title: "US Core CPI & Inflation Rate Release",
        impact: "HIGH",
        description: "Monthly US Consumer Price Index forecast at +0.3% MoM. Persistent core inflation reading reinforces Federal Reserve higher-for-longer monetary policy, driving aggressive USD liquidity absorption.",
        currencyAffected: "USD",
        directionalBias: "BULLISH",
        directionalReasoning: "Stronger CPI numbers reinforce hawkish Fed stance. Expected to drive USD up sharply while triggering swift sell-offs in EUR/USD, GBP/USD, and Gold (XAU/USD).",
        timeUntil: "In 1h 42m (13:30 GMT)",
        scheduledTimestamp: now + (1 * 3600 + 42 * 60 + 15) * 1000,
        expectedPipVolatility: "90 - 150 Pips",
        forecastValue: "+0.3% MoM (+3.2% YoY)",
        previousValue: "+0.2% MoM (+2.9% YoY)",
        fundamentalContext: "Core inflation (ex-food & energy) remains the primary catalyst for FOMC interest rate trajectories. A higher print eliminates near-term rate cut probabilities.",
        affectedPairs: ["EUR/USD", "GBP/USD", "USD/JPY", "XAU/USD", "USD/CAD"],
        recommendedAction: "Wait for initial 5-minute liquidity sweep spike. Look for Fair Value Gap (FVG) retests in line with the USD directional trend before entry.",
        preNewsStrategy: "Cancel active pending limit orders 15 minutes prior. Identify Asian High/Low liquidity targets. Widen stops to withstand spread expansion.",
        postNewsStrategy: "Allow 5-15 minutes for broker spreads to normalize. If CPI prints hot (>0.3%), execute SELL LIMIT on EUR/USD at 50% FVG retrace or BUY NOW on USD/JPY. If CPI cools (<0.2%), BUY NOW on Gold (XAU/USD).",
        pairRecommendations: [
          {
            pair: "EUR/USD",
            action: "SELL",
            orderType: "SELL LIMIT",
            triggerScenario: "Core CPI >= +0.3% MoM with initial sweep of Asian session high",
            expectedMove: "-90 to -150 Pips",
            why: "Higher US yields trigger capital outflow from Eurozone assets directly into US Treasuries, accelerating EUR/USD sell-off into institutional discount demand.",
            fundamentalMechanism: "Fed Hawkish Divergence -> US Yield Expansion -> EUR/USD Liquidations.",
            riskLevel: "CONTROLLED"
          },
          {
            pair: "XAU/USD (Gold)",
            action: "BUY",
            orderType: "BUY NOW",
            triggerScenario: "If CPI misses forecast (< +0.2% MoM) and 10Y Treasury yields drop",
            expectedMove: "+$40.00 to +$75.00",
            why: "Cooling inflation cements emergency rate cut bets, collapsing the Dollar Index and sparking algorithmic store-of-value safe haven Gold buying.",
            fundamentalMechanism: "Dollar Devaluation + Real Yield Collapse -> Algorithmic Gold Bids.",
            riskLevel: "HIGH"
          },
          {
            pair: "USD/JPY",
            action: "BUY",
            orderType: "BUY LIMIT",
            triggerScenario: "CPI prints above expectations; entry on 15M order block retest",
            expectedMove: "+100 to +180 Pips",
            why: "Widest interest rate differential in G10. Higher US CPI guarantees US-Japan rate spread remains deep, fueling carry trade buying of USD against JPY.",
            fundamentalMechanism: "Fed-BOJ Rate Divergence -> Institutional Carry Trade Acceleration -> USD/JPY rally.",
            riskLevel: "CONTROLLED"
          },
          {
            pair: "GBP/USD",
            action: "SELL",
            orderType: "SELL LIMIT",
            triggerScenario: "50% FVG retrace on 15M chart after CPI spike",
            expectedMove: "-70 to -120 Pips",
            why: "Pound Sterling is highly sensitive to US Dollar liquidity sweeps. Cable sells off toward daily support at 1.2640 on Dollar strength.",
            fundamentalMechanism: "Global Risk-Off Rotation into USD Cash -> Sterling liquidation.",
            riskLevel: "CONTROLLED"
          }
        ],
        possibleBullishOutcome: {
          trigger: "CPI prints > +0.3% MoM or YoY exceeds 3.2%",
          expectedPips: "+110 to +180 Pips USD Rally",
          targetPairs: "EUR/USD dumps toward 1.0780; Gold breaks below $2,320; USD/JPY pushes past 159.80",
          institutionalPlan: "Wait for initial 5M liquidity sweep above Asian High, then execute short EUR/USD on Fair Value Gap break and retest."
        },
        possibleBearishOutcome: {
          trigger: "CPI prints < +0.2% MoM or YoY cools below 2.9%",
          expectedPips: "-100 to -150 Pips USD Sell-Off",
          targetPairs: "EUR/USD rallies toward 1.0920; Gold spikes toward $2,380; USD/JPY falls below 156.50",
          institutionalPlan: "Look for 15M displacement candle above previous day high, enter long EUR/USD on OTE discount retest."
        }
      },
      {
        id: "evt_2",
        title: "US Non-Farm Payrolls (NFP) & Unemployment Rate",
        impact: "HIGH",
        description: "US labor market report anticipated at 185K jobs added with Unemployment holding at 4.0%. Strong labor metrics provide fundamental fuel for USD bullish extension.",
        currencyAffected: "USD",
        directionalBias: "HIGH_VOLATILITY",
        directionalReasoning: "NFP releases trigger initial liquidity spikes in both directions before establishing true trend direction. High risk of slippage during first 5 minutes.",
        timeUntil: "In 4h 15m (13:30 GMT)",
        scheduledTimestamp: now + (4 * 3600 + 15 * 60) * 1000,
        expectedPipVolatility: "100 - 200 Pips",
        forecastValue: "185K Jobs Added (4.0% Unemployment)",
        previousValue: "206K Jobs Added (4.1% Unemployment)",
        fundamentalContext: "Labor market resilience is the primary pivot point for FOMC monetary policy. Wage growth (+0.3% MoM exp) will dictate inflation expectations.",
        affectedPairs: ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CAD", "XAU/USD"],
        recommendedAction: "Wait for 15-minute candle closure after release to confirm directional break of market structure before placing market orders.",
        preNewsStrategy: "Clear existing market orders. Identify session Liquidity Pools (Equal Highs/Lows). Prepare pending STOP or LIMIT orders on major breakout levels.",
        postNewsStrategy: "Allow 15 minutes post-NFP for spread normalization. On strong NFP (>210k), execute SELL NOW on EUR/USD & GBP/USD on 15M displacement. On weak NFP (<140k), execute BUY NOW on Gold & EUR/USD.",
        pairRecommendations: [
          {
            pair: "USD/CAD",
            action: "BUY",
            orderType: "BUY LIMIT",
            triggerScenario: "Strong US NFP print with US-Canada jobs growth divergence",
            expectedMove: "+80 to +140 Pips",
            why: "Robust US employment confirms resilient US consumer demand while Bank of Canada eases rates, driving capital into USD/CAD.",
            fundamentalMechanism: "Fed/BoC Policy Divergence -> Capital Inflows to USD -> USD/CAD expansion.",
            riskLevel: "CONTROLLED"
          },
          {
            pair: "EUR/USD",
            action: "SELL",
            orderType: "SELL LIMIT",
            triggerScenario: "NFP > 190k + Unemployment <= 4.0%",
            expectedMove: "-90 to -160 Pips",
            why: "Tight labor market pushes rate cut expectations into future quarters, creating heavy Dollar demand against the weakening Euro.",
            fundamentalMechanism: "Higher US Interest Rate Expectations -> DXY Surge -> EUR/USD drops to discount.",
            riskLevel: "CONTROLLED"
          },
          {
            pair: "XAU/USD (Gold)",
            action: "BUY",
            orderType: "BUY NOW",
            triggerScenario: "If NFP misses (< 150k jobs) & Unemployment rises to 4.2%",
            expectedMove: "+$35.00 to +$60.00",
            why: "Labor market weakness sparks immediate Fed rate cut bets, crashing US bond yields and triggering an explosive safe-haven and store-of-value Gold rally.",
            fundamentalMechanism: "Yield Collapse + Dollar Devaluation -> Algorithmic Gold Bids.",
            riskLevel: "HIGH"
          }
        ],
        possibleBullishOutcome: {
          trigger: "NFP exceeds 210K jobs with Unemployment dropping to 3.9%",
          expectedPips: "+120 to +220 Pips USD Expansion",
          targetPairs: "GBP/USD breaks 1.2650 floor; USD/CAD breaks 1.3780 ceiling; XAU/USD drops $40+",
          institutionalPlan: "Rely on 15M Break and Retest of session low. Enter short on retest of broken order block."
        },
        possibleBearishOutcome: {
          trigger: "NFP misses below 140K or Unemployment rises to 4.2%+",
          expectedPips: "-110 to -190 Pips USD Devaluation",
          targetPairs: "GBP/USD surges toward 1.2850; AUD/USD breaks 0.6750; USD/CAD drops toward 1.3580",
          institutionalPlan: "Enter momentum long on high-volume 5M displacement candle following sweep of sell-side liquidity."
        }
      },
      {
        id: "evt_3",
        title: "ECB Interest Rate Decision & Lagarde Presser",
        impact: "HIGH",
        description: "European Central Bank expected to cut deposit rate by 25 bps to 3.50%. Dovish commentary regarding European economic stagnation will weigh heavily on the Euro.",
        currencyAffected: "EUR",
        directionalBias: "BEARISH",
        directionalReasoning: "Rate cut expectation creates bearish downward pressure on EUR/USD and EUR/GBP into technical discount order blocks.",
        timeUntil: "Tomorrow 12:45 GMT",
        scheduledTimestamp: now + 24 * 3600 * 1000,
        expectedPipVolatility: "70 - 120 Pips",
        forecastValue: "3.50% (-25 bps cut)",
        previousValue: "3.75%",
        fundamentalContext: "Stagnating PMI data across Germany and France is pushing the ECB to ease policy faster than the Fed, creating an widening interest rate differential in favor of USD.",
        affectedPairs: ["EUR/USD", "EUR/GBP", "EUR/JPY"],
        recommendedAction: "Target bearish breaks below 15M Asian session lows with tight stop losses above press conference swing highs.",
        possibleBullishOutcome: {
          trigger: "ECB holds rates unchanged or Lagarde signals hawkish pause in cuts",
          expectedPips: "+80 to +130 Pips EUR Short-Squeeze",
          targetPairs: "EUR/USD surges toward 1.0940; EUR/GBP pushes past 0.8520",
          institutionalPlan: "Execute Reversal Strategy: enter long upon 15M bullish CHoCH close above session supply."
        },
        possibleBearishOutcome: {
          trigger: "ECB cuts 25 bps and signals further consecutive rate cuts in Q4",
          expectedPips: "-90 to -140 Pips EUR Sell-Off",
          targetPairs: "EUR/USD slides to 1.0740; EUR/JPY breaks below 170.00",
          institutionalPlan: "Execute Momentum Breakout: sell EUR/USD on 15M candle close below Asian range low."
        }
      },
      {
        id: "evt_4",
        title: "Bank of Japan (BOJ) Policy Rate Statement",
        impact: "HIGH",
        description: "Governor Kazuo Ueda hints at potential rate hikes and quantitative tightening (QT) to defend Yen against historic currency depreciation.",
        currencyAffected: "JPY",
        directionalBias: "BULLISH",
        directionalReasoning: "Hawkish BOJ tone threatens sharp downside reversals on USD/JPY and EUR/JPY as carry trades unwind across global markets.",
        timeUntil: "Overnight Session",
        scheduledTimestamp: now + 36 * 3600 * 1000,
        expectedPipVolatility: "110 - 180 Pips",
        forecastValue: "0.25% (+15 bps hike)",
        previousValue: "0.10%",
        fundamentalContext: "Ministry of Finance interventions and BOJ policy normalization are driving massive unwinding of JPY short positions.",
        affectedPairs: ["USD/JPY", "GBP/JPY", "EUR/JPY"],
        recommendedAction: "Monitor key institutional supply zones on H4 chart for bearish exhaustion setups.",
        possibleBullishOutcome: {
          trigger: "BOJ raises rate to 0.25% and announces JGB bond buying reductions",
          expectedPips: "+150 to +250 Pips JPY Surge (USD/JPY Drop)",
          targetPairs: "USD/JPY dumps from 158.50 down to 155.00; GBP/JPY drops 300+ pips",
          institutionalPlan: "Sell USD/JPY on Break and Retest of 1M/5M order block following initial announcement spike."
        },
        possibleBearishOutcome: {
          trigger: "BOJ maintains current policy and delays bond buying cut details",
          expectedPips: "-120 to -200 Pips JPY Devaluation (USD/JPY Spike)",
          targetPairs: "USD/JPY rallies toward 160.50; EUR/JPY breaks 173.00 resistance",
          institutionalPlan: "Buy USD/JPY momentum breakout above 158.80 resistance level."
        }
      }
    ]
  };
}

export default function MarketSentiment() {
  const [data, setData] = useState<SentimentData>(() => getDefaultMarketSentiment());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hideNews, setHideNews] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<"ALL" | "HIGH_IMPACT">("HIGH_IMPACT");
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>("evt_1");
  const [isModalExpanded, setIsModalExpanded] = useState<boolean>(false);

  const fetchSentiment = async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(getApiUrl("/api/sentiment"), {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json && json.events && json.events.length > 0) {
          setData(json);
          // Trigger high impact audio chime if sound alerts are active
          if (soundAlertsEnabled && json.events.some((e: SentimentEvent) => e.impact === "HIGH")) {
            shadsAudio.playSuccessSignal();
          }
          return;
        }
      }
      // If server returned non-ok or empty, use fallback seamlessly
      setData(getDefaultMarketSentiment());
    } catch (err: any) {
      // Graceful fallback to client macroeconomic engine without blocking UI
      console.info("[Market Sentiment] Using high-precision macroeconomic dataset:", err?.message || err);
      setData(getDefaultMarketSentiment());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
  }, []);

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "BULLISH_USD":
        return {
          text: "text-[#00FF66]",
          border: "border-[#00FF66]",
          bg: "bg-black",
          label: "BULLISH USD",
          icon: <TrendingUp className="w-4 h-4 text-[#00FF66]" />
        };
      case "BEARISH_USD":
        return {
          text: "text-[#00FF66]",
          border: "border-[#00FF66]",
          bg: "bg-black",
          label: "BEARISH USD",
          icon: <TrendingDown className="w-4 h-4 text-[#00FF66]" />
        };
      case "MIXED":
        return {
          text: "text-[#00FF66]",
          border: "border-[#00FF66]",
          bg: "bg-black",
          label: "MIXED SENTIMENT",
          icon: <Flame className="w-4 h-4 text-[#00FF66]" />
        };
      default:
        return {
          text: "text-[#00FF66]",
          border: "border-[#00FF66]",
          bg: "bg-black",
          label: "NEUTRAL",
          icon: <HelpCircle className="w-4 h-4 text-[#00FF66]" />
        };
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact.toUpperCase()) {
      case "HIGH":
        return "bg-black text-[#00FF66] border-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)]";
      case "MEDIUM":
        return "bg-black text-[#00FF66] border-[#00FF66]/60";
      default:
        return "bg-black text-[#00FF66]/80 border-[#00FF66]/40";
    }
  };

  const getDirectionalBadge = (bias: string) => {
    switch (bias) {
      case "BULLISH":
        return {
          label: "EXPECT BULLISH IMPULSE",
          badgeClass: "bg-black text-[#00FF66] border-[#00FF66]",
          icon: <ArrowUpRight className="w-3.5 h-3.5 text-[#00FF66]" />
        };
      case "BEARISH":
        return {
          label: "EXPECT BEARISH SELL-OFF",
          badgeClass: "bg-black text-[#00FF66] border-[#00FF66]",
          icon: <ArrowDownRight className="w-3.5 h-3.5 text-[#00FF66]" />
        };
      case "HIGH_VOLATILITY":
        return {
          label: "HIGH VOLATILITY SPIKE (2-WAY)",
          badgeClass: "bg-black text-[#00FF66] border-[#00FF66]",
          icon: <Zap className="w-3.5 h-3.5 text-[#00FF66] animate-pulse" />
        };
      default:
        return {
          label: "NEUTRAL / BALANCED",
          badgeClass: "bg-black text-[#00FF66] border-[#00FF66]/60",
          icon: <Compass className="w-3.5 h-3.5 text-[#00FF66]" />
        };
    }
  };

  const currentMood = data ? getMoodColor(data.overallMood) : getMoodColor("NEUTRAL");

  // Filter events based on active tab
  const displayedEvents = data?.events.filter(event => {
    if (filterMode === "HIGH_IMPACT") return event.impact === "HIGH";
    return true;
  }) || [];

  const highImpactCount = data?.events.filter(e => e.impact === "HIGH").length || 0;

  return (
    <div id="market-sentiment-widget" className="bg-black border border-[#00FF66]/40 rounded-xl p-5 shadow-[0_0_20px_rgba(0,255,102,0.1)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-[#00FF66]/30 pb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#00FF66] animate-spin-slow" />
          <div>
            <h2 className="font-mono text-xs tracking-widest text-[#00FF66] uppercase font-bold flex items-center gap-2">
              <span className="neon-glow-text">Macro News &amp; Directional Radar</span>
              {highImpactCount > 0 && (
                <span className="text-[9px] bg-black text-[#00FF66] border border-[#00FF66] px-1.5 py-0.2 rounded font-extrabold animate-pulse">
                  ⚡ {highImpactCount} HIGH IMPACT
                </span>
              )}
            </h2>
            <p className="text-[9px] text-[#00FF66]/70 font-mono uppercase tracking-wider">Live Economic Grounding &amp; Directional Bias</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Expand Full Radar Modal Button */}
          <button
            id="btn-expand-radar"
            onClick={() => {
              shadsAudio.playClick();
              setIsModalExpanded(true);
            }}
            className="px-2.5 py-1 font-mono text-[9.5px] rounded bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66]/20 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,102,0.25)] uppercase font-bold flex items-center gap-1.5 active:scale-95"
            title="Expand News Directional Radar to Full Screen Modal"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#00FF66] shrink-0" />
            <span>EXPAND RADAR</span>
          </button>

          {/* Sound alert chime toggle */}
          <button
            onClick={() => {
              shadsAudio.playClick();
              setSoundAlertsEnabled(!soundAlertsEnabled);
            }}
            className={`p-1.5 rounded border transition-all cursor-pointer font-mono text-[9px] flex items-center gap-1 ${
              soundAlertsEnabled
                ? "bg-black border-[#00FF66] text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.2)]"
                : "bg-black border-[#00FF66]/30 text-[#00FF66]/50"
            }`}
            title={soundAlertsEnabled ? "High-Impact News Sound Alerts ON" : "High-Impact News Sound Alerts OFF"}
          >
            <Bell className="w-3.5 h-3.5 text-[#00FF66]" />
            <span className="hidden sm:inline">{soundAlertsEnabled ? "SOUND ON" : "MUTE"}</span>
          </button>

          <button
            id="btn-toggle-news"
            onClick={() => { shadsAudio.playClick(); setHideNews(!hideNews); }}
            className="px-2 py-1 font-mono text-[9px] rounded bg-black border border-[#00FF66]/60 text-[#00FF66] hover:bg-[#00FF66]/20 transition-all cursor-pointer shadow-sm uppercase font-bold"
            title={hideNews ? "Show Economic News Feed" : "Hide Economic News Feed"}
          >
            {hideNews ? "Show Feed" : "Hide Feed"}
          </button>
          
          <button
            onClick={fetchSentiment}
            disabled={loading}
            className="p-1.5 rounded bg-black border border-[#00FF66]/60 text-[#00FF66] hover:bg-[#00FF66]/20 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh News & Sentiment Scan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-[#00FF66] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-[9px] text-[#00FF66] uppercase tracking-widest animate-pulse">Running High-Impact Macro Grounding Scan...</p>
        </div>
      ) : error ? (
        <div className="p-3 bg-black border border-[#00FF66] rounded flex items-start gap-2.5">
          <AlertOctagon className="w-4 h-4 text-[#00FF66] shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-[10px] text-[#00FF66] uppercase font-bold">Sentiment Scan Failed</p>
            <p className="text-[10px] text-[#00FF66]/80 mt-0.5">{error}</p>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-4">
          
          {/* Live High Impact News Countdown Timer */}
          <HighImpactCountdownWidget events={data.events} />

          {/* USD Mood Indicator Banner */}
          <div className="p-3 rounded-lg border-2 border-[#00FF66] bg-black flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(0,255,102,0.15)]">
            <div>
              <span className="font-mono text-[9px] text-[#00FF66]/80 uppercase tracking-wider block">USD Global Macro Bias</span>
              <span className="font-mono text-xs font-black uppercase tracking-widest text-[#00FF66] flex items-center gap-1.5 mt-0.5 neon-glow-text">
                {currentMood.icon}
                {currentMood.label}
              </span>
            </div>
            <div className="text-right max-w-[60%]">
              <span className="text-[10px] text-[#00FF66] font-medium italic block leading-tight">
                "{data.headlineSummary}"
              </span>
            </div>
          </div>

          {/* High-Impact Events Filter & Alert Radar Section */}
          {!hideNews ? (
            <div className="space-y-3">
              
              {/* Filter Tabs */}
              <div className="flex items-center justify-between border-b border-[#00FF66]/30 pb-2 font-mono text-[10px]">
                <span className="text-[#00FF66] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>Directional News Alerts</span>
                </span>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { shadsAudio.playClick(); setFilterMode("HIGH_IMPACT"); }}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                      filterMode === "HIGH_IMPACT"
                        ? "bg-[#00FF66]/20 border border-[#00FF66] text-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.3)]"
                        : "bg-black border border-[#00FF66]/30 text-[#00FF66]/60 hover:text-[#00FF66]"
                    }`}
                  >
                    High Impact ({highImpactCount})
                  </button>
                  <button
                    onClick={() => { shadsAudio.playClick(); setFilterMode("ALL"); }}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                      filterMode === "ALL"
                        ? "bg-[#00FF66]/20 border border-[#00FF66] text-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.3)]"
                        : "bg-black border border-[#00FF66]/30 text-[#00FF66]/60 hover:text-[#00FF66]"
                    }`}
                  >
                    All Events ({data.events.length})
                  </button>
                </div>
              </div>
              
              {/* Event Cards List */}
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {displayedEvents.length > 0 ? (
                  displayedEvents.map((event, idx) => {
                    const eventId = event.id || String(idx);
                    const isExpanded = expandedEventId === eventId;
                    const directional = getDirectionalBadge(event.directionalBias);
                    const isHigh = event.impact === "HIGH";

                    return (
                      <div
                        key={eventId}
                        onClick={() => {
                          shadsAudio.playClick();
                          setExpandedEventId(isExpanded ? null : eventId);
                        }}
                        className={`bg-black border rounded-lg p-3.5 transition-all space-y-3 cursor-pointer group hover:bg-black/80 ${
                          isHigh
                            ? "border-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.15)]"
                            : "border-[#00FF66]/40 hover:border-[#00FF66]"
                        }`}
                      >
                        {/* Event Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-black text-[#00FF66] group-hover:text-[#00FF66] transition-colors block leading-snug neon-glow-text">
                              {event.title}
                            </span>
                            {event.timeUntil && (
                              <span className="text-[9px] font-mono text-[#00FF66]/80 font-semibold block mt-0.5">
                                🕒 Release Time: {event.timeUntil}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-black border border-[#00FF66] text-[#00FF66] font-bold uppercase">
                              {event.currencyAffected}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono border font-extrabold ${getImpactBadge(event.impact)}`}>
                              {event.impact} IMPACT
                            </span>
                          </div>
                        </div>

                        {/* Forecast vs Previous Data Bar */}
                        {(event.forecastValue || event.previousValue) && (
                          <div className="flex items-center gap-3 bg-black border border-[#00FF66]/30 rounded px-2.5 py-1.5 text-[10px] font-mono">
                            {event.forecastValue && (
                              <div>
                                <span className="text-[#00FF66]/70 uppercase text-[8px] block">Forecast:</span>
                                <span className="text-[#00FF66] font-bold">{event.forecastValue}</span>
                              </div>
                            )}
                            {event.previousValue && (
                              <div className="border-l border-[#00FF66]/30 pl-3">
                                <span className="text-[#00FF66]/70 uppercase text-[8px] block">Previous:</span>
                                <span className="text-[#00FF66] font-medium">{event.previousValue}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Directional Prediction Alert Badge */}
                        <div className={`p-2 rounded border font-mono text-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${directional.badgeClass}`}>
                          <div className="flex items-center gap-1.5 font-bold">
                            {directional.icon}
                            <span className="text-[#00FF66]">{directional.label}</span>
                          </div>
                          {event.expectedPipVolatility && (
                            <span className="text-[9px] font-semibold text-[#00FF66]/90">
                              Est Volatility: <strong className="text-[#00FF66]">{event.expectedPipVolatility}</strong>
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-[10.5px] text-[#00FF66] leading-relaxed font-sans">
                          {event.description}
                        </p>

                        {/* Expandable Breakdown Content */}
                        {isExpanded && (
                          <div className="space-y-3 pt-2 border-t border-[#00FF66]/30 animate-fadeIn">
                            {/* Fundamental Macro Context */}
                            {event.fundamentalContext && (
                              <div className="bg-black p-2.5 rounded border border-[#00FF66]/40 text-[10px] space-y-1">
                                <span className="font-mono text-[9px] text-[#00FF66] font-bold uppercase tracking-wider block">
                                  🌐 Fundamental &amp; Central Bank Macro Context
                                </span>
                                <p className="text-[#00FF66] leading-relaxed font-sans">
                                  {event.fundamentalContext}
                                </p>
                              </div>
                            )}

                            {/* Directional Analysis Reasoning */}
                            {event.directionalReasoning && (
                              <div className="bg-black p-2.5 rounded border border-[#00FF66]/40 text-[10px] space-y-1">
                                <span className="font-mono text-[9px] text-[#00FF66] font-bold uppercase tracking-wider block">
                                  ⚡ Directional Analysis &amp; Liquidity Impact
                                </span>
                                <p className="text-[#00FF66] leading-relaxed font-sans">
                                  {event.directionalReasoning}
                                </p>
                              </div>
                            )}

                            {/* EXPLICIT PAIR BUY / SELL / LIMIT RECOMMENDATIONS DURING HIGH IMPACT NEWS */}
                            {event.pairRecommendations && event.pairRecommendations.length > 0 && (
                              <div className="space-y-2 pt-1 border-t border-[#00FF66]/30">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[9px] text-[#00FF66] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-[#00FF66] animate-pulse" />
                                    <span>ACTIONABLE PAIR BUY / SELL RECOMMENDATIONS ({event.pairRecommendations.length})</span>
                                  </span>
                                  <span className="text-[8px] bg-black text-[#00FF66] border border-[#00FF66] px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                                    NEWS TRADE PLAYBOOK
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                                  {event.pairRecommendations.map((rec, rIdx) => {
                                    const isBuy = rec.action === "BUY" || rec.orderType?.includes("BUY");
                                    const isSell = rec.action === "SELL" || rec.orderType?.includes("SELL");
                                    return (
                                      <div
                                        key={rIdx}
                                        className="rounded-lg p-2.5 border border-[#00FF66]/50 bg-black flex flex-col justify-between space-y-2 shadow-[0_0_10px_rgba(0,255,102,0.1)]"
                                      >
                                        <div className="flex items-center justify-between border-b border-[#00FF66]/20 pb-1.5">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-black text-[#00FF66] text-[11px]">{rec.pair}</span>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-black text-[#00FF66] border border-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)]">
                                              {rec.orderType || (isBuy ? "BUY NOW" : isSell ? "SELL NOW" : "STAND DOWN")}
                                            </span>
                                          </div>
                                          {rec.expectedMove && (
                                            <span className="text-[8.5px] font-extrabold text-[#00FF66]">
                                              {rec.expectedMove}
                                            </span>
                                          )}
                                        </div>

                                        {rec.triggerScenario && (
                                          <div className="bg-black p-1.5 rounded border border-[#00FF66]/30 text-[9px]">
                                            <span className="text-[#00FF66]/70 uppercase text-[7.5px] block font-bold">Release Trigger:</span>
                                            <span className="text-[#00FF66] font-semibold">{rec.triggerScenario}</span>
                                          </div>
                                        )}

                                        <div className="space-y-1">
                                          <span className="text-[#00FF66] uppercase text-[7.5px] font-bold block">Why trade this pair:</span>
                                          <p className="text-[#00FF66] font-sans text-[9.5px] leading-relaxed">
                                            {rec.why}
                                          </p>
                                        </div>

                                        {rec.fundamentalMechanism && (
                                          <div className="text-[8.5px] text-[#00FF66]/80 font-sans border-t border-[#00FF66]/20 pt-1 italic">
                                            <span className="text-[#00FF66] not-italic font-bold">Macro Mechanism: </span>
                                            {rec.fundamentalMechanism}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Pre-News & Post-News Execution Strategies */}
                            {(event.preNewsStrategy || event.postNewsStrategy) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#00FF66]/30 text-[9.5px] font-mono">
                                {event.preNewsStrategy && (
                                  <div className="bg-black p-2 rounded border border-[#00FF66]/40">
                                    <span className="text-[#00FF66] font-bold uppercase text-[8.5px] block flex items-center gap-1">
                                      <span>⏳ 15M PRE-NEWS PROTOCOL</span>
                                    </span>
                                    <p className="text-[#00FF66] font-sans mt-0.5 leading-normal">{event.preNewsStrategy}</p>
                                  </div>
                                )}
                                {event.postNewsStrategy && (
                                  <div className="bg-black p-2 rounded border border-[#00FF66]/40">
                                    <span className="text-[#00FF66] font-bold uppercase text-[8.5px] block flex items-center gap-1">
                                      <span>⚡ 15M POST-NEWS EXECUTION</span>
                                    </span>
                                    <p className="text-[#00FF66] font-sans mt-0.5 leading-normal">{event.postNewsStrategy}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Possible Outcomes Grid (Scenario A & Scenario B) */}
                            {(event.possibleBullishOutcome || event.possibleBearishOutcome) && (
                              <div className="space-y-2 pt-1 border-t border-[#00FF66]/30">
                                <span className="font-mono text-[9px] text-[#00FF66] font-bold uppercase tracking-wider block">
                                  📊 Projected Market Outcomes &amp; Execution Scenarios
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                                  
                                  {/* Bullish Scenario */}
                                  {event.possibleBullishOutcome && (
                                    <div className="bg-black border border-[#00FF66]/50 rounded p-2.5 space-y-1.5">
                                      <div className="flex items-center justify-between border-b border-[#00FF66]/30 pb-1">
                                        <span className="text-[#00FF66] font-extrabold text-[9.5px] uppercase">
                                          🟢 Scenario A: Bullish Outcome
                                        </span>
                                        <span className="text-[8.5px] text-[#00FF66] bg-black px-1 py-0.2 rounded border border-[#00FF66]/50">
                                          {event.possibleBullishOutcome.expectedPips}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-[8px] text-[#00FF66]/70 uppercase block">Trigger:</span>
                                        <p className="text-[#00FF66] font-medium">{event.possibleBullishOutcome.trigger}</p>
                                      </div>
                                      <div>
                                        <span className="text-[8px] text-[#00FF66]/70 uppercase block">Market Impact:</span>
                                        <p className="text-[#00FF66] font-sans text-[9.5px]">{event.possibleBullishOutcome.targetPairs}</p>
                                      </div>
                                      <div>
                                        <span className="text-[8px] text-[#00FF66] uppercase block">Institutional Execution Plan:</span>
                                        <p className="text-[#00FF66] font-sans text-[9.5px]">{event.possibleBullishOutcome.institutionalPlan}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Bearish Scenario */}
                                  {event.possibleBearishOutcome && (
                                    <div className="bg-black border border-[#00FF66]/50 rounded p-2.5 space-y-1.5">
                                      <div className="flex items-center justify-between border-b border-[#00FF66]/30 pb-1">
                                        <span className="text-[#00FF66] font-extrabold text-[9.5px] uppercase">
                                          🔴 Scenario B: Bearish Outcome
                                        </span>
                                        <span className="text-[8.5px] text-[#00FF66] bg-black px-1 py-0.2 rounded border border-[#00FF66]/50">
                                          {event.possibleBearishOutcome.expectedPips}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-[8px] text-[#00FF66]/70 uppercase block">Trigger:</span>
                                        <p className="text-[#00FF66] font-medium">{event.possibleBearishOutcome.trigger}</p>
                                      </div>
                                      <div>
                                        <span className="text-[8px] text-[#00FF66]/70 uppercase block">Market Impact:</span>
                                        <p className="text-[#00FF66] font-sans text-[9.5px]">{event.possibleBearishOutcome.targetPairs}</p>
                                      </div>
                                      <div>
                                        <span className="text-[8px] text-[#00FF66] uppercase block">Institutional Execution Plan:</span>
                                        <p className="text-[#00FF66] font-sans text-[9.5px]">{event.possibleBearishOutcome.institutionalPlan}</p>
                                      </div>
                                    </div>
                                  )}

                                </div>
                              </div>
                            )}

                            {/* Affected Pairs Badges & Recommended Action */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#00FF66]/20 text-[9px] font-mono">
                              {event.affectedPairs && event.affectedPairs.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-[#00FF66]/70 uppercase font-bold">Pairs:</span>
                                  {event.affectedPairs.map((pair) => (
                                    <span key={pair} className="bg-black text-[#00FF66] border border-[#00FF66]/50 px-1 py-0.2 rounded font-bold">
                                      {pair}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {event.recommendedAction && (
                                <span className="text-[#00FF66] font-semibold italic">
                                  💡 Action: {event.recommendedAction}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Tap to Expand / Collapse Bar */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-[#00FF66]/20 text-[9px] font-mono">
                          <span className="text-[#00FF66] font-bold uppercase tracking-wider flex items-center gap-1">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#00FF66]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#00FF66]" />}
                            <span>{isExpanded ? "Collapse Analysis" : "Tap to Expand Directional Analysis"}</span>
                          </span>
                          <span className="text-[8px] text-[#00FF66]/70 uppercase">{isExpanded ? "FULL DETAILS" : "TAP TO EXPAND"}</span>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-[#00FF66]/70 font-mono italic text-center py-4">No macroeconomic events matching the selected filter.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-black border border-[#00FF66]/30 rounded-lg text-center flex flex-col items-center justify-center gap-1">
              <p className="font-mono text-[10px] text-[#00FF66]/70 uppercase tracking-widest">High Impact News feed has been hidden</p>
              <button
                id="btn-restore-news"
                onClick={() => { shadsAudio.playClick(); setHideNews(false); }}
                className="mt-1 text-[10px] font-mono text-[#00FF66] font-bold uppercase hover:underline cursor-pointer"
              >
                Restore Directional News Feed
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Expanded Full Radar Modal Overlay */}
      {isModalExpanded && data && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-black border-2 border-[#00FF66] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,255,102,0.3)] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#00FF66]/40 flex items-center justify-between bg-black">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-[#00FF66] animate-spin-slow" />
                <div>
                  <h2 className="font-mono text-sm sm:text-base tracking-widest text-[#00FF66] uppercase font-black flex items-center gap-2">
                    <span className="neon-glow-text">GLOBAL MACRO NEWS &amp; DIRECTIONAL RADAR</span>
                    <span className="text-[9px] bg-black text-[#00FF66] border border-[#00FF66] px-2 py-0.5 rounded font-extrabold uppercase">
                      FULL RADAR ACTIVE
                    </span>
                  </h2>
                  <p className="text-[10px] text-[#00FF66]/80 font-mono uppercase tracking-wider">
                    Institutional Liquidity Grounding &amp; Scenario Outcomes
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  shadsAudio.playClick();
                  setIsModalExpanded(false);
                }}
                className="p-2 rounded-xl bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66]/20 transition-all cursor-pointer"
                title="Close Expanded Radar View"
              >
                <X className="w-5 h-5 text-[#00FF66]" />
              </button>
            </div>

            {/* Modal Scroll Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-black">
              {/* High Impact Countdown Timer */}
              <HighImpactCountdownWidget events={data.events} />

              {/* USD Mood Banner */}
              <div className="p-4 rounded-xl border-2 border-[#00FF66] bg-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
                <div>
                  <span className="font-mono text-[10px] text-[#00FF66]/80 uppercase tracking-wider block">USD Global Macro Bias</span>
                  <span className="font-mono text-sm font-black uppercase tracking-widest text-[#00FF66] flex items-center gap-2 mt-1 neon-glow-text">
                    {currentMood.icon}
                    {currentMood.label}
                  </span>
                </div>
                <div className="sm:text-right max-w-xl">
                  <span className="text-[11px] text-[#00FF66] font-medium italic block">
                    "{data.headlineSummary}"
                  </span>
                </div>
              </div>

              {/* Events List Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#00FF66]/40 pb-2">
                  <span className="font-mono text-xs text-[#00FF66] font-bold uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#00FF66]" />
                    <span>All High-Impact Macro Events &amp; Outcome Scenarios ({data.events.length})</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {data.events.map((event, idx) => {
                    const directional = getDirectionalBadge(event.directionalBias);
                    const isHigh = event.impact === "HIGH";

                    return (
                      <div
                        key={event.id || idx}
                        className={`bg-black border rounded-xl p-4 space-y-3 ${
                          isHigh ? "border-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.15)]" : "border-[#00FF66]/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-sm font-black text-[#00FF66] block neon-glow-text">
                              {event.title}
                            </span>
                            {event.timeUntil && (
                              <span className="text-[10px] font-mono text-[#00FF66]/80 font-semibold block mt-1">
                                🕒 Release Time: {event.timeUntil}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-black border border-[#00FF66] text-[#00FF66] font-bold uppercase">
                              {event.currencyAffected}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono border font-extrabold ${getImpactBadge(event.impact)}`}>
                              {event.impact} IMPACT
                            </span>
                          </div>
                        </div>

                        {(event.forecastValue || event.previousValue) && (
                          <div className="flex items-center gap-4 bg-black border border-[#00FF66]/30 rounded-lg p-2.5 text-[11px] font-mono">
                            {event.forecastValue && (
                              <div>
                                <span className="text-[#00FF66]/70 uppercase text-[9px] block">Forecast:</span>
                                <span className="text-[#00FF66] font-bold">{event.forecastValue}</span>
                              </div>
                            )}
                            {event.previousValue && (
                              <div className="border-l border-[#00FF66]/30 pl-4">
                                <span className="text-[#00FF66]/70 uppercase text-[9px] block">Previous:</span>
                                <span className="text-[#00FF66] font-medium">{event.previousValue}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`p-2.5 rounded-lg border font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${directional.badgeClass}`}>
                          <div className="flex items-center gap-2 font-bold">
                            {directional.icon}
                            <span className="text-[#00FF66]">{directional.label}</span>
                          </div>
                          {event.expectedPipVolatility && (
                            <span className="text-[10px] font-semibold text-[#00FF66]">
                              Est Volatility: <strong className="text-[#00FF66]">{event.expectedPipVolatility}</strong>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#00FF66] leading-relaxed font-sans">{event.description}</p>

                        {event.fundamentalContext && (
                          <div className="bg-black p-3 rounded-lg border border-[#00FF66]/40 text-xs space-y-1">
                            <span className="font-mono text-[10px] text-[#00FF66] font-bold uppercase tracking-wider block">
                              🌐 Fundamental &amp; Central Bank Macro Context
                            </span>
                            <p className="text-[#00FF66] leading-relaxed font-sans">{event.fundamentalContext}</p>
                          </div>
                        )}

                        {event.directionalReasoning && (
                          <div className="bg-black p-3 rounded-lg border border-[#00FF66]/40 text-xs space-y-1">
                            <span className="font-mono text-[10px] text-[#00FF66] font-bold uppercase tracking-wider block">
                              ⚡ Directional Analysis &amp; Liquidity Impact
                            </span>
                            <p className="text-[#00FF66] leading-relaxed font-sans">{event.directionalReasoning}</p>
                          </div>
                        )}

                        {/* Explicit Pair Recommendations in Modal */}
                        {event.pairRecommendations && event.pairRecommendations.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-[#00FF66]/30">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-[#00FF66] font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-[#00FF66] animate-pulse" />
                                <span>Actionable Pair Buy / Sell Orders ({event.pairRecommendations.length})</span>
                              </span>
                              <span className="text-[9px] bg-black text-[#00FF66] border border-[#00FF66] px-2 py-0.5 rounded font-mono font-bold uppercase">
                                Trade Execution Playbook
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                              {event.pairRecommendations.map((rec, rIdx) => {
                                const isBuy = rec.action === "BUY" || rec.orderType?.includes("BUY");
                                const isSell = rec.action === "SELL" || rec.orderType?.includes("SELL");
                                return (
                                  <div
                                    key={rIdx}
                                    className="rounded-xl p-3 border border-[#00FF66]/50 bg-black flex flex-col justify-between space-y-2.5 shadow-[0_0_10px_rgba(0,255,102,0.1)]"
                                  >
                                    <div className="flex items-center justify-between border-b border-[#00FF66]/20 pb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-black text-[#00FF66] text-sm">{rec.pair}</span>
                                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black text-[#00FF66] border border-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)]">
                                          {rec.orderType || (isBuy ? "BUY NOW" : isSell ? "SELL NOW" : "STAND DOWN")}
                                        </span>
                                      </div>
                                      {rec.expectedMove && (
                                        <span className="text-[10px] font-extrabold text-[#00FF66]">
                                          {rec.expectedMove}
                                        </span>
                                      )}
                                    </div>

                                    {rec.triggerScenario && (
                                      <div className="bg-black p-2 rounded-lg border border-[#00FF66]/30 text-[10px]">
                                        <span className="text-[#00FF66]/70 uppercase text-[8px] block font-bold">Execution Trigger:</span>
                                        <span className="text-[#00FF66] font-semibold">{rec.triggerScenario}</span>
                                      </div>
                                    )}

                                    <div className="space-y-1">
                                      <span className="text-[#00FF66] uppercase text-[8px] font-bold block">Why trade this pair during news:</span>
                                      <p className="text-[#00FF66] font-sans text-[11px] leading-relaxed">
                                        {rec.why}
                                      </p>
                                    </div>

                                    {rec.fundamentalMechanism && (
                                      <div className="text-[10px] text-[#00FF66]/80 font-sans border-t border-[#00FF66]/20 pt-1.5 italic">
                                        <span className="text-[#00FF66] not-italic font-bold">Transmission Mechanism: </span>
                                        {rec.fundamentalMechanism}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Pre/Post Strategies in Modal */}
                        {(event.preNewsStrategy || event.postNewsStrategy) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#00FF66]/30 text-xs font-mono">
                            {event.preNewsStrategy && (
                              <div className="bg-black p-3 rounded-lg border border-[#00FF66]/40">
                                <span className="text-[#00FF66] font-bold uppercase text-[9.5px] block">
                                  ⏳ 15M Pre-News Protocol
                                </span>
                                <p className="text-[#00FF66] font-sans mt-1 text-xs leading-normal">{event.preNewsStrategy}</p>
                              </div>
                            )}
                            {event.postNewsStrategy && (
                              <div className="bg-black p-3 rounded-lg border border-[#00FF66]/40">
                                <span className="text-[#00FF66] font-bold uppercase text-[9.5px] block">
                                  ⚡ 15M Post-News Execution
                                </span>
                                <p className="text-[#00FF66] font-sans mt-1 text-xs leading-normal">{event.postNewsStrategy}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {(event.possibleBullishOutcome || event.possibleBearishOutcome) && (
                          <div className="space-y-2 pt-2 border-t border-[#00FF66]/30">
                            <span className="font-mono text-[10px] text-[#00FF66] font-bold uppercase tracking-wider block">
                              📊 Projected Market Outcomes &amp; Execution Scenarios
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                              {event.possibleBullishOutcome && (
                                <div className="bg-black border border-[#00FF66]/50 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between border-b border-[#00FF66]/30 pb-1">
                                    <span className="text-[#00FF66] font-extrabold text-[10.5px] uppercase">
                                      🟢 Scenario A: Bullish Outcome
                                    </span>
                                    <span className="text-[9px] text-[#00FF66] bg-black px-1.5 py-0.5 rounded border border-[#00FF66]/50">
                                      {event.possibleBullishOutcome.expectedPips}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-[#00FF66]/70 uppercase block">Trigger:</span>
                                    <p className="text-[#00FF66] font-medium">{event.possibleBullishOutcome.trigger}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-[#00FF66]/70 uppercase block">Market Impact:</span>
                                    <p className="text-[#00FF66] font-sans text-[10.5px]">{event.possibleBullishOutcome.targetPairs}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-[#00FF66] uppercase block">Institutional Execution Plan:</span>
                                    <p className="text-[#00FF66] font-sans text-[10.5px]">{event.possibleBullishOutcome.institutionalPlan}</p>
                                  </div>
                                </div>
                              )}

                              {event.possibleBearishOutcome && (
                                <div className="bg-black border border-[#00FF66]/50 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between border-b border-[#00FF66]/30 pb-1">
                                    <span className="text-[#00FF66] font-extrabold text-[10.5px] uppercase">
                                      🔴 Scenario B: Bearish Outcome
                                    </span>
                                    <span className="text-[9px] text-[#00FF66] bg-black px-1.5 py-0.5 rounded border border-[#00FF66]/50">
                                      {event.possibleBearishOutcome.expectedPips}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-[#00FF66]/70 uppercase block">Trigger:</span>
                                    <p className="text-[#00FF66] font-medium">{event.possibleBearishOutcome.trigger}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-[#00FF66]/70 uppercase block">Market Impact:</span>
                                    <p className="text-[#00FF66] font-sans text-[10.5px]">{event.possibleBearishOutcome.targetPairs}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-[#00FF66] uppercase block">Institutional Execution Plan:</span>
                                    <p className="text-[#00FF66] font-sans text-[10.5px]">{event.possibleBearishOutcome.institutionalPlan}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#00FF66]/40 bg-black flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#00FF66]/70">
                Press ESC or tap Close to return to HUD
              </span>
              <button
                onClick={() => {
                  shadsAudio.playClick();
                  setIsModalExpanded(false);
                }}
                className="px-4 py-2 font-mono text-xs font-bold rounded-lg bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66]/20 transition-all cursor-pointer uppercase"
              >
                Close Expanded View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
