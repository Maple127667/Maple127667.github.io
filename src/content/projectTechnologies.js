export const projectTechnologyGroups = [
  { id: "agent", eyebrow: "AGENT SYSTEMS", title: "Agent 系统" },
  { id: "knowledge", eyebrow: "RETRIEVAL / MEMORY", title: "检索、索引与记忆" },
  { id: "interface", eyebrow: "INTERACTION / MULTIMODAL", title: "交互、渲染与多模态" },
  { id: "language", eyebrow: "PROGRAMMING LANGUAGES", title: "编程语言" },
  { id: "integration", eyebrow: "ARCHITECTURE / INTEGRATION", title: "架构与系统集成" },
];

const technologyGroupByLabel = new Map([
  ["LLM Agent", "agent"],
  ["Planner", "agent"],
  ["Multi-Round Tool Calling", "agent"],
  ["Intent Evaluation", "agent"],
  ["ClaimGate", "agent"],
  ["A_Memorix", "knowledge"],
  ["SQLite FTS5", "knowledge"],
  ["Hybrid Retrieval", "knowledge"],
  ["Weighted RRF", "knowledge"],
  ["Python", "language"],
  ["JavaScript", "language"],
  ["TypeScript", "language"],
  ["React 19", "interface"],
  ["React", "interface"],
  ["Three.js", "interface"],
  ["WebGL", "interface"],
  ["React Markdown", "interface"],
  ["PyQt5", "interface"],
  ["Live2D", "interface"],
  ["PyOpenGL", "interface"],
  ["ASR", "interface"],
  ["TTS", "interface"],
  ["NoneBot2", "integration"],
  ["SealDice", "integration"],
  ["LLoneBot", "integration"],
  ["OneBot 11", "integration"],
  ["qasync", "integration"],
  ["WebSocket", "integration"],
  ["Vite 6", "integration"],
  ["Modular Monolith", "integration"],
  ["IPC Plugin Runtime", "integration"],
  ["Streaming Pipeline", "integration"],
]);

const personalTechnologyCapabilities = [
  { label: "Intent Evaluation", groupId: "agent" },
  { label: "ASR", groupId: "interface" },
  { label: "TTS", groupId: "interface" },
  { label: "Streaming Pipeline", groupId: "integration" },
];

const technologyOrderByLabel = new Map([
  ["LLM Agent", 0],
  ["Planner", 1],
  ["Multi-Round Tool Calling", 2],
  ["Intent Evaluation", 3],
  ["ClaimGate", 4],
]);

const technologyGroupOrderById = new Map(
  projectTechnologyGroups.map((group, index) => [group.id, index]),
);

export function getTechnologyGroupId(label) {
  return technologyGroupByLabel.get(label) ?? "integration";
}

export function collectProjectTechnologies(projects) {
  const collected = new Map();

  projects.forEach((project, projectIndex) => {
    project.technologies.forEach((label, technologyIndex) => {
      const normalizedId = label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const current = collected.get(label) ?? {
        id: normalizedId || `technology-${collected.size + 1}`,
        label,
        groupId: getTechnologyGroupId(label),
        sources: [],
        firstProjectIndex: projectIndex,
        firstTechnologyIndex: technologyIndex,
      };
      current.sources.push(project.id);
      collected.set(label, current);
    });
  });

  personalTechnologyCapabilities.forEach((capability, capabilityIndex) => {
    if (collected.has(capability.label)) return;
    const normalizedId = capability.label
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    collected.set(capability.label, {
      id: normalizedId || `capability-${capabilityIndex + 1}`,
      label: capability.label,
      groupId: capability.groupId,
      kind: "capability",
      sources: [],
      firstProjectIndex: projects.length,
      firstTechnologyIndex: capabilityIndex,
    });
  });

  return [...collected.values()].sort((left, right) => {
    const groupOrder = (technologyGroupOrderById.get(left.groupId) ?? Number.MAX_SAFE_INTEGER)
      - (technologyGroupOrderById.get(right.groupId) ?? Number.MAX_SAFE_INTEGER);
    if (groupOrder !== 0) return groupOrder;
    const leftOrder = technologyOrderByLabel.get(left.label) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = technologyOrderByLabel.get(right.label) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder
      || left.firstProjectIndex - right.firstProjectIndex
      || left.firstTechnologyIndex - right.firstTechnologyIndex;
  });
}
