import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/eight/" : "",
  plugins: [
    preact({
      prerender: {
        enabled: true,
        renderTarget: "#app",
      },
    }),
    VitePWA({
      manifest: {
        short_name: "Eye Exercises",
        name: "Eye Exercise App",
        icons: [
          {
            src: "/icon-192.png",
            type: "image/png",
            sizes: "192x192",
          },
          {
            src: "/icon-512.png",
            type: "image/png",
            sizes: "512x512",
          },
        ],
        //   "start_url": "/",
        //   "background_color": "#3367D6",
        //   "display": "standalone",
        scope: "/",
        //   "theme_color": "#3367D6"
      },
      includeAssets: ["sounds/*.wav", "announcements/*.mp3", "vite.svg"],
      // devOptions: {
      //   enabled: true,
      // },
    }),
  ],
});
