import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const applySubscription = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    status: v.string(),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!process.env.POLAR_WEBHOOK_SECRET || args.secret !== process.env.POLAR_WEBHOOK_SECRET) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("userCredits")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const row = existing ?? (await ctx.db.get(await ctx.db.insert("userCredits", { userId: args.userId, credits: 0 })));
    if (!row) return;

    const periodChanged = args.periodStart && args.periodStart !== row.periodStart;
    await ctx.db.patch(row._id, {
      subscriptionStatus: args.status,
      polarCustomerId: args.polarCustomerId ?? row.polarCustomerId,
      polarSubscriptionId: args.polarSubscriptionId ?? row.polarSubscriptionId,
      periodStart: args.periodStart ?? row.periodStart,
      periodEnd: args.periodEnd ?? row.periodEnd,
      usedCents: periodChanged ? 0 : row.usedCents,
    });
  },
});
