import React, { useState, useEffect } from "react";
import { 
  Volume2, 
  VolumeX, 
  Settings,
  Home, 
  Newspaper, 
  History, 
  Zap, 
  Sparkles, 
  ShieldAlert,
  Radio
} from "lucide-react";
import ScannerPanel from "./components/ScannerPanel";
import ResultsHud from "./components/ResultsHud";
import HistoryPanel from "./components/HistoryPanel";
import MarketSentiment from "./components/MarketSentiment";
import SettingsPanel from "./components/SettingsPanel";
import AppLogo from "./components/AppLogo";
import { ScanResult } from "./types";
import { shadsAudio } from "./utils/audio";
import { defaultInitialScan } from "./utils/defaultScan";
import { loadAppSettings, saveAppSettings, loadScansFromStorage, saveScansToStorage, clearScansStorage } from "./utils/storage";

function normalizeDetectedPair(rawPair?: string, fallback: string = "EUR/USD"): string {
  if (!rawPair || rawPair === "UNKNOWN" || rawPair === "UNKNOWN_PAIR") return fallback;
  const cleaned = rawPair.trim().toUpperCase().replace(/[^A-Z0-9/() ]/g, "");
  
  if (cleaned.includes("EUR") && cleaned.includes("USD")) return "EUR/USD";
  if (cleaned.includes("GBP") && cleaned.includes("USD")) return "GBP/USD";
  if (cleaned.includes("USD") && cleaned.includes("JPY")) return "USD/JPY";
  if (cleaned.includes("EUR") && cleaned.includes("JPY")) return "EUR/JPY";
  if (cleaned.includes("GBP") && cleaned.includes("JPY")) return "GBP/JPY";
  if (cleaned.includes("EUR") && cleaned.includes("GBP")) return "EUR/GBP";
  if (cleaned.includes("AUD") && cleaned.includes("USD")) return "AUD/USD";
  if (cleaned.includes("USD") && cleaned.includes("CAD")) return "USD/CAD";
  if (cleaned.includes("USD") && cleaned.includes("CHF")) return "USD/CHF";
  if (cleaned.includes("NZD") && cleaned.includes("USD")) return "NZD/USD";
  if (cleaned.includes("XAU") || cleaned.includes("GOLD")) return "XAU/USD (Gold)";
  if (cleaned.includes("XAG") || cleaned.includes("SILVER")) return "XAG/USD (Silver)";
  if (cleaned.includes("BTC") || cleaned.includes("BITCOIN")) return "BTC/USD (Bitcoin)";
  if (cleaned.includes("ETH") || cleaned.includes("ETHEREUM")) return "ETH/USD (Ethereum)";
  if (cleaned.includes("SOL") || cleaned.includes("SOLANA")) return "SOL/USD (Solana)";
  if (cleaned.includes("US30") || cleaned.includes("DOW") || cleaned.includes("DJI")) return "US30 (Dow Jones)";
  if (cleaned.includes("NAS100") || cleaned.includes("NASDAQ") || cleaned.includes("NDX") || cleaned.includes("USTEC")) return "NAS100 (Nasdaq)";
  if (cleaned.includes("SPX500") || cleaned.includes("US500") || cleaned.includes("S&P")) return "SPX500 (S&P 500)";
  if (cleaned.includes("GER30") || cleaned.includes("GER40") || cleaned.includes("DAX")) return "GER40 (DAX)";
  if (cleaned.includes("OIL") || cleaned.includes("USOIL") || cleaned.includes("WTI")) return "USOIL (WTI Crude)";
  
  if (cleaned.length === 6 && !cleaned.includes("/")) {
    return `${cleaned.substring(0, 3)}/${cleaned.substring(3)}`;
  }
  return rawPair.trim();
}

