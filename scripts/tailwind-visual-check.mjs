// Local, database-free visual checks. Baselines and PNGs stay in ignored test-results.
import fs from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";
const require = createRequire(import.meta.url);
const { PNG } = require("../node_modules/playwright-core/lib/utilsBundle.js");
const mode = process.argv[2] || "check";
const routes = process.argv.slice(3);
const paths = routes.length ? routes : ["/", "/features", "/pricing", "/demo", "/guide", "/about", "/contact", "/free-trial", "/payment", "/login", "/register", "/privacy", "/terms", "/staff/accept"];
const root = "test-results/tailwind-migration";
fs.mkdirSync(`${root}/${mode}`, { recursive: true });
const port = 3115;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: { ...process.env, MONGODB_URI: "", MONGODB_TEST_URI: "", PUBLIC_REGISTRATION_ENABLED: "false", PUBLIC_TRIAL_PLAN_ID: "" },
  windowsHide: true, stdio: ["ignore", "ignore", "pipe"],
});
let serverError = "";
server.stderr.on("data", chunk => { serverError += chunk; });
let browser;
const results = [];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(serverError || "Preview server exited.");
    try { ready = (await fetch(`http://127.0.0.1:${port}/login`)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error("Preview server did not start.");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ reducedMotion: "reduce", deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const route of paths) {
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: "networkidle" });
      if (response.status() !== 200) throw new Error(`${route}: HTTP ${response.status()}`);
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: "* { caret-color: transparent !important; }" });
      const name = `${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}-${width}`;
      const current = `${root}/${mode}/${name}`;
      await page.screenshot({ path: `${current}.png`, fullPage: true, animations: "disabled" });
      const computed = await page.locator("body *:not(script):not(style):not(next-route-announcer)").evaluateAll(elements => {
        const props = ["display", "position", "width", "height", "margin", "padding", "gap", "color", "backgroundColor", "backgroundImage", "border", "borderRadius", "boxShadow", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textAlign", "overflow", "opacity", "transform", "gridTemplateColumns", "alignItems", "justifyContent", "zIndex"];
        return elements.map(element => { const style = getComputedStyle(element); return { tag: element.tagName, props: Object.fromEntries(props.map(prop => [prop, style[prop]])) }; });
      });
      fs.writeFileSync(`${current}.json`, JSON.stringify(computed));
      if (mode !== "baseline") {
        const before = PNG.sync.read(fs.readFileSync(`${root}/baseline/${name}.png`));
        const after = PNG.sync.read(fs.readFileSync(`${current}.png`));
        let pixels = 0;
        if (before.width !== after.width || before.height !== after.height) pixels = -1;
        else for (let i = 0; i < before.data.length; i += 4) if (!before.data.subarray(i, i + 4).equals(after.data.subarray(i, i + 4))) pixels++;
        const oldStyles = JSON.parse(fs.readFileSync(`${root}/baseline/${name}.json`));
        const differences = computed.flatMap((element, i) => Object.entries(element.props).filter(([key, value]) => oldStyles[i]?.props[key] !== value).map(([key, value]) => ({ index: i, tag: element.tag, property: key, before: oldStyles[i]?.props[key], after: value })));
        results.push({ name, pixels, beforeSize: [before.width, before.height], afterSize: [after.width, after.height], styleDifferences: differences.length });
        if (pixels || differences.length) fs.writeFileSync(`${current}.diff.json`, JSON.stringify(differences, null, 2));
        console.log(`${name}: ${pixels === 0 ? "identical" : `${pixels} changed pixels`}; ${differences.length} computed-style differences`);
      } else console.log(`${name}: baseline captured`);
    }
  }
  fs.writeFileSync(`${root}/${mode}/results.json`, JSON.stringify({ results, errors }, null, 2));
  if (errors.length || results.some(item => item.pixels !== 0)) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill();
}
