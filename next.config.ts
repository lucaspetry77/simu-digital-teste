import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // existe um package-lock.json na pasta do usuário; fixamos a raiz no projeto
    root: path.join(__dirname),
    rules: {
      "*.css": {
        // CSS Modules (componentes do Arc UI) seguem o pipeline padrão do Next
        condition: { not: { path: "*.module.css" } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
