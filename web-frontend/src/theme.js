import { createTheme } from "@mui/material/styles";

// BlockScore design tokens.
//
// Palette: a light "ledger" workspace (near-white, cool blue-grey) framed by
// deep-ink chrome (sidebar, panels), with a teal "signal" accent standing in
// for verified/trustworthy state, an amber for attention, and a garnet for
// risk. Credit-score bands keep their own calibrated colors (see
// CreditScoreGauge) the way a real instrument dial would, independent of the
// brand accent used everywhere else.
const ink = "#0D1220";
const inkRaised = "#171D33";
const ledger = "#F5F6FA";
const signal = "#14B8A6";
const amber = "#F2A93B";
const garnet = "#E24C63";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: signal,
      light: "#4FD3C4",
      dark: "#0B8F82",
      contrastText: "#03211D",
    },
    secondary: {
      main: ink,
      light: inkRaised,
      dark: "#05070F",
      contrastText: "#ffffff",
    },
    background: {
      default: ledger,
      paper: "#ffffff",
    },
    success: {
      main: "#1E9E6B",
    },
    warning: {
      main: amber,
    },
    error: {
      main: garnet,
    },
    info: {
      main: "#3E6BE0",
    },
    text: {
      primary: "#12172A",
      secondary: "#5B6478",
    },
    divider: "rgba(13, 18, 32, 0.09)",
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h2: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h3: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    h4: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h6: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "0.01em",
    },
    overline: {
      fontWeight: 600,
      letterSpacing: 1.4,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: ledger,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "9px 20px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        containedPrimary: {
          background: signal,
          color: "#03211D",
          "&:hover": {
            background: "#0FA294",
          },
        },
        containedSecondary: {
          background: ink,
          "&:hover": {
            background: inkRaised,
          },
        },
        outlined: {
          borderWidth: 1.5,
          "&:hover": {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(13, 18, 32, 0.07)",
          boxShadow: "0px 1px 2px rgba(13, 18, 32, 0.04)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: "rgba(13, 18, 32, 0.09)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: "rgba(13, 18, 32, 0.08)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#5B6478",
          backgroundColor: "#FAFAFC",
        },
      },
    },
  },
});

// Exposed for components that want the raw tokens (e.g. the score gauge,
// hero illustration) without pulling them back out of the MUI theme object.
theme.tokens = { ink, inkRaised, ledger, signal, amber, garnet };

export default theme;
