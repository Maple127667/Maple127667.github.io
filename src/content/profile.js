export const profile = {
  name: "Maple",
  role: "Creative Developer",
  heroStatement: ["设计、代码与数字叙事。", "我做作品，也记录它们如何发生。"],
  headline: ["设计是起点，", "代码让它发生。"],
  summary: "我是 Maple，一名专注于 AI 应用与 Agent 系统的创意型工程师。我擅长使用 Python、TypeScript 与现代 Web 技术，把模型能力、工具调用、检索、消息系统和前后端界面整合成可运行、可维护、可交付的软件产品。我既关注底层机制与工程质量，也重视开发者体验、技术文档和开源协作，喜欢从模糊的想法出发，落地为真正能够被使用、被理解并持续扩展的工程。",
  availability: "AVAILABLE FOR SELECTED PROJECTS",
  location: "BASED IN CHINA",
  email: "1276679255@qq.com",
  wechat: {
    label: "Maple127667",
    qr: "/assets/contact/wechat-maple127667.jpg",
  },
  github: {
    label: "Maple127667",
    url: "https://github.com/Maple127667",
  },
};

export const technologyGroups = [
  { index: "01", label: "AI / AGENT", title: "Agent 系统", skills: ["Model APIs / Streaming", "Tool Calling / ReAct", "MCP / Multi-Agent", "Context / Trace"] },
  { index: "02", label: "RAG / SEARCH", title: "检索与文档智能", skills: ["Hybrid Retrieval", "SQLite FTS5", "Evidence / Citation", "File Normalization"] },
  { index: "03", label: "PYTHON / ASYNC", title: "应用后端", skills: ["Python 3.10–3.12", "FastAPI / Pydantic", "asyncio / httpx", "SQLAlchemy / SQLModel"] },
  { index: "04", label: "TYPESCRIPT / WEB", title: "全栈产品", skills: ["TypeScript / ESM", "React / Vue 3", "Hono / WebSocket", "Drizzle / Zod"] },
  { index: "05", label: "DELIVERY / DX", title: "工程与生态", skills: ["Vite / VitePress", "Pytest / Ruff", "Docker / Compose", "GitHub Actions / Docs"] },
];

export const technologyGroupsEn = [
  { index: "01", label: "AI / AGENT", title: "Agent Systems", skills: ["Model APIs / Streaming", "Tool Calling / ReAct", "MCP / Multi-Agent", "Context / Trace"] },
  { index: "02", label: "RAG / SEARCH", title: "Retrieval & Doc Intelligence", skills: ["Hybrid Retrieval", "SQLite FTS5", "Evidence / Citation", "File Normalization"] },
  { index: "03", label: "PYTHON / ASYNC", title: "Application Backend", skills: ["Python 3.10–3.12", "FastAPI / Pydantic", "asyncio / httpx", "SQLAlchemy / SQLModel"] },
  { index: "04", label: "TYPESCRIPT / WEB", title: "Full-Stack Product", skills: ["TypeScript / ESM", "React / Vue 3", "Hono / WebSocket", "Drizzle / Zod"] },
  { index: "05", label: "DELIVERY / DX", title: "Engineering & Ecosystem", skills: ["Vite / VitePress", "Pytest / Ruff", "Docker / Compose", "GitHub Actions / Docs"] },
];

export const profileEn = {
  heroStatement: ["Design, code, and digital narrative.", "I make the work, and document how it happens."],
  headline: ["Design is the start.", "Code makes it happen."],
  summary: "I'm Maple, a creative engineer focused on AI applications and agent systems. I work with Python, TypeScript, and modern web technologies, combining model capabilities, tool calling, retrieval, messaging systems, and front/back-end interfaces into software that runs, stays maintainable, and ships. I care about underlying mechanisms and engineering quality as much as developer experience, technical documentation, and open-source collaboration, and I enjoy turning vague ideas into software that can actually be used, understood, and extended over time.",
  technologyGroups: technologyGroupsEn,
};
