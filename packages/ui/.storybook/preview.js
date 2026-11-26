import "../src/styles.css";

export default {
  parameters: {
    // Any axe violation fails the story in the catalog.
    a11y: { test: "error" },
    layout: "fullscreen",
  },
  globalTypes: {
    theme: {
      description: "Thème",
      toolbar: { icon: "contrast", items: [{ value: "system", title: "Système" }, { value: "light", title: "Clair" }, { value: "dark", title: "Sombre" }] },
    },
    direction: {
      description: "Sens du texte",
      toolbar: { icon: "transfer", items: ["ltr", "rtl"] },
    },
  },
  initialGlobals: { theme: "system", direction: "ltr" },
  decorators: [
    (Story, context) => {
      const root = document.documentElement;
      const theme = new URLSearchParams(location.search).get("theme") ?? context.globals.theme;
      if (theme === "light" || theme === "dark") root.dataset.theme = theme;
      else delete root.dataset.theme;
      root.dir = context.globals.direction ?? "ltr";
      root.lang = "fr";
      return Story();
    },
  ],
};
