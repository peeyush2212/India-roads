import type { Scenario } from "@/lib/types";

export function encodeScenario(s: Scenario) {
  const json = JSON.stringify(s);
  const b64 = typeof window === "undefined" ? Buffer.from(json).toString("base64") : btoa(json);
  // URL-safe base64
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeScenario(str: string): Scenario | null {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const raw = typeof window === "undefined" ? Buffer.from(b64 + pad, "base64").toString("utf8") : atob(b64 + pad);
    const obj = JSON.parse(raw);
    return obj as Scenario;
  } catch {
    return null;
  }
}
