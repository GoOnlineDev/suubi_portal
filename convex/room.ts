import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or get a room for two users
export const createOrGetRoom = mutation({
  args: { userId1: v.id("users"), userId2: v.id("users") },
  handler: async (ctx, { userId1, userId2 }) => {
    // Always store userIds in sorted order for uniqueness
    const ids = [userId1, userId2].sort();
    let room = await ctx.db
      .query("rooms")
      .withIndex("by_userIds", q => q.eq("userIds", ids))
      .unique();
    if (!room) {
      const roomId = await ctx.db.insert("rooms", { userIds: ids });
      return roomId;
    }
    return room._id;
  },
});

// List all rooms for a user
export const listRoomsForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Convex does not support .contains on array indexes, so fetch all rooms and filter in JS
    const rooms = await ctx.db.query("rooms").collect();
    const userRooms = rooms.filter(room => room.userIds.includes(userId));
    // For each room, get the other user's info
    const result = [];
    for (const room of userRooms) {
      const otherId = room.userIds.find((id) => id !== userId);
      const otherUser = otherId ? await ctx.db.get(otherId) : null;
      result.push({
        roomId: room._id,
        otherUser,
      });
    }
    return result;
  },
});
