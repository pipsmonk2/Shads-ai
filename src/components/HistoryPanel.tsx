import React, { useState } from "react";
import { History, Trash2, Search, ArrowUpRight, ArrowDownRight, Zap, Copy, Check, ShieldCheck, Target, AlertTriangle } from "lucide-react";
import { ScanResult } from "../types";
import { shadsAudio } from "../utils/audio";
import { copyToClipboard } from "../utils/clipboard";

interface HistoryPanelProps {
  history: ScanResult[];
  onSelect: (result: ScanResult) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  selectedId?: string;
}

export default function HistoryPanel({
  history,
  onSelect,
  onDelete,
  onClearAll,
  selectedId
}: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSignal, setFilterSignal] = useState<"ALL" | "BUY" | "SELL" | "NO_TRADE">("ALL");
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSelect = (item: ScanResult) => {
    shadsAudio.playClick();
    onSelect(item);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    shadsAudio.playClick();
    onDelete(id);
  };

  const handleCopyCoord = async (e: React.MouseEvent, key: string, value: string) => {
    e.stopPropagation();
    if (!value) return;
    shadsAudio.playClick();
    const success = await copyToClipboard(value);
    if (success) {
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    }
  };

  const handleConfirmClear = () => {
    shadsAudio.playClick();
    onClearAll();
    setIsConfirmingClear(false);
  };

  const filteredHistory = history.filter((item) => {
    const matchesQuery = item.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.timeframe.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSignal = filterSignal === "ALL" || item.signal === filterSignal;
    return matchesQuery && matchesSignal;
  });

  return (
    <div id="history-panel-component" className="w-full bg-black border border-[#00FF66]/40 rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,1)] font-mono">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#00FF66]/30 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-black border-2 border-[#00FF66] text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.3)]">
            <History className="w-5 h-5 text-[#00FF66]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-wider text-[#00FF66] uppercase flex items-center gap-2 neon-glow-text">
              <span>SCAN HISTORY DATABASE</span>
              <span className="text-[10px] bg-black text-[#00FF66] border border-[#00FF66] px-2 py-0.5 rounded font-extrabold shadow-[0_0_8px_rgba(0,255,102,0.3)]">
                {history.length} SAVED
              </span>
            </h3>
            <p className="text-[10px] text-[#00FF66]/70 uppercase tracking-wider">
              Local Device Institutional Cache
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <div className="self-start sm:self-auto">
            {isConfirmingClear ? (
              <div className="flex items-center gap-2 bg-black p-1 rounded-xl border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.35)] animate-in fade-in">
                <span className="text-[10px] text-red-400 font-bold px-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  Wipe all {history.length} scans?
                </span>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase transition-all shadow-[0_0_10px_rgba(239,68,68,0.5)] cursor-pointer"
                >
                  YES, CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-2 py-1 rounded-lg bg-black border border-[#00FF66]/40 text-[#00FF66]/80 hover:text-[#00FF66] text-[10px] uppercase font-bold cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  shadsAudio.playClick();
                  setIsConfirmingClear(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66]/20 text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,255,102,0.15)] active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#00FF66]" />
                <span>Clear All History</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-[#00FF66]/70 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by pair or timeframe (e.g. EUR/USD, H1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-[#00FF66]/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#00FF66] placeholder-[#00FF66]/50 focus:border-[#00FF66] outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-black p-1 rounded-xl border border-[#00FF66]/40 text-xs font-bold">
          {(["ALL", "BUY", "SELL", "NO_TRADE"] as const).map((sig) => (
            <button
              key={sig}
              type="button"
              onClick={() => setFilterSignal(sig)}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center uppercase text-[10px] cursor-pointer ${
                filterSignal === sig
                  ? "bg-[#00FF66]/20 border border-[#00FF66] text-[#00FF66] font-black shadow-[0_0_8px_rgba(0,255,102,0.3)]"
                  : "text-[#00FF66]/60 hover:text-[#00FF66]"
              }`}
            >
              {sig === "NO_TRADE" ? "WAIT" : sig}
            </button>
          ))}
        </div>
      </div>

      {/* Scans List */}
      {filteredHistory.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[#00FF66]/30 rounded-xl bg-black space-y-2">
          <History className="w-8 h-8 text-[#00FF66]/40 mx-auto animate-pulse" />
          <p className="text-xs text-[#00FF66] uppercase font-bold">No matching scan records found</p>
          <p className="text-[10px] text-[#00FF66]/70">Upload a chart in the Terminal tab to analyze and save order flow setups.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredHistory.map((item) => {
            const isBuy = item.signal === "BUY";
            const isSell = item.signal === "SELL";
            const isSelected = selectedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 bg-black ${
                  isSelected
                    ? "border-2 border-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.35)]"
                    : "border-[#00FF66]/40 hover:border-[#00FF66] hover:shadow-[0_0_15px_rgba(0,255,102,0.2)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 border-[#00FF66] bg-black text-[#00FF66] font-black shadow-[0_0_10px_rgba(0,255,102,0.3)]">
                      {isBuy ? <ArrowUpRight className="w-5 h-5 stroke-[2.5] text-[#00FF66]" /> : isSell ? <ArrowDownRight className="w-5 h-5 stroke-[2.5] text-[#00FF66]" /> : <Zap className="w-4 h-4 text-[#00FF66]" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#00FF66] text-sm neon-glow-text">{item.pair}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-black border border-[#00FF66]/60 text-[#00FF66] font-bold">
                          {item.timeframe}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#00FF66]">
                        {item.signal} &bull; {item.confidence}% Conf.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-1.5 rounded-lg text-[#00FF66]/60 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Individual Coordinate Cards with Copy Buttons & Structure Context */}
                <div className="grid grid-cols-3 gap-2 text-[10.5px] bg-black p-2 rounded-lg border border-[#00FF66]/30">
                  {/* Entry */}
                  <div className="flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[#00FF66]/70 text-[9px] block font-bold">ENTRY:</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCoord(e, `${item.id}-entry`, item.entryPrice)}
                        className="p-0.5 rounded text-[#00FF66]/60 hover:text-[#00FF66] hover:bg-[#00FF66]/20 transition-colors"
                        title="Copy Entry"
                      >
                        {copiedKey === `${item.id}-entry` ? <Check className="w-2.5 h-2.5 text-[#00FF66]" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                    <span className="text-[#00FF66] font-bold truncate mt-0.5">{item.entryPrice}</span>
                  </div>

                  {/* Stop Loss (Structure-Based) */}
                  <div className="flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[#00FF66]/85 text-[9px] block font-bold truncate flex items-center gap-0.5" title={item.structureSLNote || "Structure Invalidation"}>
                        <ShieldCheck className="w-2.5 h-2.5 text-[#00FF66]" />
                        SL:
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCoord(e, `${item.id}-sl`, item.stopLoss)}
                        className="p-0.5 rounded text-[#00FF66]/60 hover:text-[#00FF66] hover:bg-[#00FF66]/20 transition-colors"
                        title="Copy Stop Loss"
                      >
                        {copiedKey === `${item.id}-sl` ? <Check className="w-2.5 h-2.5 text-[#00FF66]" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                    <span className="text-[#00FF66] font-bold truncate mt-0.5">{item.stopLoss}</span>
                  </div>

                  {/* Take Profit 1 (Structure Target) */}
                  <div className="flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[#00FF66] text-[9px] block font-bold truncate flex items-center gap-0.5" title={item.structureTP1Note || "Structure Target"}>
                        <Target className="w-2.5 h-2.5 text-[#00FF66]" />
                        TP1:
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCoord(e, `${item.id}-tp1`, item.takeProfit1)}
                        className="p-0.5 rounded text-[#00FF66]/60 hover:text-[#00FF66] hover:bg-[#00FF66]/20 transition-colors"
                        title="Copy Take Profit 1"
                      >
                        {copiedKey === `${item.id}-tp1` ? <Check className="w-2.5 h-2.5 text-[#00FF66]" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                    <span className="text-[#00FF66] font-bold truncate mt-0.5">{item.takeProfit1}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] text-[#00FF66]/70 pt-1 border-t border-[#00FF66]/20">
                  <span>{new Date(item.timestamp).toLocaleString()}</span>
                  <span className="text-[#00FF66] font-bold">R:R {item.riskRewardRatio}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
