export type DataEnvironment = "live" | "development";

export function getDataEnvironment(): DataEnvironment {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    try {
      return new URL(configured).hostname === "terrier-pursuit.vercel.app"
        ? "live"
        : "development";
    } catch {
      // Fall through to the safest default for local and preview work.
    }
  }

  return "development";
}
