import test from "node:test";
import assert from "node:assert/strict";
import { matchQuestion } from "../components/marketing/chatbot/matcher.js";
import { knowledge } from "../components/marketing/chatbot/knowledge.js";
import { validateMarketingLead } from "../lib/marketingLead.js";
import { loadConversation, saveConversation } from "../components/marketing/chatbot/session.js";

test("English and Roman Urdu topics match whole words", () => {
  for (const [question, topic] of [["Fitivo kya hai?", "about"], ["hazri kaise lagay gi", "attendance"], ["fee jama karni hai", "fees"], ["kitna cost hai", "pricing"], ["bank transfer kaise", "payment"], ["account banao", "trial"]]) assert.equal(matchQuestion(question), topic);
  for (const question of ["the and is", "membershipless", "weather on Mars", "Do members get diet plans?", "Does pricing include unlimited trainers?"]) assert.equal(matchQuestion(question), "fallback");
});

test("all suggestions resolve and actions use trusted destinations", () => {
  for (const answer of Object.values(knowledge)) {
    for (const id of answer.followups || []) assert.ok(knowledge[id]?.label);
    for (const action of answer.actions || []) assert.match(action.href, /^(\/|mailto:)/);
  }
});

test("lead validation normalizes phone and discards untrusted fields", () => {
  const result = validateMarketingLead({ name: " Test Owner ", gymName: " Example Gym ", phone: "0300 1234567", topic: "demo", consent: true, gymId: "forged", role: "superadmin" });
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.data, { name: "Test Owner", gymName: "Example Gym", phone: "+923001234567", topic: "demo" });
  assert.equal(Object.keys(validateMarketingLead({}).errors).length, 5);
  assert.ok(validateMarketingLead({ name: { $gt: "" }, phone: "123", consent: "true" }).errors.name);
});

test("storage failures and malformed history do not crash the chatbot", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  try {
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } } });
    assert.deepEqual(loadConversation(), []);
    assert.doesNotThrow(() => saveConversation([]));
    globalThis.sessionStorage.getItem = () => JSON.stringify([{ question: "hello", topic: "constructor", time: Date.now() }, { question: "hello", topic: "pricing", time: 1e20 }]);
    assert.deepEqual(loadConversation(), []);
  } finally {
    if (previous) Object.defineProperty(globalThis, "sessionStorage", previous);
    else delete globalThis.sessionStorage;
  }
});
