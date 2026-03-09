export const darkColors = {
  background: "#0A0A0F", surface: "#141418", surfaceAlt: "#1C1C22",
  surfaceHover: "#22222A", border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.14)", text: "#F0F0F8",
  textSub: "rgba(240,240,248,0.55)", textMuted: "rgba(240,240,248,0.3)",
  accent: "#6366F1", accentSoft: "rgba(99,102,241,0.12)", accentGlow: "rgba(99,102,241,0.35)",
  income: "#34C759", incomeSoft: "rgba(52,199,89,0.12)",
  expense: "#FF375F", expenseSoft: "rgba(255,55,95,0.12)",
  warning: "#FF9F0A", warningSoft: "rgba(255,159,10,0.12)",
  savings: "#5AC8FA", savingsSoft: "rgba(90,200,250,0.12)",
  shadow: "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
  shadowLg: "0 24px 64px rgba(0,0,0,0.5)",
};

export const lightColors = {
  // Warm white base — not stark, not blue-grey
  background: "#F7F6F3",
  surface: "#FFFFFF",
  surfaceAlt: "#F0EEE9",
  surfaceHover: "#E8E5DE",

  // Borders — soft warm grey, not harsh black lines
  border: "rgba(60,55,45,0.09)",
  borderStrong: "rgba(60,55,45,0.18)",

  // Text — warm dark brown, not pure black (easier on eyes)
  text: "#1C1917",
  textSub: "rgba(28,25,23,0.6)",
  textMuted: "rgba(28,25,23,0.38)",

  // Accent — slightly more saturated for readability on light bg
  accent: "#5254CC",
  accentSoft: "rgba(82,84,204,0.10)",
  accentGlow: "rgba(82,84,204,0.20)",

  // Status colours — slightly deeper for contrast on light
  income: "#1E9E48",       incomeSoft: "rgba(30,158,72,0.10)",
  expense: "#D9294A",      expenseSoft: "rgba(217,41,74,0.10)",
  warning: "#C97A08",      warningSoft: "rgba(201,122,8,0.10)",
  savings: "#0A8FBF",      savingsSoft: "rgba(10,143,191,0.10)",

  // Shadows — warm, subtle, not cold grey
  shadow: "0 2px 12px rgba(60,55,45,0.08), 0 1px 3px rgba(60,55,45,0.05)",
  shadowLg: "0 12px 40px rgba(60,55,45,0.12)",
};

export const accentOptions = [
  { name: "Indigo",   value: "#6366F1", dark: "#3730A3", glow: "rgba(99,102,241,0.35)",  soft: "rgba(99,102,241,0.12)"  },
  { name: "Violet",   value: "#BF5AF2", dark: "#7C3AED", glow: "rgba(191,90,242,0.35)",  soft: "rgba(191,90,242,0.12)"  },
  { name: "Rose",     value: "#FF375F", dark: "#BE123C", glow: "rgba(255,55,95,0.35)",   soft: "rgba(255,55,95,0.12)"   },
  { name: "Amber",    value: "#FF9F0A", dark: "#B45309", glow: "rgba(255,159,10,0.35)",  soft: "rgba(255,159,10,0.12)"  },
  { name: "Emerald",  value: "#34C759", dark: "#166534", glow: "rgba(52,199,89,0.35)",   soft: "rgba(52,199,89,0.12)"   },
  { name: "Cyan",     value: "#5AC8FA", dark: "#0E7490", glow: "rgba(90,200,250,0.35)",  soft: "rgba(90,200,250,0.12)"  },
  { name: "Orange",   value: "#FF6B35", dark: "#C2410C", glow: "rgba(255,107,53,0.35)",  soft: "rgba(255,107,53,0.12)"  },
  { name: "Teal",     value: "#00C7BE", dark: "#0F766E", glow: "rgba(0,199,190,0.35)",   soft: "rgba(0,199,190,0.12)"   },
];