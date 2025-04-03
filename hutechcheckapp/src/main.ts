import { createApp } from "kdu";
import App from "./App.kdu";
import router from "./router";
import store from "./store";

import { defineCustomElements } from "@familyjs/pwa-elements/loader";

import { FamilyKdu } from "@familyjs/kdu";

/* Core CSS required for Family components to work properly */
import "@familyjs/kdu/css/core.css";

/* Basic CSS for apps built with Family */
import "@familyjs/kdu/css/normalize.css";
import "@familyjs/kdu/css/structure.css";
import "@familyjs/kdu/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@familyjs/kdu/css/padding.css";
import "@familyjs/kdu/css/float-elements.css";
import "@familyjs/kdu/css/text-alignment.css";
import "@familyjs/kdu/css/text-transformation.css";
import "@familyjs/kdu/css/flex-utils.css";
import "@familyjs/kdu/css/display.css";

/* Theme variables */
import "./theme/variables.css";

const app = createApp(App).use(store).use(FamilyKdu).use(router);

app.config.compilerOptions.isCustomElement = (tag) => {
  return tag.startsWith("fml-");
};

router.isReady().then(() => {
  app.mount("#app");
});

// Call the element loader after the platform has been bootstrapped
defineCustomElements(window);
