import React from "react";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function AppLogo({ className = "", size = "md" }: AppLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-18 h-18",
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      {/* Ambient Neon Green Flare Glow */}
      <div className="absolute inset-0 bg-[#00FF66] rounded-xl blur-[12px] opacity-35 animate-pulse pointer-events-none" />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10 drop-shadow-[0_0_12px_rgba(0,255,102,0.85)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Futuristic Hexagonal Shield Frame */}
        <polygon
          points="50,5 90,26 90,74 50,95 10,74 10,26"
          stroke="#00FF66"
          strokeWidth="3.5"
          fill="#020804"
          fillOpacity="0.85"
        />

        {/* Inner Tech Concentric Hexagon Accent */}
        <polygon
          points="50,15 80,31 80,69 50,85 20,69 20,31"
          stroke="#00FF66"
          strokeWidth="1.2"
          strokeDasharray="4 3"
          strokeOpacity="0.4"
        />

        {/* Cyber Lightning Bolt Motif */}
        <path
          d="M54 18 L32 50 L48 50 L42 82 L70 46 L52 46 Z"
          fill="#00FF66"
          stroke="#00FF66"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Core Electric Flash Center */}
        <circle cx="50" cy="49" r="2" fill="#FFFFFF" className="animate-ping" />
      </svg>
    </div>
  );
}