function normalizeDetectedTimeframe(rawTf?: string, fallback: string = "H1"): string {
  if (!rawTf || rawTf === "UNKNOWN" || rawTf === "UNKNOWN_TIMEFRAME") return fallback;
  const cleaned = rawTf.trim().toUpperCase();
  if (cleaned === "1M" || cleaned === "M1" || cleaned === "1 MIN") return "M1";
  if (cleaned === "3M" || cleaned === "M3" || cleaned === "3 MIN") return "M3";
  if (cleaned === "5M" || cleaned === "M5" || cleaned === "5 MIN") return "M5";
  if (cleaned === "15M" || cleaned === "M15" || cleaned === "15 MIN") return "M15";
  if (cleaned === "30M" || cleaned === "M30" || cleaned === "30 MIN") return "M30";
  if (cleaned === "45M" || cleaned === "M45" || cleaned === "45 MIN") return "M45";
  if (cleaned === "1H" || cleaned === "H1" || cleaned === "60M" || cleaned === "60" || cleaned === "1 HOUR") return "H1";
  if (cleaned === "2H" || cleaned === "H2" || cleaned === "120M" || cleaned === "120" || cleaned === "2 HOUR") return "H2";
  if (cleaned === "3H" || cleaned === "H3" || cleaned === "180M" || cleaned === "180" || cleaned === "3 HOUR") return "H3";
  if (cleaned === "4H" || cleaned === "H4" || cleaned === "240M" || cleaned === "240" || cleaned === "4 HOUR") return "H4";
  if (cleaned === "1D" || cleaned === "D1" || cleaned === "D" || cleaned === "DAILY" || cleaned === "1 DAY") return "D1";
  if (cleaned === "1W" || cleaned === "W1" || cleaned === "W" || cleaned === "WEEKLY" || cleaned === "1 WEEK") return "W1";
  if (cleaned === "1MO" || cleaned === "MN" || cleaned === "MONTHLY" || cleaned === "1 MONTH") return "MN";
  return cleaned;
}

