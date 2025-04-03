import legacy from "@witejs/plugin-legacy";
import kdu from "@witejs/plugin-kdu";
import { WitePWA } from "wite-plugin-pwa";
import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "wite";

dotenv.config();

// https://witejs.web.app/config/
export default defineConfig({
  plugins: [
    kdu({
      // template: {
      //   compilerOptions: {
      //     isCustomElement: (tag) => {
      //       return tag.startsWith("fml-");
      //     },
      //   },
      // },
    }),
    legacy(),
    WitePWA({ registerType: "autoUpdate" }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  },
  build: {
    minify: true,
    cssMinify: true,
  },
});
