import { JigraConfig } from "@jigra/cli";

const config: JigraConfig = {
  appId: "com.hutechcheckin.app",
  appName: "Hutech Checkin",
  webDir: "dist",
  bundledWebRuntime: true,
  server: {
    androidScheme: "https",
  },
};

export default config;
