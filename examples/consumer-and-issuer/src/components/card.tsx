export function Card() {
  return (
    <div className="relative h-[400px] w-full">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Premium credit card illustration"
      >
        <title>Premium credit card illustration</title>
        {/* Card Background */}
        <rect
          x="20"
          y="20"
          width="360"
          height="210"
          rx="20"
          className="fill-white stroke-gray-200 dark:fill-neutral-900 dark:stroke-white/10"
          strokeWidth="2"
        />

        {/* Holographic Effect */}
        <path
          d="M20 20 L380 20 L380 230 L20 230 Z"
          fill="url(#holographicGradient)"
          opacity="0.1"
        />

        {/* Subtle Pattern */}
        <pattern id="cardPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle
            cx="10"
            cy="10"
            r="0.5"
            fill="black"
            fillOpacity="0.03"
            className="dark:fill-white"
          />
          <circle
            cx="10"
            cy="10"
            r="1"
            fill="black"
            fillOpacity="0.01"
            className="dark:fill-white"
          />
        </pattern>
        <rect x="20" y="20" width="360" height="210" rx="20" fill="url(#cardPattern)" />

        {/* Chip */}
        <rect x="40" y="40" width="40" height="30" rx="4" fill="url(#chipGradient)" />
        <rect x="45" y="45" width="5" height="5" rx="1" fill="#FFD700" />
        <rect x="55" y="45" width="5" height="5" rx="1" fill="#FFD700" />
        <rect x="45" y="55" width="5" height="5" rx="1" fill="#FFD700" />
        <rect x="55" y="55" width="5" height="5" rx="1" fill="#FFD700" />

        {/* Card Number */}
        <text
          x="40"
          y="140"
          className="fill-black font-mono dark:fill-white"
          fontSize="24"
          letterSpacing="2"
        >
          •••• •••• •••• 8888
        </text>

        {/* Card Holder */}
        <text
          x="40"
          y="180"
          className="fill-black font-medium dark:fill-white"
          fontSize="16"
          letterSpacing="1"
        >
          CARD HOLDER NAME
        </text>

        {/* Expiry */}
        <text
          x="300"
          y="180"
          className="fill-black font-medium dark:fill-white"
          fontSize="16"
          letterSpacing="1"
        >
          MM/YY
        </text>

        {/* Gradients */}
        <defs>
          <linearGradient
            id="chipGradient"
            x1="0"
            y1="0"
            x2="40"
            y2="30"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
          <linearGradient
            id="holographicGradient"
            x1="0"
            y1="0"
            x2="400"
            y2="250"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.05" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
