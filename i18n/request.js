import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  DEFAULT_TIME_ZONE,
  isAvailableLocale,
  resolveEffectiveLocale,
} from "../config/locales.js";
import { getCurrentUser } from "../lib/auth.js";
import connectToDatabase from "../lib/db.js";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";

function mergeMessages(fallback, current) {
  if (!current || typeof current !== "object") return fallback;
  const result = { ...fallback };
  for (const [key, val] of Object.entries(current)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      result[key] = mergeMessages(fallback[key] || {}, val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const user = await getCurrentUser();
  const cookieLocale = cookieStore.get("fitivo-locale")?.value || "";
  let userLocale = "";
  let gymLocale = "";
  let timeZone = DEFAULT_TIME_ZONE;

  if (user) {
    if (user.preferredLocale && isAvailableLocale(user.preferredLocale)) {
      userLocale = user.preferredLocale;
    } else if (user.role === "staff") {
      try {
        await connectToDatabase();
        const memberships = await GymMembership.find({ userId: user._id, status: "active" })
          .select("gymId")
          .limit(2)
          .lean();
        if (memberships.length === 1) {
          const gym = await Gym.findById(memberships[0].gymId)
            .select("defaultLocale timezone")
            .lean();
          if (gym) {
            gymLocale = gym.defaultLocale || "";
            timeZone = gym.timezone || DEFAULT_TIME_ZONE;
          }
        }
      } catch {
        // Fallback safely if database is unavailable
      }
    }
  }

  // Precedence per Default Language Policy:
  // 1. Explicit user preference (account or cookie)
  // 2. Gym default (if active)
  // 3. ALWAYS English (en-US). Country selection does NOT auto-switch language.
  const locale = resolveEffectiveLocale({
    userLocale,
    explicitLocale: cookieLocale,
    gymLocale,
  });

  // Always load en-US baseline messages for complete fallback safety
  const enMessages = (await import("../locales/en-US.json")).default;
  let messages = enMessages;

  if (locale && locale !== "en-US") {
    try {
      const localeCatalog = (await import(`../locales/${locale}.json`)).default;
      messages = mergeMessages(enMessages, localeCatalog);
    } catch {
      messages = enMessages;
    }
  }

  return { locale, messages, timeZone };
});
