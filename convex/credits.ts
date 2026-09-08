import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const ANONYMOUS_CREDIT_LIMIT = 3;
const INCLUDED_CENTS = 400;
const LUNA_MODEL_ID = "gpt-5.6-luna";
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

function isSubscribed(status?: string) {
  return !!status && ACTIVE_STATUSES.has(status);
}

async function creditsForUser(ctx: { db: any }, userId: string) {
  return await ctx.db
    .query("userCredits")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();
}

async function anonymousRemaining(ctx: { db: any }, sessionId?: string) {
  if (!sessionId) return ANONYMOUS_CREDIT_LIMIT;
  const anonymousUser = await ctx.db
    .query("anonymousUsers")
    .withIndex("by_sessionId", (q: any) => q.eq("sessionId", sessionId))
    .first();
  return Math.max(0, ANONYMOUS_CREDIT_LIMIT - (anonymousUser?.creditsUsed ?? 0));
}

export const getUsage = query({
  args: { anonymousSessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      const freeRemaining = await anonymousRemaining(ctx, args.anonymousSessionId);
      return {
        isAuthenticated: false,
        isSubscribed: false,
        freeRemaining,
        freeLimit: ANONYMOUS_CREDIT_LIMIT,
        usedCents: 0,
        includedCents: INCLUDED_CENTS,
        canGenerate: freeRemaining > 0,
        canUsePaidModels: false,
      };
    }

    const row = await creditsForUser(ctx, userId);

    if (isSubscribed(row?.subscriptionStatus)) {
      const usedCents = row?.usedCents ?? 0;
      return {
        isAuthenticated: true,
        isSubscribed: true,
        freeRemaining: 0,
        freeLimit: 0,
        usedCents,
        includedCents: INCLUDED_CENTS,
        canGenerate: usedCents < INCLUDED_CENTS,
        canUsePaidModels: true,
      };
    }

    return {
      isAuthenticated: true,
      isSubscribed: false,
      freeRemaining: 0,
      freeLimit: 0,
      usedCents: 0,
      includedCents: INCLUDED_CENTS,
      canGenerate: false,
      canUsePaidModels: false,
    };
  },
});

export const consume = mutation({
  args: {
    model: v.string(),
    anonymousSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      if (args.model !== LUNA_MODEL_ID) {
        return { ok: false as const, reason: "sign_in" };
      }
      if (!args.anonymousSessionId) {
        return { ok: false as const, reason: "no_session" };
      }

      let anonymousUser = await ctx.db
        .query("anonymousUsers")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", args.anonymousSessionId!))
        .first();

      if (!anonymousUser) {
        const id = await ctx.db.insert("anonymousUsers", {
          sessionId: args.anonymousSessionId,
          creditsUsed: 0,
        });
        anonymousUser = await ctx.db.get(id);
      }
      if (!anonymousUser) return { ok: false as const, reason: "no_session" };

      const creditsUsed = anonymousUser.creditsUsed ?? 0;
      if (creditsUsed >= ANONYMOUS_CREDIT_LIMIT) {
        return { ok: false as const, reason: "sign_in" };
      }
      await ctx.db.patch(anonymousUser._id, { creditsUsed: creditsUsed + 1 });
      return { ok: true as const, kind: "free" as const };
    }

    const row = await creditsForUser(ctx, userId);
    if (!row || !isSubscribed(row.subscriptionStatus)) {
      return { ok: false as const, reason: "subscribe" };
    }
    if ((row.usedCents ?? 0) >= INCLUDED_CENTS) {
      return { ok: false as const, reason: "budget" };
    }
    await ctx.db.patch(row._id, { usedCents: (row.usedCents ?? 0) + 1 });
    return { ok: true as const, kind: "paid" as const };
  },
});

export const refundFree = mutation({
  args: { anonymousSessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId) return;
    if (!args.anonymousSessionId) return;
    const anonymousUser = await ctx.db
      .query("anonymousUsers")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.anonymousSessionId!))
      .first();
    if (!anonymousUser || (anonymousUser.creditsUsed ?? 0) <= 0) return;
    await ctx.db.patch(anonymousUser._id, { creditsUsed: anonymousUser.creditsUsed - 1 });
  },
});

export const recordUsage = mutation({
  args: {
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    cents: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const row = await creditsForUser(ctx, userId);
    if (!row || !isSubscribed(row.subscriptionStatus)) return;
    await ctx.db.patch(row._id, {
      usedCents: (row.usedCents ?? 0) + Math.max(0, args.cents - 1),
    });
  },
});

export const getCredits = query({
  args: { anonymousSessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId) {
      const row = await creditsForUser(ctx, userId);
      if (isSubscribed(row?.subscriptionStatus)) {
        return { credits: null, isAuthenticated: true };
      }
      return { credits: 0, isAuthenticated: true };
    }
    return {
      credits: await anonymousRemaining(ctx, args.anonymousSessionId),
      isAuthenticated: false,
    };
  },
});

export const useCredit = mutation({
  args: { anonymousSessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId) {
      return { success: false, reason: "subscribe" };
    }
    if (!args.anonymousSessionId) return { success: false, reason: "no_session" };
    let anonymousUser = await ctx.db
      .query("anonymousUsers")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.anonymousSessionId!))
      .first();
    if (!anonymousUser) {
      const id = await ctx.db.insert("anonymousUsers", {
        sessionId: args.anonymousSessionId,
        creditsUsed: 0,
      });
      anonymousUser = await ctx.db.get(id);
    }
    if (!anonymousUser) return { success: false, reason: "no_session" };
    const creditsUsed = anonymousUser.creditsUsed ?? 0;
    if (creditsUsed >= ANONYMOUS_CREDIT_LIMIT) {
      return { success: false, reason: "limit_reached" };
    }
    await ctx.db.patch(anonymousUser._id, { creditsUsed: creditsUsed + 1 });
    return { success: true, remaining: ANONYMOUS_CREDIT_LIMIT - (creditsUsed + 1) };
  },
});
