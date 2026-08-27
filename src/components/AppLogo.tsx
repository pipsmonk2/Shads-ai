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
      <div className="absolute inset-0 bg-[#00FF66] rounded-xl blur-[14px] opacity-40 animate-pulse pointer-events-none" />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(0,255,102,0.9)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="appLogoGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFA3" />
            <stop offset="50%" stopColor="#00FF66" />
            <stop offset="100%" stopColor="#00CC44" />
          </linearGradient>
          <linearGradient id="appLogoShieldBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#031207" />
            <stop offset="100%" stopColor="#010402" />
          </linearGradient>
        </defs>

        {/* Tech Corner Crosshairs */}
        <g stroke="#00FF66" strokeWidth="1.2" opacity="0.45">
          <path d="M 12 22 L 12 14 L 20 14" fill="none" />
          <path d="M 88 22 L 88 14 L 80 14" fill="none" />
          <path d="M 12 78 L 12 86 L 20 86" fill="none" />
          <path d="M 88 78 L 88 86 L 80 86" fill="none" />
        </g>

        {/* Futuristic Hexagonal Shield Frame */}
        <polygon
          points="50,8 88,27 88,73 50,92 12,73 12,27"
          stroke="#00FF66"
          strokeWidth="3.2"
          fill="url(#appLogoShieldBg)"
          strokeLinejoin="round"
        />

        {/* Inner Tech Concentric Hexagon Accent */}
        <polygon
          points="50,16 80,31 80,69 50,84 20,69 20,31"
          stroke="#00FF66"
          strokeWidth="1.2"
          strokeDasharray="4 3"
          strokeOpacity="0.45"
          strokeLinejoin="round"
        />

        {/* Precision Candlestick Wicks behind Lightning */}
        <g stroke="#00FF66" strokeWidth="1.2" opacity="0.65">
          <line x1="38" y1="35" x2="38" y2="65" />
          <line x1="62" y1="35" x2="62" y2="65" />
        </g>

        {/* Cyber Institutional "S" / Lightning Bolt Motif */}
        <path
          d="M54 20 L31 49 L47 49 L39 79 L69 45 L52 45 L61 20 Z"
          fill="url(#appLogoGreenGrad)"
          stroke="#00FF66"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />

        {/* Core Electric Flash Center */}
        <circle cx="49" cy="48" r="2.2" fill="#FFFFFF" className="animate-ping" />
      </svg>
    </div>
  );
}
