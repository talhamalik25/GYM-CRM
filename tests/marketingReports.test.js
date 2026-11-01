import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BANK } from "../config/bank.js";
import { PLANS, PRICING } from "../config/plans.js";

const readProjectFile = (path) => readFile(fileURLToPath(new URL(path, import.meta.url)), "utf8");

test("marketing pricing and bank instructions remain config-backed placeholders", async () => {
  assert.equal(PRICING.pricesConfirmed, false);
  assert.ok(PLANS.every((plan) => plan.monthlyPrice === null));
  assert.equal(BANK.configured, false);
  const [pricing, payment] = await Promise.all([
    readProjectFile("../components/marketing/marketing-pricing.js"),
    readProjectFile("../components/marketing/marketing-payment.js"),
  ]);
  assert.match(pricing, /from "\.\.\/\.\.\/config\/plans\.js"/);
  assert.match(payment, /from "\.\.\/\.\.\/config\/plans\.js"/);
  assert.match(payment, /from "\.\.\/\.\.\/config\/bank\.js"/);
});

test("marketing preview uses clearly illustrative, non-customer placeholders", async () => {
  const preview = await readProjectFile("../components/marketing/marketing-product-preview.js");
  assert.match(preview, /Example member/);
  assert.match(preview, /Illustrative view/);
  for (const fabricatedValue of ["Ayesha Khan", "Omar Ahmed", "Sara Ali", "84,250", "748 members", "2,416"]) {
    assert.ok(!preview.includes(fabricatedValue), `marketing preview should not show ${fabricatedValue}`);
  }
});

test("marketing help uses only public FAQ content and no external request", async () => {
  const [chatbot, layout] = await Promise.all([
    readProjectFile("../components/marketing/marketing-chatbot.js"),
    readProjectFile("../app/(marketing)/layout.js"),
  ]);
  assert.match(chatbot, /FAQS/);
  assert.match(chatbot, /MAX_QUESTION_LENGTH = 300/);
  assert.doesNotMatch(chatbot, /fetch\(|\/api\//);
  assert.match(layout, /<MarketingChatbot \/>/);
});
