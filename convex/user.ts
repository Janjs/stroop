import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Debug query to check env vars - remove after debugging
export const debugEnvVars = query({
  handler: async () => {
    return {
      CUSTOM_AUTH_SITE_URL: process.env.CUSTOM_AUTH_SITE_URL ?? "NOT SET",
      CONVEX_SITE_URL: process.env.CONVEX_SITE_URL ?? "NOT SET",
      CONVEX_SITE_ORIGIN: process.env.CONVEX_SITE_ORIGIN ?? "NOT SET",
      CONVEX_CLOUD_ORIGIN: process.env.CONVEX_CLOUD_ORIGIN ?? "NOT SET",
      SITE_URL: process.env.SITE_URL ?? "NOT SET",
    };
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    
    if (!userId) {
      return null;
    }

    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), userId))
      .first();

    return {
      name: identity.name ?? user?.name ?? null,
      email: identity.email ?? user?.email ?? null,
      image: identity.image ?? user?.image ?? null,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});