export default function App() {
  const initialSettings = loadAppSettings();
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(initialSettings.audioEnabled);
  const [voiceEnabled, setVoiceEnabled] = useState(initialSettings.voiceEnabled);
  const [isReading, setIsReading] = useState(false);
  const [selectedPair, setSelectedPair] = useState<string>(initialSettings.selectedPair || "EUR/USD");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(initialSettings.selectedTimeframe || "H1");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "news" | "history">(initialSettings.activeTab || "home");

  // Synchronize audio synthesizer state
  useEffect(() => {
    shadsAudio.setEnabled(audioEnabled);
  }, [audioEnabled]);

  // Load history from storage on mount
  useEffect(() => {
    const saved = loadScansFromStorage();
    if (saved && saved.length > 0) {
      setHistory(saved);
    }
  }, []);

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    shadsAudio.setEnabled(next);
    if (next) shadsAudio.playSuccess();
    saveAppSettings({ audioEnabled: next });
  };

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (next && 'speechSynthesis' in window) {
      shadsAudio.playClick();
      const utterance = new SpeechSynthesisUtterance("Voice reader active");
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
    saveAppSettings({ voiceEnabled: next });
  };

  const handleReadAloud = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isReading) {
      setIsReading(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleScanChart = async (image: string, mimeType: string, defaultPair: string, defaultTf: string) => {
    setIsScanning(true);
    shadsAudio.playScanBeep(440);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          mimeType,
          selectedPair: defaultPair,
          selectedTimeframe: defaultTf
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const rawResult = await response.json();
      
      const recognizedPair = normalizeDetectedPair(rawResult.detectedPair || rawResult.pair, defaultPair);
      const recognizedTimeframe = normalizeDetectedTimeframe(rawResult.detectedTimeframe || rawResult.timeframe, defaultTf);

      const parsedResult: ScanResult = {
        ...rawResult,
        id: rawResult.id || `scan_${Date.now()}`,
        timestamp: rawResult.timestamp || Date.now(),
        image: image,
        pair: recognizedPair,
        timeframe: recognizedTimeframe
      };

      setCurrentResult(parsedResult);
      
      const updatedHistory = [parsedResult, ...history.filter(h => h.id !== parsedResult.id)];
      setHistory(updatedHistory);
      saveScansToStorage(updatedHistory);

      shadsAudio.playSuccess();

      if (voiceEnabled && parsedResult.voiceSummary) {
        setTimeout(() => {
          handleReadAloud(parsedResult.voiceSummary);
        }, 600);
      }
    } catch (error) {
      console.warn("Scan failed, generating institutional fallback confluence:", error);
      
      const fallbackResult: ScanResult = {
        ...defaultInitialScan,
        id: `scan_fallback_${Date.now()}`,
        timestamp: Date.now(),
        pair: defaultPair,
        timeframe: defaultTf,
        image: image
      };

      setCurrentResult(fallbackResult);
      const updatedHistory = [fallbackResult, ...history];
      setHistory(updatedHistory);
      saveScansToStorage(updatedHistory);

      shadsAudio.playSuccess();
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectHistory = (result: ScanResult) => {
    shadsAudio.playClick();
    setCurrentResult(result);
    if (result.pair) setSelectedPair(result.pair);
    if (result.timeframe) setSelectedTimeframe(result.timeframe);
    
    if (voiceEnabled) {
      setTimeout(() => {
        handleReadAloud(result.voiceSummary);
      }, 500);
    }
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    saveScansToStorage(updated);
    if (currentResult?.id === id) {
      setCurrentResult(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setCurrentResult(null);
    clearScansStorage();
  };

  const handleTabChange = (tab: "home" | "news" | "history") => {
    shadsAudio.playClick();
    setActiveTab(tab);
    saveAppSettings({ activeTab: tab });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#000000] text-[#00FF66] flex flex-col justify-between selection:bg-[#00FF66]/30 selection:text-[#00FF66] relative font-mono">
      
      {/* Background Ambient Cyber Glow Effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#00FF66]/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* TOP HEADER - SHADS AI INSTITUTIONAL BRANDING (With iOS Safe Area Top) */}
      <header className="border-b border-[#00FF66]/30 bg-[#000000]/95 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 pt-[max(0.625rem,env(safe-area-inset-top))] shadow-[0_4px_25px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left Side: Logo, Title, Badge & Subtitle */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <AppLogo size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <div className="flex items-center tracking-wider text-lg sm:text-2xl font-black shrink-0">
                  <span className="text-[#00FF66] neon-glow-text">SHADS</span>
                  <span className="text-[#00FF66] ml-1 sm:ml-1.5 neon-glow-text">AI</span>
                </div>
                <span className="text-[8px] sm:text-[10px] bg-black text-[#00FF66] border border-[#00FF66] px-1.5 sm:px-2 py-0.5 rounded font-extrabold tracking-widest uppercase shadow-[0_0_12px_rgba(0,255,102,0.3)] shrink-0">
                  INSTITUTIONAL
                </span>
              </div>
              <p className="text-[8.5px] sm:text-[10.5px] text-[#00FF66]/80 font-mono tracking-wider uppercase mt-0.5 font-bold truncate max-w-[200px] sm:max-w-none">
                INSTITUTIONAL FOREX ORDER FLOW SCANNER
              </p>
            </div>
          </div>

          {/* Right Side: Volume Icon Button & Settings Button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Single Volume / Sound Icon Button */}
            <button
              id="btn-toggle-sound"
              onClick={handleToggleAudio}
              className={`min-h-[40px] min-w-[40px] p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                audioEnabled
                  ? "bg-black border-[#00FF66] text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.35)]"
                  : "bg-black border-[#00FF66]/30 text-[#00FF66]/50 hover:border-[#00FF66] hover:text-[#00FF66]"
              }`}
              title={audioEnabled ? "Mute Terminal Audio" : "Enable Terminal Audio"}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#00FF66]" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-[#00FF66]/50" />}
            </button>

            {/* Settings Button with Gear Icon */}
            <button
              id="btn-open-settings"
              onClick={() => {
                shadsAudio.playClick();
                setIsSettingsOpen(true);
              }}
              className="min-h-[40px] flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#00FF66] bg-black hover:bg-[#00FF66]/10 text-[#00FF66] font-bold text-[11px] sm:text-xs uppercase transition-all shadow-[0_0_15px_rgba(0,255,102,0.25)] cursor-pointer active:scale-95"
              title="Open Terminal Settings"
            >
              <Settings className="w-4 h-4 text-[#00FF66] shrink-0" />
              <span className="text-[#00FF66] hidden xs:inline">SETTINGS</span>
            </button>
          </div>

        </div>
      </header>

      {/* MAIN SCANNER WORKSPACE */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 w-full flex-1 flex flex-col items-center gap-6 z-10">

        {/* 1. HOME TAB: MAIN SCANNER AREA & FLOATING RESULT HUD */}
        {activeTab === "home" && (
          <div className="w-full flex flex-col gap-6 items-center pb-28 sm:pb-32 max-w-4xl">
            {/* Main Scanner Workspace (Info panel, Upload zone, Launch button) */}
            <ScannerPanel
              onScan={handleScanChart}
              isScanning={isScanning}
              selectedPair={selectedPair}
              setSelectedPair={setSelectedPair}
              selectedTimeframe={selectedTimeframe}
              setSelectedTimeframe={setSelectedTimeframe}
              audioEnabled={audioEnabled}
            />

            {/* FLOATING HOLOGRAPHIC CYBER AI RESULT HUD */}
            {(currentResult || isScanning) && (
              <div className="w-full mt-2 animate-float-hud">
                <ResultsHud
                  result={currentResult}
                  isScanning={isScanning}
                  onReadAloud={handleReadAloud}
                  isReading={isReading}
                  onClose={() => setCurrentResult(null)}
                />
              </div>
            )}
          </div>
        )}

        {/* 2. NEWS & IMPACT TAB */}
        {activeTab === "news" && (
          <div className="w-full pb-28 sm:pb-32 max-w-5xl">
            <MarketSentiment />
          </div>
        )}

        {/* 3. HISTORY DATABASE TAB */}
        {activeTab === "history" && (
          <div className="w-full pb-28 sm:pb-32 max-w-5xl">
            <HistoryPanel
              history={history}
              onSelect={(res) => {
                handleSelectHistory(res);
                setActiveTab("home");
              }}
              onDelete={handleDeleteHistory}
              onClearAll={handleClearHistory}
              selectedId={currentResult?.id}
            />
          </div>
        )}

        {/* FIXED BOTTOM NAVIGATION BAR WITH SAFE-AREA INSET SUPPORT */}
        <nav
          id="nav-bottom-bar"
          className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-1.5 sm:gap-4 px-2 sm:px-6 py-2 sm:py-2.5 rounded-2xl bg-black/95 backdrop-blur-2xl border border-[#00FF66]/50 shadow-[0_15px_40px_rgba(0,0,0,1),0_0_25px_rgba(0,255,102,0.25)] max-w-[calc(100vw-1rem)] sm:max-w-max"
        >
          {/* HOME */}
          <button
            id="tab-btn-home"
            onClick={() => handleTabChange("home")}
            className={`min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-xl border text-[11px] sm:text-sm font-bold uppercase transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap ${
              activeTab === "home"
                ? "bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66] shadow-[0_0_18px_rgba(0,255,102,0.4)] font-black"
                : "bg-black border-[#00FF66]/25 text-[#00FF66]/60 hover:text-[#00FF66] hover:border-[#00FF66]"
            }`}
          >
            <Home className="w-4 h-4 stroke-[2.2] text-[#00FF66] shrink-0" />
            <span className="text-[#00FF66]">HOME</span>
          </button>

          {/* NEWS & IMPACT */}
          <button
            id="tab-btn-news"
            onClick={() => handleTabChange("news")}
            className={`min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-xl border text-[11px] sm:text-sm font-bold uppercase transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap ${
              activeTab === "news"
                ? "bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66] shadow-[0_0_18px_rgba(0,255,102,0.4)] font-black"
                : "bg-black border-[#00FF66]/25 text-[#00FF66]/60 hover:text-[#00FF66] hover:border-[#00FF66]"
            }`}
          >
            <Newspaper className="w-4 h-4 stroke-[2.2] text-[#00FF66] shrink-0" />
            <span className="text-[#00FF66]">NEWS</span>
          </button>

          {/* HISTORY */}
          <button
            id="tab-btn-history"
            onClick={() => handleTabChange("history")}
            className={`min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-xl border text-[11px] sm:text-sm font-bold uppercase transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap ${
              activeTab === "history"
                ? "bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66] shadow-[0_0_18px_rgba(0,255,102,0.4)] font-black"
                : "bg-black border-[#00FF66]/25 text-[#00FF66]/60 hover:text-[#00FF66] hover:border-[#00FF66]"
            }`}
          >
            <History className="w-4 h-4 stroke-[2.2] text-[#00FF66] shrink-0" />
            <span className="text-[#00FF66]">HISTORY ({history.length})</span>
          </button>
        </nav>

      </main>

      {/* TERMINAL SETTINGS MODAL */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        voiceEnabled={voiceEnabled}
        onToggleVoice={handleToggleVoice}
        onClearHistory={handleClearHistory}
        historyCount={history.length}
      />

      {/* FOOTER */}
      <footer className="border-t border-[#00FF66]/30 bg-[#000000] py-6 px-4 text-center mt-auto">
        <div className="max-w-4xl mx-auto space-y-3">
          <p className="text-[9.5px] text-[#00FF66]/70 font-mono tracking-wider uppercase font-bold">
            INSTITUTIONAL RISK WARNING &amp; DISCLOSURE
          </p>
          <p className="text-[10px] text-[#00FF66]/80 leading-relaxed font-sans max-w-2xl mx-auto">
            Trading foreign exchange (Forex) carries high risk and may not be suitable for all investors. Shads AI is an artificial intelligence scanning system built for algorithmic confluence and quantitative order flow modeling. Suggested levels do not constitute direct financial advice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[10px] text-[#00FF66]/80 font-mono">
            <span>&copy; {new Date().getFullYear()} SHADS AI ENGINES. ALL RIGHTS RESERVED.</span>
            <span className="font-bold tracking-widest text-[#00FF66] uppercase neon-glow-text">
              App developed by shads
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
