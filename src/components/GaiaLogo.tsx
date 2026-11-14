"use client";

import React, { useState } from "react";
import Image from "next/image";

interface GaiaLogoProps {
  size?: number;
  className?: string;
  showBadge?: boolean;
}

export function GaiaLogo({
  size = 70,
  className = "",
  showBadge = false,
}: GaiaLogoProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {!imageError ? (
        <Image
          src="/logo3.png"
          alt="GAIA Logo"
          width={size}
          height={size}
          className="h-full w-full object-contain rounded-xl drop-shadow-[0_2px_8px_rgba(40,48,28,0.2)]"
          priority
          onError={() => setImageError(true)}
        />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_2px_10px_rgba(154,126,59,0.35)]"
        >
          <circle
            cx="32"
            cy="32"
            r="30"
            fill="#28301C"
            stroke="#41644A"
            strokeWidth="2.2"
          />
          <path
            d="M22 46C20 39 21 30 27 24C33 18 43 17 47 17C47 25 44 34 37 40C31 45 25 46 22 46Z"
            fill="#41644A"
            stroke="#D6C99A"
            strokeWidth="1.5"
          />
        </svg>
      )}

      {showBadge && (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#41644A] text-[9px] font-bold text-[#FFFFFF] ring-2 ring-[#FFFFFF] shadow-xs">
          AI
        </span>
      )}
    </div>
  );
}
