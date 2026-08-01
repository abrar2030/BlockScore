import { Box, Typography } from "@mui/material";

// The signature visual of BlockScore: an instrument-style dial rather than a
// generic ring, because a credit score is read the way a gauge is read (is
// the needle in the red, amber, or green zone?), not the way a percentage
// bar is read.
//
// Band colors are the score's own "calibration marks" and intentionally
// don't come from the app's teal/ink brand palette - the way a real
// instrument keeps its danger/caution/safe zones fixed regardless of the
// housing color around it.
const BANDS = [
  { from: 300, to: 600, color: "#f44336" },
  { from: 600, to: 650, color: "#ff5722" },
  { from: 650, to: 700, color: "#ff9800" },
  { from: 700, to: 750, color: "#3f51b5" },
  { from: 750, to: 850, color: "#4caf50" },
];

const MIN = 300;
const MAX = 850;

const getColor = (score) => {
  if (score >= 750) return "#4caf50"; // Excellent
  if (score >= 700) return "#3f51b5"; // Good
  if (score >= 650) return "#ff9800"; // Fair
  if (score >= 600) return "#ff5722"; // Poor
  return "#f44336"; // Very poor
};

const fractionOf = (value) =>
  Math.min(1, Math.max(0, (value - MIN) / (MAX - MIN)));

// Gauge sweeps 180 (left) -> 0 (right) degrees across the top of a circle.
const polar = (cx, cy, r, angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
};

const arcPath = (cx, cy, r, startFraction, endFraction) => {
  const startAngle = 180 - startFraction * 180;
  const endAngle = 180 - endFraction * 180;
  const start = polar(cx, cy, r, startAngle);
  const end = polar(cx, cy, r, endAngle);
  const largeArc = startAngle - endAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

const CreditScoreGauge = ({ score = 0, size = 200 }) => {
  const color = getColor(score);
  const fraction = fractionOf(score);
  const cx = 100;
  const cy = 96;
  const r = 82;
  const needleAngle = 180 - fraction * 180;
  const needleTip = polar(cx, cy, r - 18, needleAngle);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: size,
        mx: "auto",
      }}
    >
      <svg
        viewBox="0 0 200 112"
        width="100%"
        role="img"
        aria-label={`Credit score ${score} out of 850`}
      >
        {BANDS.map((band) => (
          <path
            key={band.color}
            d={arcPath(cx, cy, r, fractionOf(band.from), fractionOf(band.to))}
            stroke={band.color}
            strokeOpacity={0.9}
            strokeWidth={12}
            strokeLinecap="butt"
            fill="none"
          />
        ))}

        {/* Ticks at 300 / 575 / 850 */}
        {[0, 0.5, 1].map((f) => {
          const inner = polar(cx, cy, r - 18, 180 - f * 180);
          const outer = polar(cx, cy, r + 8, 180 - f * 180);
          return (
            <line
              key={f}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#B7BCCB"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#12172A"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill="#12172A" />
      </svg>

      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h3"
          component="div"
          sx={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontWeight: 600,
            color,
            lineHeight: 1,
          }}
        >
          {score}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            letterSpacing: 0.6,
            mt: 0.5,
          }}
        >
          out of 850
        </Typography>
      </Box>
    </Box>
  );
};

export default CreditScoreGauge;
