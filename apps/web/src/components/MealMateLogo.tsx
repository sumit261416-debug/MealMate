import type { SVGProps } from "react";

interface MealMateLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  title?: string;
  variant?: "mark" | "full" | "icon";
  showTagline?: boolean;
}

/**
 * Premium MealMate Brand Mark & Logo with Smooth Micro-Animations
 * Features:
 * - Breathing culinary aroma steam whisps (subtle staggered float)
 * - Gentle organic sway on the herbal crown sprout
 * - Shimmering ambient star twinkle
 * - Warm culinary food glow inside the tiffin bowl
 * - Ultra-smooth hover acceleration and lift
 */
export function MealMateLogo({
  size = 38,
  className = "",
  title = "MealMate - Fresh Daily Tiffin",
  variant = "mark",
  showTagline = false,
  ...props
}: MealMateLogoProps) {
  if (variant === "full") {
    return (
      <div
        className={`inline-flex items-center gap-3 ${className}`}
        style={{ display: "inline-flex", alignItems: "center", gap: "0.85rem" }}
      >
        <MealMateLogoMark size={size} title={title} {...props} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span
              style={{
                fontFamily: "var(--font-heading, inherit)",
                fontWeight: 800,
                fontSize: `${size * 0.58}px`,
                letterSpacing: "-0.03em",
                color: "#ffffff",
              }}
            >
              Meal
              <span
                style={{
                  background: "linear-gradient(135deg, #34d399 0%, #10b981 60%, #059669 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 900,
                }}
              >
                Mate
              </span>
            </span>
            <span
              style={{
                display: "inline-block",
                width: `${size * 0.16}px`,
                height: `${size * 0.16}px`,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                boxShadow: "0 0 8px rgba(245, 158, 11, 0.6)",
              }}
              aria-hidden="true"
            />
          </div>
          {showTagline && (
            <span
              style={{
                fontSize: `${Math.max(10, size * 0.26)}px`,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-text-muted, #94a3b8)",
                marginTop: "2px",
              }}
            >
              NCR · Daily Tiffin
            </span>
          )}
        </div>
      </div>
    );
  }

  return <MealMateLogoMark size={size} className={className} title={title} {...props} />;
}

