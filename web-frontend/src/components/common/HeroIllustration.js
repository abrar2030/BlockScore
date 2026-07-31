// Self-contained hero illustration for the landing page.
//
// This replaces a previous <img src="/hero-image.svg" /> reference that
// pointed at a static asset which didn't exist in public/, causing a
// broken-image icon in the hero section and a dev-server proxy error
// (the request fell through to the CRA proxy and tried to hit the
// backend on :5000). Rendering the artwork as an inline SVG component
// removes the missing-asset problem entirely, keeps the bundle to a
// single request, and lets the illustration inherit theme colors.
const HeroIllustration = (props) => (
  <svg
    viewBox="0 0 520 420"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-labelledby="heroIllustrationTitle"
    {...props}
  >
    <title id="heroIllustrationTitle">
      Illustration of a credit score dial connected to a decentralized
      blockchain network
    </title>

    <defs>
      <linearGradient id="hiCardGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id="hiArcGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#f50057" />
        <stop offset="55%" stopColor="#7c4dff" />
        <stop offset="100%" stopColor="#3f51b5" />
      </linearGradient>
      <linearGradient id="hiNodeGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e8eaf6" />
      </linearGradient>
      <filter id="hiShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow
          dx="0"
          dy="10"
          stdDeviation="14"
          floodColor="#1a237e"
          floodOpacity="0.25"
        />
      </filter>
    </defs>

    {/* Decorative connective network sitting behind the main card */}
    <g stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5">
      <line x1="60" y1="80" x2="150" y2="150" />
      <line x1="150" y1="150" x2="120" y2="260" />
      <line x1="150" y1="150" x2="260" y2="120" />
      <line x1="380" y1="70" x2="330" y2="150" />
      <line x1="330" y1="150" x2="400" y2="230" />
      <line x1="400" y1="230" x2="440" y2="330" />
      <line x1="80" y1="330" x2="150" y2="290" />
      <line x1="150" y1="290" x2="170" y2="360" />
    </g>

    <g fill="url(#hiNodeGrad)" stroke="#c5cae9" strokeWidth="1.5">
      <circle cx="60" cy="80" r="9" />
      <circle cx="150" cy="150" r="7" />
      <circle cx="120" cy="260" r="10" />
      <circle cx="260" cy="120" r="6" />
      <circle cx="380" cy="70" r="8" />
      <circle cx="330" cy="150" r="6" />
      <circle cx="400" cy="230" r="9" />
      <circle cx="440" cy="330" r="7" />
      <circle cx="80" cy="330" r="6" />
      <circle cx="150" cy="290" r="8" />
      <circle cx="170" cy="360" r="6" />
    </g>

    {/* Main card */}
    <rect
      x="110"
      y="90"
      width="300"
      height="240"
      rx="24"
      fill="url(#hiCardGrad)"
      filter="url(#hiShadow)"
    />

    {/* Score dial */}
    <g transform="translate(260, 205)">
      <path
        d="M -95 20 A 95 95 0 1 1 95 20"
        stroke="#e8eaf6"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M -95 20 A 95 95 0 1 1 95 20"
        stroke="url(#hiArcGrad)"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="330"
        strokeDashoffset="70"
      />
      <text
        x="0"
        y="0"
        textAnchor="middle"
        fontFamily="Poppins, sans-serif"
        fontSize="42"
        fontWeight="700"
        fill="#1a237e"
      >
        742
      </text>
      <text
        x="0"
        y="26"
        textAnchor="middle"
        fontFamily="Roboto, sans-serif"
        fontSize="13"
        fontWeight="500"
        fill="#5c6bc0"
        letterSpacing="1.5"
      >
        CREDIT SCORE
      </text>
    </g>

    {/* Small chip / shield badge on the card */}
    <g transform="translate(150, 130)">
      <rect
        x="-20"
        y="-16"
        width="40"
        height="32"
        rx="8"
        fill="#3f51b5"
        opacity="0.12"
      />
      <path
        d="M0 -12 L14 -6 V6 C14 14 8 19 0 22 C-8 19 -14 14 -14 6 V-6 Z"
        fill="#3f51b5"
      />
      <path
        d="M-5 1 L-1 6 L6 -5"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>

    {/* Floating status pill */}
    <g transform="translate(345, 300)">
      <rect
        x="-48"
        y="-16"
        width="96"
        height="32"
        rx="16"
        fill="#f50057"
        opacity="0.95"
      />
      <text
        x="0"
        y="5"
        textAnchor="middle"
        fontFamily="Roboto, sans-serif"
        fontSize="13"
        fontWeight="600"
        fill="#ffffff"
      >
        Excellent
      </text>
    </g>
  </svg>
);

export default HeroIllustration;
