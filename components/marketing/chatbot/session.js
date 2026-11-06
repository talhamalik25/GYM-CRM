import { knowledge } from "./knowledge.js";
const KEY = "fitivo-chat-v1";
export function loadConversation() {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY));
    if (!Array.isArray(value)) return [];
    return value.slice(-30).filter((item) => item && typeof item.question === "string" && item.question.length <= 300 && Object.hasOwn(knowledge, item.topic) && Number.isFinite(item.time) && item.time > 0 && item.time <= Date.now()).map(({ question, topic, time }) => ({ question, topic, time }));
  } catch { return []; }
}
export function saveConversation(messages) {
  try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-30))); } catch { /* Storage is optional. */ }
}
