import { nodeResolve } from "@rollup/plugin-node-resolve";
import rollupPluginTypescript from "@rollup/plugin-typescript";
import chokidar from "chokidar";
import { rollup } from "rollup";

const PRECACHE_PLACEHOLDER = '["__SELF_PRECACHE_ASSETS__"]';

const HASHED_ASSET_RE =
  /^assets\/.+-[A-Za-z0-9_-]{6,}\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|svg|ico)$/;

const generateCode = async (precacheAssets = []) => {
  const inputOptions = {
    input: "gym-sw.ts",
    plugins: [
      rollupPluginTypescript({
        tsconfig: "./tsconfig.sw.json",
      }),
      nodeResolve(),
    ],
  };
  const outputOptions = {
    file: "dist/gym-sw.js",
    format: "es",
  };

  const bundle = await rollup(inputOptions);
  const { output } = await bundle.generate(outputOptions);
  let code = output[0].code;

  if (!code.includes(PRECACHE_PLACEHOLDER)) {
    throw new Error(
      `[compile-ts-service-worker]: missing placeholder ${PRECACHE_PLACEHOLDER}`,
    );
  }

  code = code.replace(PRECACHE_PLACEHOLDER, JSON.stringify(precacheAssets));

  return `self.addEventListener('install', (event) => {
  self.skipWaiting(); 
});
${code}`;
};

function collectPrecacheAssets(bundle) {
  return Object.keys(bundle)
    .filter((fileName) => HASHED_ASSET_RE.test(fileName))
    .map((fileName) => `/${fileName}`)
    .sort();
}

const name = "compile-typescript-service-worker";
const enforce = "pre";

export const compileTsServiceWorker = () => {
  let watcher;

  return [
    {
      name: `${name}:build`,
      // After Vite emits app chunks so we can precache them.
      enforce: "post",
      apply: "build",
      async generateBundle(_options, bundle) {
        console.log("[compile-ts-service-worker]: build started");
        const precacheAssets = collectPrecacheAssets(bundle);
        console.log(
          "[compile-ts-service-worker]: precache assets",
          precacheAssets.length,
        );
        const file = this.emitFile({
          type: "asset",
          fileName: "gym-sw.js",
          source: await generateCode(precacheAssets),
        });
        console.log("[compile-ts-service-worker]: file emitted", file);
        console.log("[compile-ts-service-worker]: build finished");
      },
    },
    {
      name: `${name}:serve`,
      enforce,
      apply: "serve",
      async configureServer(server) {
        // Dev: do not serve/register SW. Only help clear leftovers on gym-sw.ts edits.
        watcher = chokidar.watch("gym-sw.ts", {
          ignoreInitial: true,
        });
        watcher.on("change", () =>
          server.ws.send("gym:unregister-sw", {
            script: `
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}`,
          }),
        );
      },
      transformIndexHtml(html) {
        return {
          html,
          tags: [
            {
              tag: "script",
              injectTo: "head",
              attrs: { type: "module" },
              children: `
if (import.meta.hot) {
  import.meta.hot.on('gym:unregister-sw', (data) => {
    eval(data.script);
  });
}`,
            },
          ],
        };
      },
      async closeBundle() {
        await watcher?.close();
      },
    },
  ];
};
