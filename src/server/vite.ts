import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

    const vite = await createViteServer({
      ...(typeof viteConfig === "function" ? viteConfig({ mode: "development", command: "serve" }) : viteConfig),
      configFile: false,
      server: serverOptions,
      appType: "custom",
    });

  app.use((req, res, next) => {
    // Skip vite middlewares for API routes
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    // Use vite middlewares for everything else
    vite.middlewares(req, res, next);
  });

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes - let them 404 if not found
    if (url.startsWith("/api")) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);

    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
