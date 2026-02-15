import { nodeResolve } from "@rollup/plugin-node-resolve";
import rollupPluginTypescript from "@rollup/plugin-typescript";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import chokidar from "chokidar";
import { rollup, InputOptions, OutputOptions } from "rollup";
import { defineConfig, PluginOption } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const generateCode = async () => {
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
  return `self.addEventListener('install', (event) => {
  self.skipWaiting(); 
});
${output[0].code}`;
};

const compileTsServiceWorker = () => {
  const name = "compile-typescript-service-worker";
  const enforce = "pre";

  let watcher;

  return [
    {
      name: `${name}:build`,
      enforce,
      apply: "build",
      async generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "gym-sw.js",
          source: await generateCode(),
        });
      },
    },
    {
      name: `${name}:serve`,
      enforce,
      apply: "serve",
      async configureServer(server) {
        watcher = chokidar.watch("gym-sw.ts", {
          ignoreInitial: true,
        });
        watcher.on("change", () =>
          server.ws.send("gym:unregister-sw", {
            script: `
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      if (registration.active.scriptURL.endsWith('gym-sw.js')) {
        registration.update();
      }
    }
  });
}`,
          }),
        );
        // watcher.on("change", () => {
        //   server.ws.send({
        //     type: "full-reload",
        //   });
        // });

        server.middlewares.use(async (req, res, next) => {
          if (req.url === "/gym-sw.js") {
            res.writeHead(200, {
              "Content-Type": "application/javascript",
            });
            res.end(await generateCode());
          } else {
            next();
          }
        });
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
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("gym-sw.js")
    .then((registration) => {
      console.log("SW registered: ", registration);
    })
    .catch((registrationError) => {
      console.log("SW registration failed: ", registrationError);
    });
}
if (import.meta.hot) {
  import.meta.hot.on('gym:unregister-sw', (data) => {
    eval(data.script);      // Executes the script
  });
}`,
            },
          ],
        };
      },
      async closeBundle() {
        await watcher.close();
      },
    },
  ];
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [compileTsServiceWorker(), react(), tsconfigPaths(), tailwindcss()],
});
