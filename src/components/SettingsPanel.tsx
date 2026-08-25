import React, { useState } from "react";
import { Settings, X, Volume2, Radio, Trash2, Zap, Sliders, Sparkles, Check } from "lucide-react";
import { shadsAudio } from "../utils/audio";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onClearHistory: () => void;
  historyCount: number;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  audioEnabled,
  onToggleAudio,
  voiceEnabled,
  onToggleVoice,
  onClearHistory,
  historyCount,
}: SettingsPanelProps) {
  const [scannerAnimation, setScannerAnimation] = useState(true);
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [defaultRisk, setDefaultRisk] = useState("1.0%");
  const [riskRewardMin, setRiskRewardMin] = useState("1:2.5");
  const [notifications, setNotifications] = useState(true);
  const [aiPreference, setAiPreference] = useState("Institutional SMC + Order Flow Confluence");
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    shadsAudio.playClick();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-mono">
      {/* Settings Modal Container */}
      <div className="bg-black border-2 border-[#00FF66] rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,255,102,0.3)] overflow-hidden my-auto relative">
        {/* Cyber Digital Corner Brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00FF66]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00FF66]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00FF66]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00FF66]" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#00FF66]/30 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-black border border-[#00FF66] text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.3)]">
              <Settings className="w-5 h-5 text-[#00FF66] animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base tracking-wider text-[#00FF66] font-black uppercase flex items-center gap-2 neon-glow-text">
                <span>TERMINAL SETTINGS</span>
              </h2>
              <p className="text-[10px] text-[#00FF66]/70 uppercase tracking-wide">
                Institutional Terminal &amp; AI Parameters
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              shadsAudio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-black border border-[#00FF66]/50 text-[#00FF66] hover:bg-[#00FF66]/20 transition-all cursor-pointer"
            title="Close Settings"
          >
            <X className="w-5 h-5 text-[#00FF66]" />
          </button>
        </div>

        {/* Modal Content Form */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">

          {/* 1. SOUND & VOICE SYNTHESIS */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#00FF66] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#00FF66]" />
              <span>AUDIO &amp; SOUND SYNTHESIS</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Sound Effects */}
              <div
                onClick={onToggleAudio}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between bg-black ${
                  audioEnabled
                    ? "border-[#00FF66] text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.2)]"
                    : "border-[#00FF66]/30 text-[#00FF66]/50 hover:border-[#00FF66]/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-[#00FF66]" />
                  <div>
                    <div className="font-bold text-[#00FF66]">Audio Synthesizer</div>
                    <div className="text-[10px] text-[#00FF66]/70">Scan &amp; HUD click beeps</div>
                  </div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border ${audioEnabled ? "bg-[#00FF66] border-[#00FF66] shadow-[0_0_8px_#00FF66]" : "border-[#00FF66]/40"}`} />
              </div>

              {/* Voice Reader */}
              <div
                onClick={onToggleVoice}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between bg-black ${
                  voiceEnabled
                    ? "border-[#00FF66] text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.2)]"
                    : "border-[#00FF66]/30 text-[#00FF66]/50 hover:border-[#00FF66]/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-[#00FF66]" />
                  <div>
                    <div className="font-bold text-[#00FF66]">AI Voice Output</div>
                    <div className="text-[10px] text-[#00FF66]/70">Read setup &amp; coordinates</div>
                  </div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border ${voiceEnabled ? "bg-[#00FF66] border-[#00FF66] shadow-[0_0_8px_#00FF66]" : "border-[#00FF66]/40"}`} />
              </div>
            </div>
          </div>

          {/* 2. SCANNER ANIMATION & PERSISTENCE */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#00FF66] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#00FF66]" />
              <span>SCANNER &amp; DATA PREFERENCES</span>
            </span>

            <div className="space-y-2">
              <div
                onClick={() => setScannerAnimation(!scannerAnimation)}
                className="p-3 rounded-xl bg-black border border-[#00FF66]/40 hover:border-[#00FF66] flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[#00FF66]">Scanner Laser Animation</div>
                  <div className="text-[10px] text-[#00FF66]/70">Display holographic sweep during chart cognition</div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 border border-[#00FF66]/60 transition-colors ${scannerAnimation ? "bg-[#00FF66]/20" : "bg-black"}`}>
                  <div className={`w-4 h-4 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] transition-transform ${scannerAnimation ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>

              <div
                onClick={() => setAutoSaveHistory(!autoSaveHistory)}
                className="p-3 rounded-xl bg-black border border-[#00FF66]/40 hover:border-[#00FF66] flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[#00FF66]">Auto-Save Scan History</div>
                  <div className="text-[10px] text-[#00FF66]/70">Automatically record all detected signals to local database</div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 border border-[#00FF66]/60 transition-colors ${autoSaveHistory ? "bg-[#00FF66]/20" : "bg-black"}`}>
                  <div className={`w-4 h-4 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] transition-transform ${autoSaveHistory ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>

              <div
                onClick={() => setNotifications(!notifications)}
                className="p-3 rounded-xl bg-black border border-[#00FF66]/40 hover:border-[#00FF66] flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[#00FF66]">High-Impact Session Alerts</div>
                  <div className="text-[10px] text-[#00FF66]/70">Notify upon London/New York session overlap &amp; news</div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 border border-[#00FF66]/60 transition-colors ${notifications ? "bg-[#00FF66]/20" : "bg-black"}`}>
                  <div className={`w-4 h-4 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] transition-transform ${notifications ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>
            </div>
          </div>

          {/* 3. DEFAULT RISK SETTINGS */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#00FF66] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#00FF66]" />
              <span>DEFAULT RISK &amp; R:R PARAMETERS</span>
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-[#00FF66]/70 font-bold uppercase">Account Risk Per Trade</label>
                <select
                  value={defaultRisk}
                  onChange={(e) => setDefaultRisk(e.target.value)}
                  className="w-full bg-black border border-[#00FF66]/60 rounded-lg px-2.5 py-2 text-[#00FF66] font-bold focus:border-[#00FF66] outline-none"
                >
                  <option value="0.5%">0.5% (Conservative)</option>
                  <option value="1.0%">1.0% (Standard Institutional)</option>
                  <option value="2.0%">2.0% (Aggressive Growth)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#00FF66]/70 font-bold uppercase">Minimum Target R:R</label>
                <select
                  value={riskRewardMin}
                  onChange={(e) => setRiskRewardMin(e.target.value)}
                  className="w-full bg-black border border-[#00FF66]/60 rounded-lg px-2.5 py-2 text-[#00FF66] font-bold focus:border-[#00FF66] outline-none"
                >
                  <option value="1:1.5">1:1.5 Minimum</option>
                  <option value="1:2.0">1:2.0 Standard</option>
                  <option value="1:2.5">1:2.5 Institutional Target</option>
                  <option value="1:3.0">1:3.0 High Expansion</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. AI ANALYSIS PREFERENCE */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#00FF66] font-bold uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00FF66]" />
              <span>AI ANALYSIS ENGINE PROFILE</span>
            </label>
            <select
              value={aiPreference}
              onChange={(e) => setAiPreference(e.target.value)}
              className="w-full bg-black border border-[#00FF66]/60 rounded-lg px-2.5 py-2 text-[#00FF66] font-bold focus:border-[#00FF66] outline-none"
            >
              <option value="Institutional SMC + Order Flow Confluence">Institutional SMC + 24-Strategy Confluence (Recommended)</option>
              <option value="Pure Price Action & Liquidity Raids">Pure Price Action &amp; Liquidity Raids</option>
              <option value="ICT Midnight Open & London Killzone">ICT Midnight Open &amp; Killzone Alignment</option>
            </select>
          </div>

          {/* 5. DOWNLOAD ANDROID APK (STANDALONE INSTALLER) */}
          <div className="p-3 rounded-xl bg-black border border-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.2)] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-black text-[#00FF66] text-xs flex items-center gap-1.5 neon-glow-text">
                <span>ANDROID APK (STANDALONE)</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-[#00FF66] text-black font-extrabold rounded">v1.0</span>
              </div>
              <div className="text-[10px] text-[#00FF66]/75 mt-0.5">
                Install direct on your Android device (Signed APK, 7.01 MB)
              </div>
            </div>
            <a
              id="btn-settings-download-apk"
              href="/ShadsAI_v1.0.apk"
              download="ShadsAI_v1.0.apk"
              onClick={() => shadsAudio.playClick()}
              className="px-3.5 py-2 rounded-lg bg-[#00FF66] text-black font-black text-[11px] uppercase tracking-wider hover:bg-[#00e65c] transition-all shadow-[0_0_12px_rgba(0,255,102,0.4)] shrink-0 active:scale-95 flex items-center gap-1"
            >
              <span>DOWNLOAD</span>
            </a>
          </div>

          {/* 6. CLEAR HISTORY ACTION */}
          <div className="pt-2 border-t border-[#00FF66]/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#00FF66]/70 font-bold block">SAVED SCANS</span>
              <span className="text-[#00FF66] font-bold">{historyCount} Records in Storage</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={historyCount === 0}
                onClick={() => {
                  shadsAudio.playClick();
                  onClearHistory();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66]/20 text-[11px] font-bold uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,255,102,0.15)] active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#00FF66]" />
                <span>Clear All History</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#00FF66]/30 bg-black flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-black border border-[#00FF66]/50 text-[#00FF66] hover:bg-[#00FF66]/10 font-bold text-xs uppercase transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-[#00FF66] hover:bg-[#00e65c] text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,102,0.4)] flex items-center gap-1.5 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>SAVED!</span>
              </>
            ) : (
              <span>SAVE SETTINGS</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
