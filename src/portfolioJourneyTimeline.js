export const PROJECT_FIRST_CENTER_UNITS = 0.72;
export const PROJECT_HANDOFF_START_UNITS = 1.46;
export const PROJECT_HANDOFF_END_UNITS = 2.22;
export const STACK_DWELL_UNITS = 0.72;

// Keep the previous names available for callers outside the journey component.
export const PROJECT_RING_EXIT_START_UNITS = PROJECT_HANDOFF_START_UNITS;
export const PROJECT_RING_EXIT_END_UNITS = PROJECT_HANDOFF_END_UNITS;

export function getPortfolioJourneyMetrics() {
  const totalUnits = PROJECT_HANDOFF_END_UNITS + STACK_DWELL_UNITS;

  return {
    totalUnits,
    trackVh: Math.ceil((totalUnits + 2) * 100),
    handoffStart: PROJECT_HANDOFF_START_UNITS,
    handoffEnd: PROJECT_HANDOFF_END_UNITS,
    ringExitStart: PROJECT_HANDOFF_START_UNITS,
    ringExitEnd: PROJECT_HANDOFF_END_UNITS,
    waypoints: [
      { id: "projects", label: "作品", topVh: Math.round(PROJECT_FIRST_CENTER_UNITS * 100) },
      { id: "stack", label: "技术栈", topVh: Math.round(PROJECT_HANDOFF_END_UNITS * 100) },
    ],
  };
}
