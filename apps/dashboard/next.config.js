import { withBotId } from "botid/next/config";
import { withGTConfig } from "gt-next/config";

const env = globalThis.process?.env;

function getAllowedDevOrigins() {
  const configuredOrigins = [
    env?.SITE_URL,
    env?.NEXT_PUBLIC_APP_URL,
  ]
    .filter(Boolean)
    .flatMap((value) => {
      try {
        const { hostname } = new URL(value);
        return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local")
          ? [hostname]
          : [];
      } catch {
        return [];
      }
    });

  return [...new Set(["localhost", "127.0.0.1", ...configuredOrigins])];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
  // cacheComponents: true,
};

export default withBotId(
  withGTConfig(nextConfig, {
    // experimentalLocaleResolution: true,
  }),
);
