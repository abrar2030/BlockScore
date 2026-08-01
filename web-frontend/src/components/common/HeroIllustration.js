// Self-contained hero illustration: a preview of the actual product surface
// (score dial + factor bars + a wallet chip) rather than an abstract network
// graphic, so the hero shows what BlockScore looks like to use, not just
// what it's "about".
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
      Preview of a BlockScore credit score panel showing a score of 782 and its
      contributing factors
    </title>

    <defs>
      <filter id="hiShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow
          dx="0"
          dy="18"
          stdDeviation="24"
          floodColor="#0D1220"
          floodOpacity="0.28"
        />
      </filter>
    </defs>

    {/* Ambient dots */}
    <g fill="#14B8A6" opacity="0.35">
      <circle cx="70" cy="70" r="3" />
      <circle cx="452" cy="96" r="3" />
      <circle cx="60" cy="360" r="3" />
      <circle cx="470" cy="330" r="3" />
    </g>

    {/* Main card */}
    <rect
      x="80"
      y="56"
      width="360"
      height="312"
      rx="28"
      fill="#0D1220"
      filter="url(#hiShadow)"
    />
    <rect
      x="80.5"
      y="56.5"
      width="359"
      height="311"
      rx="27.5"
      stroke="rgba(255,255,255,0.08)"
    />

    {/* Card header */}
    <circle cx="112" cy="90" r="10" fill="#14B8A6" />
    <text
      x="132"
      y="95"
      fontFamily="Space Grotesk, sans-serif"
      fontSize="15"
      fontWeight="600"
      fill="#ffffff"
    >
      BlockScore
    </text>
    <rect
      x="352"
      y="78"
      width="64"
      height="22"
      rx="11"
      fill="rgba(20,184,166,0.16)"
    />
    <text
      x="384"
      y="93"
      textAnchor="middle"
      fontFamily="IBM Plex Mono, monospace"
      fontSize="10"
      fontWeight="600"
      fill="#14B8A6"
    >
      LIVE
    </text>

    {/* Dial */}
    <g transform="translate(260, 210)">
      <path
        d="M -108 8 A 108 108 0 1 1 108 8"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M -108 8 A 108 108 0 1 1 108 8"
        stroke="#14B8A6"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="370"
        strokeDashoffset="62"
      />
      <text
        x="0"
        y="-4"
        textAnchor="middle"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="46"
        fontWeight="600"
        fill="#ffffff"
      >
        782
      </text>
      <text
        x="0"
        y="22"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="12"
        fontWeight="500"
        fill="rgba(255,255,255,0.55)"
        letterSpacing="1.4"
      >
        OUT OF 850 · EXCELLENT
      </text>
    </g>

    {/* Factor bars */}
    <g transform="translate(112, 300)" fontFamily="Inter, sans-serif">
      {[
        { label: "Payment history", w: 258, pct: "92" },
        { label: "On-chain activity", w: 214, pct: "77" },
      ].map((row, i) => (
        <g key={row.label} transform={`translate(0, ${i * 30})`}>
          <text x="0" y="-6" fontSize="11" fill="rgba(255,255,255,0.55)">
            {row.label}
          </text>
          <text
            x="296"
            y="-6"
            textAnchor="end"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="11"
            fill="rgba(255,255,255,0.75)"
          >
            {row.pct}
          </text>
          <rect
            x="0"
            y="0"
            width="296"
            height="6"
            rx="3"
            fill="rgba(255,255,255,0.1)"
          />
          <rect x="0" y="0" width={row.w} height="6" rx="3" fill="#14B8A6" />
        </g>
      ))}
    </g>

    {/* Floating wallet chip */}
    <g transform="translate(345, 40)" filter="url(#hiShadow)">
      <rect width="150" height="46" rx="14" fill="#ffffff" />
      <circle cx="26" cy="23" r="11" fill="#14B8A6" opacity="0.16" />
      <path
        d="M20 23 L24 27 L32 18"
        stroke="#0F9C8E"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <text
        x="46"
        y="20"
        fontFamily="Inter, sans-serif"
        fontSize="9.5"
        fontWeight="600"
        fill="#5B6478"
      >
        WALLET LINKED
      </text>
      <text
        x="46"
        y="34"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="10.5"
        fontWeight="500"
        fill="#12172A"
      >
        0x8f2…4c1a
      </text>
    </g>
  </svg>
);

export default HeroIllustration;
