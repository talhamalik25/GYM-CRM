// One-time, conservative source migration. Review and verify each generated unit.
// It preserves literal values and state selectors; it never edits application logic.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import postcss from "postcss";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
const traverse = traverseModule.default;
const [file, pattern, label = "unit"] = process.argv.slice(2);
if (!file || !pattern) throw new Error("Usage: node scripts/migrate-css-unit.mjs stylesheet anchor-regexp unit-name");
const include = new RegExp(pattern);
const original = fs.readFileSync(file, "utf8");
const isModule = file.endsWith(".module.css");
const namespace = isModule ? `m-${path.basename(file, ".module.css")}-` : "";
const root = postcss.parse(original);
const keyframes = [];
if (isModule) root.walkAtRules(/keyframes$/, rule => {
  keyframes.push({ name: rule.params, renamed: namespace + rule.params, css: rule.clone({ params: namespace + rule.params }).toString() });
  rule.remove();
});
const groups = new Map();
const media = new Map();
let index = 0;
const excluded = [];
const normalize = selector => selector.trim().replace(/\s*([>+~])\s*/g, "$1").replace(/\s+/g, " ");
const encode = value => value.replace(/"([^"']*)"/g, "'$1'").replaceAll("_", "\\_").replace(/\s+/g, "_");
function frames(node) {
  const result = [];
  for (let p = node.parent; p && p.type !== "root"; p = p.parent) {
    if (p.type !== "atrule" || p.name !== "media" || p.params === "print") return null;
    result.unshift(p.params.replace(/\s*:\s*/g, ":"));
  }
  return result;
}
const rules = [];
root.walkRules(rule => rules.push(rule));
for (const rule of rules) {
  const conditions = frames(rule);
  if (!conditions) continue;
  const remaining = [];
  for (const raw of postcss.list.comma(rule.selector)) {
    const selector = normalize(raw);
    const anchor = selector.match(/^\.([\w-]+)/)?.[1];
    if (!anchor || !include.test(anchor) || rule.nodes.some(node => node.type !== "decl" && node.type !== "comment")) { remaining.push(raw); continue; }
    // URLs/data URIs and nested CSS stay available for a deliberate manual pass.
    if (rule.nodes.some(node => node.type === "decl" && /url\(/.test(node.value))) { remaining.push(raw); excluded.push(selector); continue; }
    const key = JSON.stringify([selector, conditions]);
    const group = groups.get(key) || { selector, anchor, conditions, declarations: [] };
    for (const declaration of rule.nodes.filter(node => node.type === "decl")) group.declarations.push({ property: declaration.prop, value: declaration.value, important: Boolean(declaration.important), index: index++ });
    groups.set(key, group);
    for (const condition of conditions) if (!media.has(condition)) {
      const max = condition.match(/^\(max-width:(\d+)px\)$/);
      const min = condition.match(/^\(min-width:(\d+)px\)$/);
      media.set(condition, max ? `at-most-${max[1]}` : min ? `at-least-${min[1]}` : condition === "(prefers-reduced-motion:reduce)" ? "less-motion" : null);
    }
  }
  if (remaining.length) rule.selector = remaining.join(",\n");
  else rule.remove();
}
function resets(later, earlier) {
  if (later === earlier) return true;
  if (later === "border" && earlier.includes("radius")) return false;
  if (["padding", "margin", "border", "background", "font", "animation", "transition", "outline", "flex", "grid"].includes(later)) return earlier.startsWith(later + "-");
  return false;
}
// Remove declarations superseded by a later rule of the same specificity and
// selector, including unconditional rules that originally followed media rules.
for (const group of groups.values()) {
  group.declarations = group.declarations.filter(declaration => ![...groups.values()].some(other => other.selector === group.selector && (!other.conditions.length || JSON.stringify(other.conditions) === JSON.stringify(group.conditions)) && other.declarations.some(later => later.index > declaration.index && (later.important || !declaration.important) && resets(later.property, declaration.property))));
}
const utilities = {};
const simple = { "display:flex": "flex", "display:grid": "grid", "display:block": "block", "display:none": "hidden", "display:inline-flex": "inline-flex", "display:inline-grid": "inline-grid", "position:relative": "relative", "position:absolute": "absolute", "position:fixed": "fixed", "position:sticky": "sticky", "align-items:center": "items-center", "justify-content:center": "justify-center", "flex-direction:column": "flex-col", "flex-wrap:wrap": "flex-wrap", "overflow:hidden": "overflow-hidden", "text-align:center": "text-center", "cursor:pointer": "cursor-pointer" };
for (const group of groups.values()) {
  let suffix = group.selector.slice(group.anchor.length + 1);
  if (isModule) suffix = suffix.replace(/:global\(([^)]+)\)/g, "$1").replace(/\.([a-zA-Z_][\w-]*)/g, (_, name) => name.startsWith("ui-") ? `.${name}` : `.${namespace}${name}`);
  const variants = group.conditions.map(condition => media.get(condition) ? media.get(condition) + ":" : `[@media${encode(condition)}]:`).join("") + (suffix ? `[&${encode(suffix)}]:` : "");
  const classes = group.declarations.map(({ property, value, important }) => {
    if (property.startsWith("animation")) for (const frame of keyframes) value = value.replace(new RegExp(`\\b${frame.name}\\b`, "g"), frame.renamed);
    return `exact:${variants}${simple[`${property}:${value}`] || `[${property}:${encode(value)}]`}${important ? "!" : ""}`;
  });
  utilities[group.anchor] = [...(utilities[group.anchor] || []), ...classes];
}
const mapping = Object.fromEntries(Object.entries(utilities).map(([key, classes]) => [key, [namespace + key, ...new Set(classes)].join(" ")]));
if (isModule) postcss.parse(original).walkRules(rule => {
  for (const [, name] of rule.selector.matchAll(/\.([a-zA-Z_][\w-]*)/g)) if (!mapping[name]) mapping[name] = namespace + name;
});
const files = execFileSync("rg", ["--files", "app", "components"], { encoding: "utf8" }).trim().split(/\r?\n/).filter(name => /\.jsx?$/.test(name));
const changed = [];
for (const name of files) {
  const source = fs.readFileSync(name, "utf8");
  const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
  const edits = [];
  const aliases = new Set();
  if (isModule) for (const node of ast.program.body) if (node.type === "ImportDeclaration" && path.resolve(path.dirname(name), node.source.value) === path.resolve(file)) {
    aliases.add(node.specifiers[0].local.name);
    edits.push({ start: node.start, end: node.end, value: "" });
  }
  if (isModule && !aliases.size) continue;
  function styleContext(p) {
    for (let current = p; current && !current.isFunction(); current = current.parentPath) {
      if (current.isJSXAttribute()) return /className/i.test(current.node.name.name);
      if (current.isObjectProperty() && /className/i.test(current.node.key.name || current.node.key.value || "")) return true;
      if (current.isVariableDeclarator()) return /class|variant|sizes|placements/i.test(current.node.id.name || "");
      if (current.isCallExpression() && ["cn", "clsx"].includes(current.node.callee.name)) return true;
    }
    return false;
  }
  function replace(value) { return value.split(/(\s+)/).map(word => mapping[word] || word).join(""); }
  traverse(ast, {
    StringLiteral(p) {
      if (isModule || p.parent.type === "ImportDeclaration" || !styleContext(p)) return;
      const replacement = replace(p.node.value);
      if (replacement !== p.node.value) edits.push({ start: p.node.start, end: p.node.end, value: p.parent.type === "JSXAttribute" ? `{${JSON.stringify(replacement)}}` : JSON.stringify(replacement) });
    },
    TemplateElement(p) {
      if (isModule || !styleContext(p)) return;
      let replacement = replace(p.node.value.cooked);
      if (!p.node.tail && replacement !== p.node.value.cooked && !/\s$/.test(replacement)) replacement += " ";
      if (replacement !== p.node.value.cooked) edits.push({ start: p.node.start, end: p.node.end, value: replacement.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${") });
    },
    MemberExpression(p) {
      if (!isModule || !aliases.has(p.node.object.name)) return;
      const key = p.node.computed ? p.node.property.value : p.node.property.name;
      if (key !== undefined && mapping[key]) edits.push({ start: p.node.start, end: p.node.end, value: JSON.stringify(mapping[key]) });
      else if (key === undefined) {
        // Only the legacy marketing action accepts a dynamic visual variant.
        const variants = Object.fromEntries(["primary", "outline", "inverse", "quiet"].filter(key => mapping[key]).map(key => [key, mapping[key]]));
        edits.push({ start: p.node.object.start, end: p.node.object.end, value: `(${JSON.stringify(variants)})` });
      }
    },
  });
  if (edits.length) {
    const backup = `test-results/tailwind-migration/${label}/sources/${name.replaceAll("\\", "/")}`;
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, source);
    let updated = source;
    for (const edit of edits.sort((a, b) => b.start - a.start)) updated = updated.slice(0, edit.start) + edit.value + updated.slice(edit.end);
    fs.writeFileSync(name, updated); changed.push(name);
  }
}
// Empty media wrappers may now be removed; keyframes and global selectors remain.
root.walkAtRules("media", rule => { if (!rule.nodes?.length) rule.remove(); });
let output = root.toString();
let globals = file === "app/globals.css" ? output : fs.readFileSync("app/globals.css", "utf8");
if (keyframes.length) globals += "\n/* Preserved marketing motion. */\n" + keyframes.map(frame => frame.css).join("\n") + "\n";
const definitions = [...media].filter(([, name]) => name && !globals.includes(`@custom-variant ${name} `)).sort(([a], [b]) => {
  const ma = a.match(/max-width:(\d+)/), mb = b.match(/max-width:(\d+)/);
  return ma && mb ? Number(mb[1]) - Number(ma[1]) : a.localeCompare(b);
}).map(([condition, name]) => `@custom-variant ${name} { @media ${condition} { @slot; } }`).join("\n");
if (definitions) globals = globals.replace('@import "tailwindcss";', '@import "tailwindcss";\n' + definitions);
// Keep inclusive maximum-width variants in descending order across all units.
const responsive = [...globals.matchAll(/^@custom-variant at-(?:most|least)-\d+ .*$/gm)].map(match => match[0]);
if (responsive.length) {
  globals = globals.replace(/^@custom-variant at-(?:most|least)-\d+ .*\r?\n/gm, "");
  responsive.sort((a, b) => {
    const [, kindA, sizeA] = a.match(/at-(most|least)-(\d+)/), [, kindB, sizeB] = b.match(/at-(most|least)-(\d+)/);
    return kindA !== kindB ? kindA.localeCompare(kindB) : kindA === "most" ? Number(sizeB) - Number(sizeA) : Number(sizeA) - Number(sizeB);
  });
  globals = globals.replace('@import "tailwindcss";', '@import "tailwindcss";\n' + responsive.join("\n"));
}
fs.writeFileSync(file, file === "app/globals.css" ? globals : output);
if (file !== "app/globals.css") fs.writeFileSync("app/globals.css", globals);
const folder = `test-results/tailwind-migration/${label}`;
fs.mkdirSync(folder, { recursive: true });
fs.writeFileSync(`${folder}/original.css`, original);
fs.writeFileSync(`${folder}/classes.json`, JSON.stringify(mapping, null, 2));
fs.writeFileSync(`${folder}/rules.json`, JSON.stringify([...groups.values()], null, 2));
console.log(JSON.stringify({ classes: Object.keys(mapping).length, selectors: groups.size, changed, retained: excluded }, null, 2));
