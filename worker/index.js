const CONTENT_ROUTES = [];

const normalizePathname = (pathname) => pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

export function createWorker(routes = CONTENT_ROUTES) {
  const contentRoutes = new Set(routes.map(normalizePathname));

  return {
    async fetch(request, env) {
      const response = await env.ASSETS.fetch(request);
      const acceptsHtml = request.headers.get("accept")?.includes("text/html");

      if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
        return response;
      }

      const requestUrl = new URL(request.url);
      const requestedPath = normalizePathname(requestUrl.pathname);
      const indexUrl = new URL(request.url);
      indexUrl.pathname = "/index.html";
      indexUrl.search = "";
      const appShell = await env.ASSETS.fetch(new Request(indexUrl, request));

      if (contentRoutes.has(requestedPath)) return appShell;

      const headers = new Headers(appShell.headers);
      headers.set("x-robots-tag", "noindex");
      return new Response(request.method === "HEAD" ? null : appShell.body, {
        status: 404,
        statusText: "Not Found",
        headers,
      });
    },
  };
}

export default createWorker();