/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { qrcode } from "vite-plugin-qrcode";
import manifest from "./manifest";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
  },
  optimizeDeps: {
    include: ["workbox-window"],
    exclude: ["@vite-pwa/assets-generator"],
  },
  plugins: [
    react(),
    // Generate QR code for npm run dev:host
    qrcode({ filter: (url) => url.startsWith("http://192.168.0.") }),
    VitePWA({
      manifest,
      devOptions: {
        enabled: true,
        type: "module",
      },
      injectRegister: 'auto',
      registerType: "prompt",
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        // Use runtime caching for dynamic imports
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === "script" ||
              request.destination === "style" ||
              request.destination === "font" ||
              request.destination === "worker",
            handler: "CacheFirst",
            options: {
              cacheName: "dynamic-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "documents",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
      includeAssets: ["**/*"],
    }),
  ],
});
