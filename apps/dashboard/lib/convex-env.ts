import "server-only";

import fs from "node:fs";
import path from "node:path";

const PLACEHOLDER_CONVEX_URL = "https://placeholder.convex.cloud";
const PLACEHOLDER_CONVEX_SITE_URL = "https://placeholder.convex.site";

function findUpwardFile(startDir: string, fileName: string) {
  let currentDir = startDir;

  while (true) {
    const candidatePath = path.join(currentDir, fileName);

    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

function readRootEnvValue(key: string) {
  const rootEnvPath = findUpwardFile(process.cwd(), ".env.local");

  if (!rootEnvPath) {
    return undefined;
  }

  const contents = fs.readFileSync(rootEnvPath, "utf8");

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.startsWith(`${key}=`)) {
      continue;
    }

    const rawValue = trimmed.slice(key.length + 1);
    const commentIndex = rawValue.indexOf(" #");
    return (commentIndex >= 0 ? rawValue.slice(0, commentIndex) : rawValue).trim();
  }

  return undefined;
}

export function getConvexEnv() {
  const convexUrl =
    process.env.NEXT_PUBLIC_CONVEX_URL ??
    process.env.CONVEX_URL ??
    readRootEnvValue("NEXT_PUBLIC_CONVEX_URL") ??
    readRootEnvValue("CONVEX_URL") ??
    PLACEHOLDER_CONVEX_URL;

  const convexSiteUrl =
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
    process.env.CONVEX_SITE_URL ??
    readRootEnvValue("NEXT_PUBLIC_CONVEX_SITE_URL") ??
    readRootEnvValue("CONVEX_SITE_URL") ??
    PLACEHOLDER_CONVEX_SITE_URL;

  return {
    convexUrl,
    convexSiteUrl,
  };
}
