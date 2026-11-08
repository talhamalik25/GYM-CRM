import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import messages from "../locales/en-US.json";
import { DEFAULT_LOCALE, DEFAULT_TIME_ZONE, getCountry, isAvailableLocale, resolveLocale } from "../config/locales.js";
import { getCurrentUser } from "../lib/auth.js";
import connectToDatabase from "../lib/db.js";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const user = await getCurrentUser();
  const countryCode = cookieStore.get("fitivo-country")?.value || "";
  let locale = "";
  let timeZone = DEFAULT_TIME_ZONE;

  if (user) {
    if (user.preferredLocale && isAvailableLocale(user.preferredLocale)) {
      locale = user.preferredLocale;
    } else if (user.role === "staff") {
      await connectToDatabase();
      const memberships = await GymMembership.find({ userId: user._id, status: "active" }).select("gymId").limit(2).lean();
      if (memberships.length === 1) {
        const gym = await Gym.findById(memberships[0].gymId).select("countryCode defaultLocale timezone").lean();
        if (gym) {
          locale = gym.defaultLocale || "";
          timeZone = gym.timezone || DEFAULT_TIME_ZONE;
          const gymCountry = getCountry(gym.countryCode);
          locale = resolveLocale(locale || gymCountry?.defaultLocale, gym.countryCode);
        }
      }
    }
    if (!locale) locale = DEFAULT_LOCALE;
  } else {
    const country = getCountry(countryCode);
    locale = resolveLocale(country?.defaultLocale || DEFAULT_LOCALE, countryCode);
  }

  return { locale, messages, timeZone };
});
