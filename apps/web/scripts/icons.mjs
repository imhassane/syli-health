// Renders the PNG icons of the manifest (and the one Tauri derives its own
// from) from public/icon.svg, with Chrome.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const svg = readFileSync(new URL("../public/icon.svg", import.meta.url), "utf8");
// Maskable: the drop inside the 80% safe zone, the background to the edges.
const maskable = svg.replace('rx="28"', 'rx="0"').replace("translate(22 16) scale(.76)", "translate(31 26) scale(.6)");
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage();
for (const [name, size, source] of [
  ["icon-192.png", 192, svg],
  ["icon-512.png", 512, svg],
  ["icon-maskable-512.png", 512, maskable],
  ["../../desktop/src-tauri/app-icon.png", 1024, svg],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${source}`);
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, omitBackground: true });
}
await browser.close();
