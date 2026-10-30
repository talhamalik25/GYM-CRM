// Legacy component styles were unlayered. Keep migrated utilities at that same
// cascade priority, while existing Tailwind utilities keep their original layer.
// The `exact` variant is an identity selector: it does not add specificity.
module.exports = () => ({
  postcssPlugin: "fitivo-exact-utility-cascade",
  OnceExit(root) {
    root.walkAtRules("layer", layer => {
      if (layer.params !== "utilities") return;
      let previous = layer;
      const lifted = [];
      for (const node of [...(layer.nodes || [])]) {
        if (node.type === "rule" && node.selector.includes(".exact\\:")) {
          node.remove(); previous.after(node); previous = node; lifted.push(node);
        } else if (node.type === "atrule" && node.nodes) {
          const copy = node.clone();
          copy.walkRules(rule => { if (!rule.selector.includes(".exact\\:")) rule.remove(); });
          copy.walkAtRules(rule => { if (rule.nodes && !rule.nodes.length) rule.remove(); });
          let hasUtilities = false;
          copy.walkRules(() => { hasUtilities = true; });
          if (!hasUtilities) continue;
          node.walkRules(rule => { if (rule.selector.includes(".exact\\:")) rule.remove(); });
          node.walkAtRules(rule => { if (rule.nodes && !rule.nodes.length) rule.remove(); });
          if (!node.nodes.length) node.remove();
          previous.after(copy); previous = copy; lifted.push(copy);
        }
      }
      // Arbitrary property utilities sort lexically in Tailwind. CSS shorthands
      // must precede their longhands so e.g. border does not erase border-bottom.
      const shorthands = new Set(["font", "border", "padding", "margin", "background", "outline", "flex", "grid", "transition", "animation"]);
      const rank = node => node.type === "rule" && node.nodes?.some(child => child.type === "decl" && shorthands.has(child.prop)) ? 0 : 1;
      function order(nodes) {
        let block = [];
        const flush = () => {
          if (block.length < 2) { block = []; return; }
          const marker = block[0].clone({ nodes: [], selector: ":where(.unused-cascade-marker)" });
          block[0].before(marker);
          const sorted = [...block].sort((a, b) => rank(a) - rank(b));
          for (const node of sorted) { node.remove(); marker.before(node); }
          marker.remove(); block = [];
        };
        for (const node of nodes) {
          if (node.type === "rule") block.push(node);
          else { flush(); if (node.nodes) order([...node.nodes]); }
        }
        flush();
      }
      order(lifted);
    });
  },
});
module.exports.postcss = true;
