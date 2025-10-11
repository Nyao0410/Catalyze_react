// Shared palette and helper to deterministically map a planId to a color.
const PALETTE = [
  '#FF6B6B', // red
  '#4ECDC4', // teal
  '#45B7D1', // blue
  '#FFA07A', // light orange
  '#98D8C8', // mint
  '#F7DC6F', // yellow
  '#BB8FCE', // purple
  '#85C1E2', // light blue
  '#F1948A',
  '#7FB3D5',
];

export function getColorForPlan(planId: string | number | undefined) {
  if (!planId) return PALETTE[0];
  const id = typeof planId === 'number' ? String(planId) : planId;
  // simple deterministic hash: sum of char codes
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}

export const PLAN_PALETTE = PALETTE;
