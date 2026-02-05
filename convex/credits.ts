import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const ANONYMOUS_CREDIT_LIMIT = 3;

export const getCredits = query({
  args: {
    anonymousSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    if (userId) {
      const user = await ctx.db
        .query("userCredits")
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();
      
      return {
        credits: user?.credits ?? null,
        isAuthenticated: true,
      };
    }

    if (!args.anonymousSessionId) {
      return {
        credits: ANONYMOUS_CREDIT_LIMIT,
        isAuthenticated: false,
      };
    }

    const anonymousUser = await ctx.db
      .query("anonymousUsers")
      .filter((q) => q.eq(q.field("sessionId"), args.anonymousSessionId))
      .first();

    const creditsUsed = anonymousUser?.creditsUsed ?? 0;
    const remaining = Math.max(0, ANONYMOUS_CREDIT_LIMIT - creditsUsed);

    return {
      credits: remaining,
      isAuthenticated: false,
    };
  },
});

export const useCredit = mutation({
  args: {
    anonymousSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    if (userId) {
      const user = await ctx.db
        .query("userCredits")
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();
      
      if (user) {
        if (user.credits > 0) {
          await ctx.db.patch(user._id, {
            credits: user.credits - 1,
          });
          return { success: true, remaining: user.credits - 1 };
        }
        return { success: false, reason: "no_credits" };
      }
      
      await ctx.db.insert("userCredits", {
        userId,
        credits: 0,
      });
      return { success: false, reason: "no_credits" };
    }

    if (!args.anonymousSessionId) {
      return { success: false, reason: "no_session" };
    }

    let anonymousUser = await ctx.db
      .query("anonymousUsers")
      .filter((q) => q.eq(q.field("sessionId"), args.anonymousSessionId))
      .first();

    if (!anonymousUser) {
      const id = await ctx.db.insert("anonymousUsers", {
        sessionId: args.anonymousSessionId,
        creditsUsed: 0,
      });
      anonymousUser = await ctx.db.get(id);
    }

    if (!anonymousUser) {
      return { success: false, reason: "no_session" };
    }

    const creditsUsed = anonymousUser.creditsUsed ?? 0;
    
    if (creditsUsed >= ANONYMOUS_CREDIT_LIMIT) {
      return { success: false, reason: "limit_reached" };
    }

    await ctx.db.patch(anonymousUser._id, {
      creditsUsed: creditsUsed + 1,
    });

    return {
      success: true,
      remaining: ANONYMOUS_CREDIT_LIMIT - (creditsUsed + 1),
    };
  },
});
