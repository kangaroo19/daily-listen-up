import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "daily-english-listening",
  brand: {
    displayName: "오늘의 리스닝",
    primaryColor: "#3182F6",
    icon: "https://static.toss.im/appsintoss/31257/40536143-4fab-4918-b05c-9b8d076b1299.png",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite --host",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
