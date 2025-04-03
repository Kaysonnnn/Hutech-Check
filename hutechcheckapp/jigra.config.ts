import { JigraConfig } from "@jigra/cli";

const config: JigraConfig = {
  appId: "com.hutechcheckin.scanner",
  appName: "HUTECH Checkins Scanner",
  webDir: "dist",
  bundledWebRuntime: true,
  server: {
    androidScheme: "https",
  },
};

export default config;
