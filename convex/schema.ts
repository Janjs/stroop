import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  userCredits: defineTable({
    userId: v.string(),
    credits: v.number(),
  }).index("by_userId", ["userId"]),
  anonymousUsers: defineTable({
    sessionId: v.string(),
    creditsUsed: v.number(),
  }).index("by_sessionId", ["sessionId"]),
  promptCache: defineTable({
    cacheKey: v.string(),
    response: v.string(),
    headers: v.any(),
    timestamp: v.number(),
  }).index("by_cacheKey", ["cacheKey"]),
  toolCache: defineTable({
    cacheKey: v.string(),
    result: v.any(),
    timestamp: v.number(),
  }).index("by_cacheKey", ["cacheKey"]),
  chats: defineTable({
    sessionId: v.optional(v.string()),
    userId: v.optional(v.string()),
    title: v.string(),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        parts: v.optional(v.any()),
        createdAt: v.number(),
      })
    ),
    snippets: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_updatedAt", ["userId", "updatedAt"])
    .index("by_sessionId", ["sessionId"])
    .index("by_sessionId_updatedAt", ["sessionId", "updatedAt"]),
});
