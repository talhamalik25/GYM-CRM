// Presentation-only probes for shared CSS, without accessing protected data.
import fs from "node:fs";
import { chromium } from "@playwright/test";
const unit = process.argv[2] || "shared-ui";
const dir = `test-results/tailwind-migration/${unit}`;
const mapping = JSON.parse(fs.readFileSync(`${dir}/classes.json`));
const cssBefore = fs.readFileSync("test-results/tailwind-migration/baseline/global-built.css", "utf8");
const cssAfter = fs.readdirSync(".next/static/chunks").filter(f => f.endsWith(".css")).map(f => fs.readFileSync(`.next/static/chunks/${f}`, "utf8")).find(s => s.includes("fitivo") || s.includes("--sidebar-width"));
if (!cssAfter) throw new Error("Missing compiled global CSS.");
const children = '<h1>Heading</h1><h2>Section</h2><h3>Title</h3><p>Example body <strong>Strong</strong> <small>Small</small></p><span>Label</span><button>Action</button><input placeholder="Placeholder"><a href="#">Link</a><svg width="20" height="20"><polyline points="0,10 10,0 20,10" /></svg>';
const html = Object.keys(mapping).filter(name => !process.argv[3] || new RegExp(process.argv[3]).test(name)).map(name => {
  let tag = "div", classes = name;
  if (/^ui-button/.test(name)) { tag = "button"; classes = "ui-button " + name; }
  if (/^ui-(input|search-input|search-clearable)/.test(name)) { tag = "input"; classes = "ui-input " + name; }
  if (name === "ui-select") tag = "select";
  if (/^ui-avatar-/.test(name)) classes = "ui-avatar " + name;
  if (/^ui-badge-/.test(name)) classes = "ui-badge " + name;
  if (/^ui-(stat-card|chart-card)/.test(name)) classes = "ui-card " + name;
  const content = tag === "input" ? "" : tag === "button" ? "Action" : tag === "select" ? "<option>Option</option>" : children;
  return `<section data-probe="${name}" style="padding:12px"><${tag} class="${classes}" ${tag === "input" ? 'placeholder="Placeholder"' : ""}>${content}${tag === "input" ? "" : `</${tag}>`}</section>`;
}).join("") + '<section data-probe="table"><table class="ui-table"><thead><tr><th>Column</th><th>Column</th></tr></thead><tbody><tr><td>Cell</td><td><span class="ui-badge ui-badge-success">Active</span></td></tr></tbody></table></section>';
const browser = await chromium.launch({ channel: "chrome", headless: true });
const differences = [];
try {
  for (const width of [375, 600, 760, 768, 1280]) {
    const captures = [];
    for (const [css, converted] of [[cssBefore, false], [cssAfter, true]]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      await page.setContent(`<html><head><style>${css}</style></head><body>${html}</body></html>`);
      if (converted) await page.evaluate(mapping => { for (const element of document.querySelectorAll("[class]")) element.className = element.getAttribute("class").split(/\s+/).map(name => mapping[name] || name).join(" "); }, mapping);
      await page.waitForTimeout(250);
      captures.push(await page.locator("[data-probe] *").evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element);
        const properties = ["display", "position", "width", "height", "min-width", "min-height", "max-width", "max-height", "margin", "padding", "gap", "color", "background-color", "border", "border-radius", "box-shadow", "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-align", "opacity", "overflow", "grid-template-columns", "flex", "align-items", "justify-content", "z-index"];
        const values = Object.fromEntries(properties.map(key => [key, style.getPropertyValue(key)]));
        return { probe: element.closest("[data-probe]").getAttribute("data-probe"), tag: element.tagName, values };
      })));
      await page.close();
    }
    captures[1].forEach((element, index) => { for (const [property, value] of Object.entries(element.values)) if (captures[0][index]?.values[property] !== value) differences.push({ width, probe: element.probe, tag: element.tag, index, property, before: captures[0][index]?.values[property], after: value }); });
  }
} finally { await browser.close(); }
fs.writeFileSync(`${dir}/probe-differences.json`, JSON.stringify(differences, null, 2));
console.log(JSON.stringify({ differences: differences.length, first: differences.slice(0, 25) }, null, 2));
if (differences.length) process.exitCode = 1;
