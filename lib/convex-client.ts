import { ConvexHttpClient } from "convex/browser";

/**
 * Lazy ConvexHttpClient factory.
 *
 * Module-level instantiation (e.g. `const convex = new ConvexHttpClient(...)`)
 * crashes the Next.js production build during the page-data collection pass
 * when `NEXT_PUBLIC_CONVEX_URL` is not present, and crashes Workers cold-start
 * if the secret is unset. Per-request construction is cheap and avoids any
 * cross-request state in the Workers runtime.
 */
export function getConvexHttpClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}
