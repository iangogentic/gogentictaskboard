export const THEMES = {
  AURORA: { a: "rgba(120,119,198,.9)", b: "rgba(0,179,255,.6)" }, // blue/violet
  NEON_MINT: { a: "rgba(16,185,129,.9)", b: "rgba(34,211,238,.6)" }, // emerald/cyan
  SUNSET: { a: "rgba(251,146,60,.9)", b: "rgba(239,68,68,.6)" }, // orange/red
  ORCHID: { a: "rgba(168,85,247,.9)", b: "rgba(236,72,153,.6)" }, // purple/pink
} as const;

export type ThemeName = keyof typeof THEMES;

// Helper functions for building gradients
export function buildConic(a: string, b: string) {
  return `conic-gradient(from 210deg, ${a}, ${b}, rgba(255,255,255,.1), ${a})`;
}

export function buildRadial(color: string) {
  return `radial-gradient(ellipse at center, ${color}, transparent 60%)`;
}

export function buildGrid() {
  return "linear-gradient(to right, rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.14) 1px, transparent 1px)";
}
