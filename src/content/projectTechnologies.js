export const projectTechnologyGroups = [
  { id: "agent", eyebrow: "AGENT / INTELLIGENCE", title: "Agent 与智能系统" },
  { id: "knowledge", eyebrow: "SEARCH / MEMORY", title: "检索、数据与记忆" },
  { id: "interface", eyebrow: "INTERFACE / RENDERING", title: "界面、交互与渲染" },
  { id: "language", eyebrow: "LANGUAGE / RUNTIME", title: "语言与运行时" },
  { id: "integration", eyebrow: "SYSTEM / INTEGRATION", title: "系统工程与集成" },
];

const technologyGroupByLabel = new Map([
  ["LLM Agent", "agent"],
  ["ClaimGate", "agent"],
  ["A_Memorix", "agent"],
  ["NoneBot2", "agent"],
  ["SQLite FTS5", "knowledge"],
  ["Hybrid Retrieval", "knowledge"],
  ["Weighted RRF", "knowledge"],
  ["Python", "language"],
  ["JavaScript", "language"],
  ["TypeScript", "language"],
  ["React Dashboard", "interface"],
  ["React 19", "interface"],
  ["React", "interface"],
  ["Three.js", "interface"],
  ["WebGL", "interface"],
  ["PyQt5 UI", "interface"],
  ["Live2D / PyOpenGL", "interface"],
  ["Three-body Physics", "interface"],
  ["Native Scroll", "interface"],
  ["SealDice", "integration"],
  ["LLoneBot", "integration"],
  ["qasync", "integration"],
  ["WebSocket", "integration"],
  ["Modular Monolith", "integration"],
  ["Split Deployment", "integration"],
  ["IPC Plugin Runtime", "integration"],
  ["Renderer Abstraction", "integration"],
]);

const technologyOrderByLabel = new Map([
  ["LLM Agent", 0],
  ["ClaimGate", 1],
  ["A_Memorix", 2],
  ["NoneBot2", 3],
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
