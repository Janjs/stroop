import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const clearAnonymousUser = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const anonymousUser = await ctx.db
      .query("anonymousUsers")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();

    if (anonymousUser) {
      await ctx.db.delete(anonymousUser._id);
      return { success: true };
    }

    return { success: false, reason: "not_found" };
  },
});

export const clearAllAnonymousUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const allAnonymousUsers = await ctx.db.query("anonymousUsers").collect();
    
    for (const user of allAnonymousUsers) {
      await ctx.db.delete(user._id);
    }

    return { success: true, deleted: allAnonymousUsers.length };
  },
});
