export interface SmcAnalysis {
  orderBlocks: string;        // 1. Order Block
  liquiditySweeps: string;    // 2. Liquidity Sweeps
  marketImbalance: string;    // 3. Fair Value Gaps (FVG)
  rejectionBlocks: string;    // 4. Rejection Blocks
  mitigationBlocks: string;   // 5. Mitigation Blocks
  displacement: string;       // 6. Displacement
}

export interface MarketStructureAnalysis {
  marketStructureShift: string; // 7. Market Structure Shift (MSS)
  breakOfStructure: string;     // 8. Break of Structure (BOS)
  changeOfCharacter: string;    // 9. Change of Character (CHoCH)
  breakoutStrategy: string;     // 10. Breakout Strategies
  pullbackStrategy: string;     // 11. Pullback Strategies
  sessionKillZones: string;     // 12. Range + Kill Zones
  momentumStrategy?: string;    // Momentum Trading Strategy
  reversalStrategy?: string;    // Reversal Strategy
  breakAndRetestStrategy?: string; // Break & Retest Strategy
}

export interface TechnicalAnalysis {
  supportResistance: string;   // 13. Support and Resistance
  supplyDemand: string;        // 14. Supply and Demand
  trendlines: string;          // 15. Trend Lines
  chartPatterns: string;       // 16. Chart Patterns
  candlestickPattern: string;  // 17. Candlestick Patterns
}

export interface HarmonicWaveAnalysis {
  fibonacciRetracement: string;// 18. Fibonacci Retracement
  elliottWaves: string;         // 19. Elliott Waves
  harmonicPatterns: string;     // 20. Harmonic Patterns
  wyckoffMethod: string;        // 21. Wyckoff Method
}

export interface VolumeSessionAnalysis {
  volumeProfile: string;       // 22. Volume Profile
  vwapAnalysis: string;        // 23. VWAP
  sessionBreakouts: string;    // 24. Session Breakout Strategies
}

export interface StrategyStatus {
  id: string;
  name: string;
  category: 'smc' | 'structure' | 'technicals' | 'harmonic' | 'volume';
  status: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  details: string;
}

export interface ScanResult {
  id: string;
  pair: string;
  timeframe: string;
  detectedPair?: string;
  detectedTimeframe?: string;
  signal: 'BUY' | 'SELL' | 'NO_TRADE';
  orderType?: 'BUY NOW' | 'SELL NOW' | 'BUY LIMIT' | 'SELL LIMIT' | 'BUY STOP' | 'SELL STOP' | 'WAIT';
  orderTypeCategory?: 'MARKET' | 'LIMIT' | 'STOP' | 'WAIT';
  orderExecutionReason?: string;
  orderTriggerZone?: string;
  confidence: number;
  entryPrice: string;
  stopLoss: string;
  structureSLNote?: string;
  takeProfit1: string;
  structureTP1Note?: string;
  takeProfit2: string;
  structureTP2Note?: string;
  takeProfit3?: string;
  structureTP3Note?: string;
  takeProfit4?: string;
  structureTP4Note?: string;
  takeProfit5?: string;
  takeProfit6?: string;
  riskRewardRatio: string;
  marketStructure: string;
  smcAnalysis: SmcAnalysis;
  marketStructureAnalysis?: MarketStructureAnalysis;
  technicalAnalysis: TechnicalAnalysis;
  harmonicWaveAnalysis?: HarmonicWaveAnalysis;
  volumeSessionAnalysis?: VolumeSessionAnalysis;
  strategiesMatrix?: StrategyStatus[];
  reasoning: string[];
  voiceSummary: string;
  image?: string; // base64 representation of the screenshot
  timestamp: number;
  isSimulation?: boolean;
}

export interface SentimentPairRecommendation {
  pair: string;
  action: 'BUY' | 'SELL' | 'NO_TRADE';
  orderType: 'BUY NOW' | 'SELL NOW' | 'BUY LIMIT' | 'SELL LIMIT' | 'BUY STOP' | 'SELL STOP';
  triggerScenario: string;
  expectedMove: string;
  why: string;
  fundamentalMechanism: string;
  riskLevel: 'HIGH' | 'EXTREME' | 'CONTROLLED';
}

export interface SentimentOutcomeDetail {
  trigger: string;
  expectedPips: string;
  targetPairs: string;
  institutionalPlan: string;
}

export interface SentimentEvent {
  id?: string;
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  currencyAffected: string;
  directionalBias: 'BULLISH' | 'BEARISH' | 'HIGH_VOLATILITY' | 'NEUTRAL';
  directionalReasoning: string;
  timeUntil?: string;
  scheduledTimestamp?: number;
  expectedPipVolatility?: string;
  affectedPairs?: string[];
  recommendedAction?: string;
  forecastValue?: string;
  previousValue?: string;
  fundamentalContext?: string;
  preNewsStrategy?: string;
  postNewsStrategy?: string;
  pairRecommendations?: SentimentPairRecommendation[];
  possibleBullishOutcome?: SentimentOutcomeDetail;
  possibleBearishOutcome?: SentimentOutcomeDetail;
}

export interface SentimentData {
  overallMood: 'BULLISH_USD' | 'BEARISH_USD' | 'MIXED' | 'NEUTRAL';
  headlineSummary: string;
  events: SentimentEvent[];
  lastUpdated?: number;
}
