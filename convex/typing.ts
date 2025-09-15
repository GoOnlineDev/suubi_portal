import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Set typing status for a user in a room
export const setTypingStatus = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    isTyping: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { roomId, userId, isTyping }) => {
    // Verify room exists and user is a member
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (!room.userIds.includes(userId)) {
      throw new Error("User is not a member of this room");
    }

    // Check if typing status already exists
    const existingStatus = await ctx.db
      .query("typing_status")
      .withIndex("by_roomId_userId", q => 
        q.eq("roomId", roomId).eq("userId", userId)
      )
      .first();

    const now = Date.now();

    if (existingStatus) {
      // Update existing status
      await ctx.db.patch(existingStatus._id, {
        isTyping,
        lastTypingAt: now,
      });
    } else {
      // Create new typing status
      await ctx.db.insert("typing_status", {
        roomId,
        userId,
        isTyping,
        lastTypingAt: now,
      });
    }

    return null;
  },
});

// Get typing users in a room (excluding the requesting user)
export const getTypingUsers = query({
  args: {
    roomId: v.id("rooms"),
    excludeUserId: v.optional(v.id("users")),
  },
  returns: v.array(v.object({
    user: v.object({
      _id: v.id("users"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    }),
    staffProfile: v.union(
      v.object({
        _id: v.id("staff_profiles"),
        role: v.union(
          v.literal("admin"),
          v.literal("doctor"),
          v.literal("nurse"),
          v.literal("allied_health"),
          v.literal("support_staff"),
          v.literal("administrative_staff"),
          v.literal("technical_staff"),
          v.literal("training_research_staff"),
          v.literal("superadmin"),
          v.literal("editor")
        ),
        specialty: v.optional(v.string()),
        profileImage: v.optional(v.string()),
      }),
      v.null()
    ),
    lastTypingAt: v.number(),
  })),
  handler: async (ctx, { roomId, excludeUserId }) => {
    // Verify room exists
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Get typing statuses for this room
    const typingStatuses = await ctx.db
      .query("typing_status")
      .withIndex("by_roomId_isTyping", q => 
        q.eq("roomId", roomId).eq("isTyping", true)
      )
      .collect();

    // Filter out old typing statuses (older than 10 seconds) and excluded user
    const recentTypingStatuses = typingStatuses.filter(status => {
      const isRecent = Date.now() - status.lastTypingAt < 10000; // 10 seconds
      const isNotExcluded = !excludeUserId || status.userId !== excludeUserId;
      return isRecent && isNotExcluded;
    });

    // Get user information for each typing user
    const typingUsers = [];
    for (const status of recentTypingStatuses) {
      const user = await ctx.db.get(status.userId);
      if (!user) continue;

      // Check for staff profile
      const staffProfile = await ctx.db
        .query("staff_profiles")
        .withIndex("by_userId", q => q.eq("userId", status.userId))
        .first();

      typingUsers.push({
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        },
        staffProfile: staffProfile ? {
          _id: staffProfile._id,
          role: staffProfile.role,
          specialty: staffProfile.specialty,
          profileImage: staffProfile.profileImage,
        } : null,
        lastTypingAt: status.lastTypingAt,
      });
    }

    return typingUsers;
  },
});

// Clean up old typing statuses (can be called periodically or on cron)
export const cleanupOldTypingStatuses = mutation({
  args: {},
  returns: v.object({
    deletedCount: v.number(),
  }),
  handler: async (ctx) => {
    const cutoffTime = Date.now() - 30000; // 30 seconds ago
    
    const oldStatuses = await ctx.db
      .query("typing_status")
      .filter(q => q.lt(q.field("lastTypingAt"), cutoffTime))
      .collect();

    let deletedCount = 0;
    for (const status of oldStatuses) {
      await ctx.db.delete(status._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});

// Stop typing for a user (convenience function)
export const stopTyping = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, { roomId, userId }) => {
    return await ctx.runMutation("typing:setTypingStatus" as any, {
      roomId,
      userId,
      isTyping: false,
    });
  },
});

// Start typing for a user (convenience function)
export const startTyping = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, { roomId, userId }) => {
    return await ctx.runMutation("typing:setTypingStatus" as any, {
      roomId,
      userId,
      isTyping: true,
    });
  },
});