export function MealMateLogoMark({
  size = 38,
  className = "",
  title = "MealMate",
  ...props
}: {
  size?: number;
  className?: string;
  title?: string;
} & SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={`mm-logo-svg ${className}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      {...props}
    >
      <defs>
        {/* Embedded Vector Micro-Animations */}
        <style>{`
          @keyframes mmSteamRise1 {
            0%, 100% {
              transform: translateY(0);
              opacity: 0.85;
            }
            50% {
              transform: translateY(-2.8px) scaleX(1.06);
              opacity: 0.45;
            }
          }

          @keyframes mmSteamRise2 {
            0%, 100% {
              transform: translateY(0);
              opacity: 0.95;
            }
            50% {
              transform: translateY(-3.5px) scaleX(1.08);
              opacity: 0.5;
            }
          }

          @keyframes mmSteamRise3 {
            0%, 100% {
              transform: translateY(0);
              opacity: 0.85;
            }
            50% {
              transform: translateY(-2.4px) scaleX(1.05);
              opacity: 0.4;
            }
          }

          @keyframes mmSproutGentleSway {
            0%, 100% {
              transform: translate(24px, 8.5px) rotate(0deg);
            }
            25% {
              transform: translate(24px, 8.5px) rotate(3.2deg);
            }
            75% {
              transform: translate(24px, 8.5px) rotate(-3.2deg);
            }
          }

          @keyframes mmTwinkle {
            0%, 100% {
              transform: scale(0.85);
              opacity: 0.35;
            }
            50% {
              transform: scale(1.3);
              opacity: 1;
            }
          }

          @keyframes mmCoreWarmth {
            0%, 100% {
              opacity: 0.88;
            }
            50% {
              opacity: 1;
            }
          }

          .mm-steam-1 {
            animation: mmSteamRise1 3s ease-in-out infinite;
            transform-origin: 18.5px 16.5px;
          }
          .mm-steam-2 {
            animation: mmSteamRise2 2.6s ease-in-out infinite 0.6s;
            transform-origin: 24px 15.5px;
          }
          .mm-steam-3 {
            animation: mmSteamRise3 3.1s ease-in-out infinite 1.2s;
            transform-origin: 29.5px 16.5px;
          }
          .mm-sprout {
            animation: mmSproutGentleSway 4.8s ease-in-out infinite;
            transform-origin: 0 0;
          }
          .mm-sparkle-star {
            animation: mmTwinkle 2.4s ease-in-out infinite;
            transform-origin: 37.5px 10.5px;
          }
          .mm-food-glow {
            animation: mmCoreWarmth 3.2s ease-in-out infinite;
          }

          /* Hover acceleration & spring playfulness */
          .mm-logo-svg:hover .mm-steam-1 {
            animation-duration: 1.4s;
          }
          .mm-logo-svg:hover .mm-steam-2 {
            animation-duration: 1.3s;
          }
          .mm-logo-svg:hover .mm-steam-3 {
            animation-duration: 1.5s;
          }
          .mm-logo-svg:hover .mm-sprout {
            animation-duration: 2.2s;
          }
        `}</style>

        {/* Deep emerald & pine background gradient */}
        <linearGradient id="mm-bg-grad" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0a3c2a" />
          <stop offset="0.4" stopColor="#062b1e" />
          <stop offset="1" stopColor="#031811" />
        </linearGradient>

        {/* Ambient emerald radial glow */}
        <radialGradient id="mm-glow" cx="35%" cy="25%" r="65%">
          <stop stopColor="#10b981" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#059669" stopOpacity="0.15" />
          <stop offset="1" stopColor="#021a11" stopOpacity="0" />
        </radialGradient>

        {/* Premium rim lighting border */}
        <linearGradient id="mm-rim-border" x1="2" y1="2" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="0.3" stopColor="#34d399" stopOpacity="0.35" />
          <stop offset="0.75" stopColor="#059669" stopOpacity="0.15" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>

        {/* Diagonal specular sheen */}
        <linearGradient id="mm-sheen" x1="6" y1="4" x2="38" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Golden culinary steam aroma gradient */}
        <linearGradient id="mm-steam-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0.25" />
        </linearGradient>

        {/* Fresh herbal leaf gradients */}
        <linearGradient id="mm-leaf-left" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="mm-leaf-right" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#34d399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Porcelain tiffin bowl gradient */}
        <linearGradient id="mm-bowl-grad" x1="12" y1="23" x2="36" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Warm food glow inside the bowl */}
        <radialGradient id="mm-food-core" cx="50%" cy="40%" r="55%">
          <stop stopColor="#fbbf24" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </radialGradient>

        {/* Golden tiffin accent rim */}
        <linearGradient id="mm-gold-trim" x1="10" y1="22" x2="38" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Drop shadow filter for floating elements */}
        <filter id="mm-soft-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" floodColor="#02140d" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Outer rounded squircle container */}
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#mm-bg-grad)" />
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#mm-glow)" />
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#mm-sheen)" />

      {/* Beveled crisp edge highlight */}
      <rect
        x="2.5"
        y="2.5"
        width="43"
        height="43"
        rx="12.5"
        stroke="url(#mm-rim-border)"
        strokeWidth="1.2"
      />

      {/* Animated corner sparkle / star in top right */}
      <g className="mm-sparkle-star">
        <circle cx="37.5" cy="10.5" r="1.1" fill="#fde68a" />
        <path
          d="M37.5 8.5v4M35.5 10.5h4"
          stroke="#fde68a"
          strokeWidth="0.65"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>

      {/* Rising Steam Curves (aroma of fresh home-style meal) */}
      <g filter="url(#mm-soft-shadow)">
        {/* Left steam whisps */}
        <path
          className="mm-steam-1"
          d="M18.5 16.5c-0.2-2.2 1.5-3.2 1.3-5.2-.2-1.8-1.4-2.4-1-4"
          stroke="url(#mm-steam-grad)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Center steam whisps (taller, flowing into sprout) */}
        <path
          className="mm-steam-2"
          d="M24 15.5c-.3-2.6 1.8-3.8 1.4-6.2-.3-1.6-1.5-2.2-1-3.8"
          stroke="url(#mm-steam-grad)"
          strokeWidth="1.9"
          strokeLinecap="round"
        />

        {/* Right steam whisps */}
        <path
          className="mm-steam-3"
          d="M29.5 16.5c.2-2.2-1.5-3.2-1.3-5.2.2-1.8 1.4-2.4 1-4"
          stroke="url(#mm-steam-grad)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>

      {/* Animated Fresh Wholesome Leaf Sprout Crown */}
      <g className="mm-sprout" transform="translate(24, 8.5)">
        {/* Left leaf */}
        <path
          d="M0 0c-3.2-.2-5.5-2-5.8-4.8 2.8.1 5.2 1.8 5.8 4.8z"
          fill="url(#mm-leaf-left)"
        />
        {/* Right leaf */}
        <path
          d="M0 0c3.2-.2 5.5-2 5.8-4.8-2.8.1-5.2 1.8-5.8 4.8z"
          fill="url(#mm-leaf-right)"
        />
        {/* Leaf center rib */}
        <path
          d="M0 0v-5.2"
          stroke="#ffffff"
          strokeWidth="0.6"
          strokeLinecap="round"
          opacity="0.65"
        />
      </g>

      {/* Bowl & Tiffin Body with Shadow */}
      <g filter="url(#mm-soft-shadow)">
        {/* Bowl base shadow */}
        <ellipse cx="24" cy="38" rx="8" ry="2" fill="#02140d" opacity="0.45" />

        {/* Bowl main vessel */}
        <path
          d="M11 23.5c.6 8 5.6 13.5 13 13.5s12.4-5.5 13-13.5H11z"
          fill="url(#mm-bowl-grad)"
        />

        {/* Warm curry/tiffin hot food surface inside bowl */}
        <ellipse className="mm-food-glow" cx="24" cy="23.2" rx="12.2" ry="2.6" fill="url(#mm-food-core)" />

        {/* Sleek Golden Rim of the Bowl */}
        <path
          d="M9.5 23.2h29"
          stroke="url(#mm-gold-trim)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Inner specular shine on the rim */}
        <path
          d="M12 22.8h24"
          stroke="#ffffff"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* Elegant "M" monogram curved ribbon inside the bowl face */}
        <path
          d="M17 27c1.8 3.5 3.5 4.8 5 1.5 1 .8 3 .8 4 0 1.5 3.3 3.2 2 5-1.5"
          stroke="#10b981"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />

        {/* Modern base pedestal ring */}
        <path
          d="M19 36.8h10"
          stroke="url(#mm-gold-trim)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
