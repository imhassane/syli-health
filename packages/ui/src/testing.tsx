import axe from "axe-core";

type StoriesModule = {
  default: { component: (args: never) => preact.JSX.Element; args?: object };
  [story: string]: unknown;
};

/** Every story of a stories file, as components rendering it with its args. */
export function storiesOf(stories: StoriesModule) {
  const { component: Component, args } = stories.default;
  const Any = Component as unknown as (props: object) => preact.JSX.Element;
  return Object.entries(stories)
    .filter(([name]) => name !== "default")
    .map(([name, story]) => {
      const s = story as { args?: object; render?: (args: object) => preact.JSX.Element };
      const all = { ...args, ...s.args };
      return [name, () => (s.render ? s.render(all) : <Any {...all} />)] as const;
    });
}

/** One story by name. */
export function story(stories: StoriesModule, name: string) {
  const found = storiesOf(stories).find(([storyName]) => storyName === name);
  if (!found) throw new Error(`No story ${name}`);
  return found[1];
}

/**
 * axe violations of WCAG 2.2 AA. jsdom cannot compute colours: contrast is
 * checked on the built catalog, in Chromium (e2e/stories.spec.js).
 */
export async function violations(container: Element) {
  const results = await axe.run(container, {
    runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((n) => n.target).join(", ")}`);
}
