export const projectTechnologyGroups = [
  { id: "intelligence", eyebrow: "AI / BEHAVIOR", title: "智能与行为" },
  { id: "retrieval", eyebrow: "SEARCH / STATE", title: "检索与状态" },
  { id: "runtime", eyebrow: "RUNTIME / MESSAGE", title: "应用与消息" },
  { id: "interface", eyebrow: "INTERFACE / VISUAL", title: "界面与视觉" },
  { id: "delivery", eyebrow: "DELIVERY / DX", title: "工程与协作" },
];

const technologyGroupByLabel = new Map([
  ["Evidence Trace", "intelligence"],
  ["Multi-Agent", "intelligence"],
  ["Chatbot Runtime", "intelligence"],
  ["Plugin Architecture", "intelligence"],
  ["Hybrid Retrieval", "retrieval"],
  ["SQLite FTS5", "retrieval"],
  ["Persistent State", "retrieval"],
  ["Python", "runtime"],
  ["FastAPI", "runtime"],
  ["Message Routing", "runtime"],
  ["Event Scheduling", "runtime"],
  ["Bot API", "runtime"],
  ["WebSocket", "runtime"],
  ["React", "interface"],
  ["Three.js", "interface"],
  ["WebGL", "interface"],
  ["PyQt", "interface"],
  ["Live2D", "interface"],
  ["Operations", "delivery"],
  ["Vite", "delivery"],
  ["Pytest", "delivery"],
  ["GitHub Actions", "delivery"],
  ["Documentation", "delivery"],
  ["Open Source", "delivery"],
]);

export function getTechnologyGroupId(label) {
  return technologyGroupByLabel.get(label) ?? "delivery";
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

  return [...collected.values()];
}
