import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List messages in a room
export const listMessages = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_roomId", q => q.eq("roomId", roomId))
      .order("asc")
      .collect();
  },
});

// Send a message in a room
export const sendMessage = mutation({
  args: { roomId: v.id("rooms"), senderId: v.id("users"), content: v.string() },
  handler: async (ctx, { roomId, senderId, content }) => {
    await ctx.db.insert("messages", { roomId, senderId, content });
    return null;
  },
});

export const getLatestMessageForRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    const msg = await ctx.db
      .query("messages")
      .withIndex("by_roomId", q => q.eq("roomId", roomId))
      .order("desc")
      .first();
    return msg;
  },
});

export const getLatestMessagesForRooms = query({
  args: { roomIds: v.array(v.id("rooms")) },
  handler: async (ctx, { roomIds }) => {
    const result: Record<string, any> = {};
    for (const roomId of roomIds) {
      const msg = await ctx.db
        .query("messages")
        .withIndex("by_roomId", q => q.eq("roomId", roomId))
        .order("desc")
        .first();
      if (msg) result[roomId] = msg;
    }
    return result;
  },
});
