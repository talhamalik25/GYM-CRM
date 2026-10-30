// Render real presentation components with inert router contexts. No route guards,
// database sessions, effects, API calls or production records are involved.
import fs from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
const require = createRequire(import.meta.url);
const swc = require("next/dist/build/swc");
await swc.loadBindings();
const workspace = process.cwd().replaceAll("\\", "/");
registerHooks({ load(url, context, next) {
  if (url.startsWith("file:")) {
    const file = fileURLToPath(url).replaceAll("\\", "/");
    if ((file.startsWith(workspace + "/components/") || file.startsWith(workspace + "/lib/")) && file.endsWith(".js")) return { format: "commonjs", source: swc.transformSync(fs.readFileSync(file, "utf8"), { filename: file, jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } }, target: "es2022" }, module: { type: "commonjs" } }).code, shortCircuit: true };
  }
  return next(url, context);
} });
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { AppRouterContext } = require("next/dist/shared/lib/app-router-context.shared-runtime");
const { PathnameContext, SearchParamsContext } = require("next/dist/shared/lib/hooks-client-context.shared-runtime");
const { PNG } = require("../node_modules/playwright-core/lib/utilsBundle.js");
const Shell = require("../components/layout/dashboard-shell.js").default;
const h = React.createElement;
const units = {
  shell: [null, {}],
  dashboard: ["dashboard/owner-dashboard.js", {}],
  members: ["members/member-manager.js", {}],
  "member-form": ["members/member-form.js", {}],
  "member-detail": ["members/member-detail.js", { memberId: "preview" }],
  memberships: ["memberships/membership-manager.js", {}],
  "membership-record": ["memberships/membership-record.js", { id: "preview" }],
  plans: ["plans/plans-manager.js", {}],
  trainers: ["trainers/trainer-manager.js", {}],
  "trainer-form": ["trainers/trainer-form.js", { initialDate: "2026-10-29" }],
  "trainer-detail": ["trainers/trainer-detail.js", { trainerId: "preview" }],
  trainer: ["trainers/trainer-workspace.js", {}],
  staff: ["staff/staff-manager.js", {}],
  attendance: ["attendance/attendance-manager.js", {}],
  payments: ["payments/payments-manager.js", {}],
  billing: ["billing/owner-billing.js", {}],
  reports: ["reports/reports-manager.js", {}],
  settings: ["settings/gym-settings.js", {}],
  profile: ["account/owner-profile.js", {}],
  branches: ["branches/branch-manager.js", {}],
  admin: ["admin/admin-overview.js", {}],
  "admin-gyms": ["admin/admin-gym-manager.js", {}],
  "admin-gym": ["admin/admin-gym-details.js", { gymId: "preview" }],
  "admin-users": ["admin/admin-user-manager.js", {}],
  "admin-billing": ["admin/admin-billing-manager.js", {}],
};
const selected = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(units);
const folder = "test-results/tailwind-migration/workspaces";
fs.mkdirSync(folder, { recursive: true });
const beforeCSS = fs.readFileSync("test-results/tailwind-migration/baseline/global-built.css", "utf8");
const sheets = fs.readdirSync(".next/static/chunks").filter(file => file.endsWith(".css")).map(file => fs.readFileSync(`.next/static/chunks/${file}`, "utf8"));
const afterCSS = sheets.find(sheet => sheet.includes("--sidebar-width"));
const fontSheet = sheets.find(sheet => sheet.includes("@font-face")) || "";
const faces = [...fontSheet.matchAll(/@font-face\{[^}]*\}/g)].map(match => match[0]);
const fontCSS = faces.filter(face => /font-family:Inter[;}]/.test(face)).map(face => face.replace(/url\((?:\.\.\/)?media\/([^)]*)\)/g, (_, file) => `url(data:font/woff2;base64,${fs.readFileSync(`.next/static/media/${file}`).toString("base64")})`)).join("");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const name of selected) {
    const [file, props] = units[name];
    const Component = file ? require(`../components/${file}`).default : null;
    const body = Component ? h(Component, props) : h("section", { className: "page-heading" }, h("div", null, h("h1", null, "Workspace preview"), h("p", null, "Presentation fixture — no account data.")));
    const router = { push() {}, replace() {}, refresh() {}, prefetch() {} };
    const html = renderToStaticMarkup(h(AppRouterContext.Provider, { value: router }, h(PathnameContext.Provider, { value: name === "shell" ? "/dashboard" : "/" + name.replaceAll("-", "/") }, h(SearchParamsContext.Provider, { value: new URLSearchParams() }, h(Shell, { canManageStaff: !name.startsWith("admin"), isSuperadmin: name.startsWith("admin"), isTrainer: name === "trainer", accountEmail: "preview@example.test" }, body)))));
    for (const width of [375, 768, 1280]) {
      const snapshots = [];
      for (const [mode, css] of [["before", beforeCSS], ["after", afterCSS]]) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
        await page.setContent(`<html><head><style>${fontCSS}\n${css}</style></head><body>${html}</body></html>`);
        if (mode === "before") await page.evaluate(() => { for (const element of document.querySelectorAll("[class]")) element.setAttribute("class", element.getAttribute("class").split(/\s+/).filter(name => !name.startsWith("exact:")).join(" ")); });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(250);
        const image = await page.screenshot({ path: `${folder}/${name}-${width}-${mode}.png`, fullPage: true, animations: "disabled" });
        const styles = await page.locator("body *").evaluateAll(elements => elements.map(element => {
          const style = getComputedStyle(element);
          return Object.fromEntries(["display", "position", "width", "height", "padding", "margin", "gap", "color", "background", "border", "border-radius", "font-size", "font-weight", "line-height", "letter-spacing", "box-shadow", "overflow", "opacity", "z-index"].map(key => [key, style.getPropertyValue(key)]));
        }));
        snapshots.push({ image: PNG.sync.read(image), styles });
        await page.close();
      }
      const [before, after] = snapshots;
      const differences = after.styles.flatMap((style, index) => Object.entries(style).filter(([key, value]) => before.styles[index]?.[key] !== value).map(([property, value]) => ({ index, property, before: before.styles[index]?.[property], after: value })));
      let pixels = 0;
      if (before.image.width !== after.image.width || before.image.height !== after.image.height) pixels = -1;
      else for (let i = 0; i < before.image.data.length; i += 4) if (!before.image.data.subarray(i, i + 4).equals(after.image.data.subarray(i, i + 4))) pixels++;
      fs.writeFileSync(`${folder}/${name}-${width}.diff.json`, JSON.stringify(differences, null, 2));
      results.push({ name, width, pixels, differences: differences.length });
      console.log(`${name}-${width}: ${pixels} changed pixels; ${differences.length} style differences`);
    }
  }
} finally { await browser.close(); }
fs.writeFileSync(`${folder}/results.json`, JSON.stringify(results, null, 2));
if (results.some(result => result.pixels || result.differences)) process.exitCode = 1;
