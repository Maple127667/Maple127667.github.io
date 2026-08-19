export const PROJECT_FIRST_CENTER_UNITS = 0.72;
export const PROJECT_RING_EXIT_START_UNITS = 1.5;
export const PROJECT_RING_EXIT_END_UNITS = 1.9;
export const STACK_DWELL_UNITS = 0.84;

export function getPortfolioJourneyMetrics() {
  const totalUnits = PROJECT_RING_EXIT_END_UNITS + STACK_DWELL_UNITS;

  return {
    totalUnits,
    trackVh: Math.ceil((totalUnits + 1) * 100),
    ringExitStart: PROJECT_RING_EXIT_START_UNITS,
    ringExitEnd: PROJECT_RING_EXIT_END_UNITS,
    waypoints: [
      { id: "projects", label: "作品", topVh: Math.round(PROJECT_FIRST_CENTER_UNITS * 100) },
      { id: "stack", label: "技术栈", topVh: Math.round((PROJECT_RING_EXIT_START_UNITS + 0.32) * 100) },
    ],
  };
}
