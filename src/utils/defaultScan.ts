import { ScanResult } from "../types";

export const defaultInitialScan: ScanResult = {
  id: "default_eurusd_init",
  pair: "EUR/USD",
  timeframe: "H1",
  detectedPair: "EUR/USD",
  detectedTimeframe: "H1",
  signal: "BUY",
  confidence: 88,
  entryPrice: "1.08450 - 1.08480",
  stopLoss: "1.08220",
  takeProfit1: "1.08850",
  takeProfit2: "1.09250",
  takeProfit3: "1.09680",
  takeProfit4: "1.10100",
  takeProfit5: "1.10550",
  takeProfit6: "1.11000",
  riskRewardRatio: "1:3.4",
  marketStructure: "Bullish Market Structure Shift (London Liquidity Sweep)",
  smcAnalysis: {
    orderBlocks: "Bullish H1 Order Block identified at 1.08420 - 1.08450 following Asian session low sweep.",
    liquiditySweeps: "Asian Session Low (1.08380) swept during London open with sharp institutional rejection.",
    marketImbalance: "H1 Fair Value Gap (FVG) at 1.08500 - 1.08580 acting as magnetic expansion zone.",
    rejectionBlocks: "Institutional rejection tail confirmed on 15m timeframe with heavy buy delta.",
    mitigationBlocks: "15m Mitigation Block tested and held as support at 1.08440.",
    displacement: "Strong displacement candle (+28 pips in 15m) confirming Smart Money presence."
  },
  technicalAnalysis: {
    supportResistance: "Key horizontal institutional support zone at 1.08400 holding firm.",
    supplyDemand: "High-probability Demand Zone at 1.08420 - 1.08460.",
    trendlines: "Ascending trendline liquidity built above 1.08800 targeting equal highs.",
    chartPatterns: "Inverse Head & Shoulders pattern completed on 15m timeframe.",
    candlestickPattern: "Bullish Engulfing candle on H1 with long lower wick."
  },
  harmonicWaveAnalysis: {
    fibonacciRetracement: "0.62 OTE (Optimal Trade Entry) level aligned perfectly with 1.08450.",
    elliottWaves: "Wave 3 impulse expansion starting from 1.08420 low.",
    harmonicPatterns: "Bullish Gartley pattern completion in potential reversal zone (PRZ).",
    wyckoffMethod: "Wyckoff Spring phase complete; currently in Mark-Up Phase B."
  },
  volumeSessionAnalysis: {
    volumeProfile: "Point of Control (POC) established at 1.08450 with heavy institutional volume.",
    vwapAnalysis: "Price trading above Session VWAP (+1 Std Dev band extension).",
    sessionBreakouts: "London Kill Zone expansion target at 1.09250."
  },
  reasoning: [
    "London Session opened with a clear sweep of Asian Session Lows (1.08380).",
    "Smart Money displacement created a fresh H1 Fair Value Gap and Bullish Order Block.",
    "24-Strategy Confluence confirms 88% win probability with 1:3.4 Risk-to-Reward ratio.",
    "Equal Highs at 1.09250 remain unmitigated sell-side liquidity targets."
  ],
  voiceSummary: "Shads AI confirms a high-probability BUY trade setup on EUR/USD H1 at 1.08450 with 88% confidence and 1:3.4 Risk-to-Reward ratio.",
  timestamp: Date.now(),
  image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDQwODEyIi8+PHBhdGggZD0iTSAwIDIwMCBMIDEwMCAyMjAgTCAyMDAgMTgwIEwgMzAwIDI0MCBMIDQwMCAxNjAgTCA1MDAgMTQwIEwgNjAwIDEwMCIgc3Ryb2tlPSIjMDZiNmQ0IiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48dGV4dCB4PSIzMDAiIHk9IjIwMCIgZmlsbD0iI2ZmZmZmZiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmljaG9yPSJtaWRkbGUiPkVVUi9VU0QgSDEgSU5TVElUVVRJT05BTCBDSEFSVDwvdGV4dD48L3N2Zz4="
};
