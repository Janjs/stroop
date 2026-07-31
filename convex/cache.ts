import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const CACHE_TTL = 1000 * 60 * 60 * 24;

export const getPromptCache = query({
  args: {
    cacheKey: v.string(),
  },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("promptCache")
      .withIndex("by_cacheKey", (q) => q.eq("cacheKey", args.cacheKey))
      .first();

    if (!cached?.isExample) return null;

    const now = Date.now();
    if (now - cached.timestamp > CACHE_TTL) {
      // Cache expired
      // await ctx.db.delete(cached._id); // Cannot delete in query
      return null;
    }

    return {
      response: cached.response,
      headers: cached.headers as Record<string, string>,
    };
  },
});

export const seedExamplePromptCache = mutation({
  args: {
    cacheKey: v.string(),
    response: v.string(),
    headers: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("promptCache")
      .withIndex("by_cacheKey", (q) => q.eq("cacheKey", args.cacheKey))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        response: args.response,
        headers: args.headers,
        timestamp: Date.now(),
        isExample: true,
      });
    } else {
      await ctx.db.insert("promptCache", {
        cacheKey: args.cacheKey,
        response: args.response,
        headers: args.headers,
        timestamp: Date.now(),
        isExample: true,
      });
    }

    const allCaches = await ctx.db.query("promptCache").collect();
    if (allCaches.length > 1000) {
      const sorted = allCaches.sort((a, b) => a.timestamp - b.timestamp);
      const toDelete = sorted.slice(0, sorted.length - 1000);
      for (const item of toDelete) {
        await ctx.db.delete(item._id);
      }
    }
  },
});

export const clearPromptCache = mutation({
  args: {},
  handler: async (ctx) => {
    const allCaches = await ctx.db.query("promptCache").collect();
    for (const item of allCaches) {
      await ctx.db.delete(item._id);
    }
  },
});
