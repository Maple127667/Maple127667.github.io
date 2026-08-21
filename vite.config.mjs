import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createContentManifest } from "./src/content/markdown-build.js";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const articlesDirectory = path.join(rootDirectory, "src", "content", "articles");
const projectsDirectory = path.join(rootDirectory, "src", "content", "projects");
const contentDirectories = [articlesDirectory, projectsDirectory];
const contentManifestId = "virtual:portfolio-content-manifest";
const resolvedContentManifestId = `\0${contentManifestId}`;

function isContentMarkdown(file) {
  if (path.extname(file).toLowerCase() !== ".md") return false;
  const absoluteFile = path.resolve(file);
  return contentDirectories.some((directory) => {
    const relative = path.relative(directory, absoluteFile);
    return relative !== ""
      && !relative.startsWith(`..${path.sep}`)
      && relative !== ".."
      && !path.isAbsolute(relative);
  });
}

function contentManifestPlugin() {
  const invalidateManifest = (server) => {
    const manifestModule = server.moduleGraph.getModuleById(resolvedContentManifestId);
    if (manifestModule) server.moduleGraph.invalidateModule(manifestModule);
  };

  return {
    name: "portfolio-content-manifest",
    enforce: "pre",
    resolveId(source) {
      if (source === contentManifestId) return resolvedContentManifestId;
      return null;
    },
    load(id) {
      if (id !== resolvedContentManifestId) return null;
      const manifest = createContentManifest({ articlesDirectory, projectsDirectory });
      manifest.watchFiles.forEach((file) => this.addWatchFile(file));
      return [
        `export const articleManifest = ${JSON.stringify(manifest.articles)};`,
        `export const projectManifest = ${JSON.stringify(manifest.projects)};`,
      ].join("\n");
    },
    configureServer(server) {
      const reloadForStructureChange = (file) => {
        if (!isContentMarkdown(file)) return;
        invalidateManifest(server);
        server.ws.send({ type: "full-reload", path: "*" });
      };
      server.watcher.on("add", reloadForStructureChange);
      server.watcher.on("unlink", reloadForStructureChange);
      server.httpServer?.once("close", () => {
        server.watcher.off("add", reloadForStructureChange);
        server.watcher.off("unlink", reloadForStructureChange);
      });
    },
    handleHotUpdate({ file, server }) {
      if (!isContentMarkdown(file)) return undefined;
      invalidateManifest(server);
      server.ws.send({ type: "full-reload", path: "*" });
      return [];
    },
  };
}

export default defineConfig({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [contentManifestPlugin(), react()],
});
