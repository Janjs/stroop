import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: {
    sessionId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId) {
      return await ctx.db
        .query("chats")
        .withIndex("by_userId_updatedAt", (q) => q.eq("userId", userId))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("chats")
      .withIndex("by_sessionId_updatedAt", (q) =>
        q.eq("sessionId", args.sessionId ?? "")
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { id: v.id("chats"), sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const chat = await ctx.db.get(args.id);

    if (!chat) return null;

    if (userId) {
      if (chat.userId === userId) return chat;
    }

    if (args.sessionId && chat.sessionId === args.sessionId) {
      return chat;
    }

    return null;
  },
});

export const getShared = query({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);
    if (!chat?.sharedAt) return null;
    const user = chat.userId ? await ctx.db.get(chat.userId as Id<"users">) : null;
    return {
      title: chat.title,
      snippets: chat.sharedCode ? [{ code: chat.sharedCode }] : chat.snippets,
      sharedBy: chat.sharedBy ?? user?.name,
    };
  },
});

export const makeShareable = mutation({
  args: { id: v.id("chats"), code: v.string(), sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const chat = await ctx.db.get(args.id);
    if (!chat) throw new Error("Chat not found");

    const isOwner = (userId && chat.userId === userId) || (args.sessionId && chat.sessionId === args.sessionId);
    if (!isOwner) throw new Error("Unauthorized");

    const identity = await ctx.auth.getUserIdentity();
    const user = userId ? await ctx.db.get(userId as Id<"users">) : null;
    await ctx.db.patch(args.id, {
      sharedAt: Date.now(),
      sharedBy: identity?.name ?? user?.name ?? undefined,
      sharedCode: args.code,
    });
    return args.id;
  },
});

export const create = mutation({
  args: {
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
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId && !args.sessionId) {
      throw new Error("Not authenticated and no session ID provided");
    }

    const now = Date.now();
    const chatId = await ctx.db.insert("chats", {
      userId: userId ?? undefined,
      sessionId: args.sessionId,
      title: args.title,
      messages: args.messages,
      snippets: args.snippets,
      createdAt: now,
      updatedAt: now,
    });

    return chatId;
  },
});

export const update = mutation({
  args: {
    id: v.id("chats"),
    title: v.optional(v.string()),
    messages: v.optional(
      v.array(
        v.object({
          id: v.string(),
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
          parts: v.optional(v.any()),
          createdAt: v.number(),
        })
      )
    ),
    snippets: v.optional(v.any()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const chat = await ctx.db.get(args.id);

    if (!chat) throw new Error("Chat not found");

    const isOwner = (userId && chat.userId === userId) || (args.sessionId && chat.sessionId === args.sessionId);
    if (!isOwner) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.messages !== undefined) updates.messages = args.messages;
    if (args.snippets !== undefined) updates.snippets = args.snippets;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("chats"), sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const chat = await ctx.db.get(args.id);

    if (!chat) throw new Error("Chat not found");

    const isOwner = (userId && chat.userId === userId) || (args.sessionId && chat.sessionId === args.sessionId);
    if (!isOwner) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
    return args.id;
  },
});
