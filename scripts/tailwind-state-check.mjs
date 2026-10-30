import fs from "node:fs";
import { chromium } from "@playwright/test";
const dir = "test-results/tailwind-migration/shared-ui";
const mapping = JSON.parse(fs.readFileSync(`${dir}/classes.json`));
const before = fs.readFileSync("test-results/tailwind-migration/baseline/global-built.css", "utf8");
const after = fs.readdirSync(".next/static/chunks").filter(f => f.endsWith(".css")).map(f => fs.readFileSync(`.next/static/chunks/${f}`, "utf8")).find(s => s.includes("--sidebar-width"));
const cases = [];
for (const variant of ["primary", "secondary", "ghost", "danger"]) for (const state of ["rest", "hover", "focus", "disabled", "aria-disabled"]) cases.push({ classes: `ui-button ui-button-${variant}`, tag: "button", state });
for (const name of ["ui-input", "ui-select"]) for (const state of ["rest", "hover", "focus", "disabled", "invalid"]) cases.push({ classes: name, tag: name === "ui-select" ? "select" : "input", state });
cases.push({ classes: "ui-input ui-input-error", tag: "input", state: "focus" }, { classes: "ui-tab", tag: "button", state: "selected" });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const differences = [];
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 900 }, reducedMotion: "reduce" });
  for (const test of cases) {
    const snapshots = [];
    for (const [css, migrated] of [[before, false], [after, true]]) {
      const classes = migrated ? test.classes.split(" ").map(name => mapping[name] || name).join(" ") : test.classes;
      await page.setContent(`<style>${css}</style><main style="padding:40px"><${test.tag} id="target">${test.tag === "input" ? "" : test.tag === "select" ? "<option>Option</option></select>" : "Button</button>"}</main>`);
      const target = page.locator("#target");
      await target.evaluate((element, { classes, state }) => {
        element.className = classes;
        if (state === "disabled") element.disabled = true;
        if (state === "aria-disabled") element.setAttribute("aria-disabled", "true");
        if (state === "invalid") element.setAttribute("aria-invalid", "true");
        if (state === "selected") element.setAttribute("aria-selected", "true");
      }, { classes, state: test.state });
      await page.mouse.move(0, 0);
      if (test.state === "hover") await target.hover();
      if (test.state === "focus") await target.focus();
      await page.waitForTimeout(200);
      snapshots.push(await target.evaluate(element => {
        const style = getComputedStyle(element);
        return Object.fromEntries(["width", "height", "padding", "background", "color", "border", "border-radius", "outline", "outline-offset", "box-shadow", "font-size", "font-weight", "opacity", "cursor"].map(key => [key, style.getPropertyValue(key)]));
      }));
    }
    for (const [property, value] of Object.entries(snapshots[1])) if (snapshots[0][property] !== value) differences.push({ ...test, property, before: snapshots[0][property], after: value });
  }
} finally { await browser.close(); }
fs.writeFileSync(`${dir}/state-differences.json`, JSON.stringify(differences, null, 2));
console.log(JSON.stringify({ cases: cases.length, differences }, null, 2));
if (differences.length) process.exitCode = 1;
