export const PREMIUM_FLAG_KEY = "india_roads_premium_unlocked_v1";

export function getPremiumUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PREMIUM_FLAG_KEY) === "true";
}

export function setPremiumUnlocked(v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREMIUM_FLAG_KEY, v ? "true" : "false");
}
