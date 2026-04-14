import { createClient, type AuthFunctions, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import type { GenericDatabaseReader } from "convex/server";
import { internal, components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { DEFAULT_DASHBOARD_LANGUAGE } from "./lib/dashboardLanguage";

import authConfig from "./auth.config";

type EnvMap = Record<string, string | undefined>;

function getEnv() {
  return (globalThis as typeof globalThis & {
    process?: { env?: EnvMap };
  }).process?.env;
}

const env = getEnv();

function toOrigin(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

const trustedOrigins = [
  env?.SITE_URL,
  env?.NEXT_PUBLIC_APP_URL,
  "http://localhost:3002",
  "http://127.0.0.1:3002",
]
  .map(toOrigin)
  .filter((value): value is string => Boolean(value));

const ipAddressHeaders = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "fastly-client-ip",
  "x-client-ip",
];

const siteUrl = trustedOrigins[0] ?? "http://localhost:3002";

const betterAuthSecret =
  env?.BETTER_AUTH_SECRET ??
  env?.AUTH_SECRET ??
  "kookly-dev-secret-change-me";

const authFunctions: AuthFunctions = internal.auth;

function splitAuthUserName(name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { firstName: "", lastName: "" };
  }

  const [firstName = "", ...remainingParts] = trimmedName.split(/\s+/);

  return {
    firstName,
    lastName: remainingParts.join(" "),
  };
}

function authUserNameParts(
  doc: { name: string } & Record<string, unknown>,
): { firstName: string; lastName: string } {
  const derivedNameParts = splitAuthUserName(doc.name);

  return {
    firstName:
      typeof doc.firstName === "string" && doc.firstName.trim().length > 0
        ? doc.firstName.trim()
        : derivedNameParts.firstName,
    lastName:
      typeof doc.lastName === "string" && doc.lastName.trim().length > 0
        ? doc.lastName.trim()
        : derivedNameParts.lastName,
  };
}

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, doc) => {
        const existingUser = await getAppUserByAuthUserId(ctx, doc._id);

        if (existingUser) {
          return;
        }

        const { firstName, lastName } = authUserNameParts(doc);

        await ctx.db.insert("users", {
          authUserId: doc._id,
          email: doc.email,
          fullName: doc.name,
          firstName,
          lastName,
          imageUrl: doc.image ?? null,
          status: "active",
          onboardingStatus: "organization",
          dashboardLanguage: DEFAULT_DASHBOARD_LANGUAGE,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        });
      },
      onUpdate: async (ctx, newDoc) => {
        const existingUser = await getAppUserByAuthUserId(ctx, newDoc._id);

        if (!existingUser) {
          return;
        }

        await ctx.db.patch(existingUser._id, {
          email: newDoc.email,
          fullName: newDoc.name,
          ...authUserNameParts(newDoc),
          imageUrl: newDoc.image ?? null,
          updatedAt: newDoc.updatedAt,
        });
      },
    },
    session: {
      onCreate: async (ctx, doc) => {
        const existingUser = await getAppUserByAuthUserId(ctx, doc.userId);

        if (!existingUser) {
          return;
        }

        await ctx.db.patch(existingUser._id, {
          lastLoginAt: doc.createdAt,
          updatedAt: Date.now(),
        });
      },
    },
  },
});

export const { getAuthUser } = authComponent.clientApi();
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export function createAuthOptions(ctx: GenericCtx<DataModel>) {
  return {
    baseURL: siteUrl,
    basePath: "/api/auth",
    secret: betterAuthSecret,
    trustedOrigins,
    advanced: {
      ipAddress: {
        ipAddressHeaders,
      },
      trustedProxyHeaders: true,
    },
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
    },
    plugins: [
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
    ],
  } satisfies BetterAuthOptions;
}

export function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth(createAuthOptions(ctx));
}

async function getAppUserByAuthUserId(
  ctx: { db: GenericDatabaseReader<DataModel> },
  authUserId: string,
) {
  return await ctx.db
    .query("users")
    .withIndex("authUserId", (q) => q.eq("authUserId", authUserId))
    .unique();
}
