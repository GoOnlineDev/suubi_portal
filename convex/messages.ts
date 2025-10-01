import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// List messages in a room with pagination support
export const listMessages = query({
  args: { 
    roomId: v.id("rooms"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    messages: v.array(v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      roomId: v.id("rooms"),
      senderId: v.id("users"),
      content: v.string(),
      messageType: v.optional(v.union(
        v.literal("text"),
        v.literal("image"),
        v.literal("file"),
        v.literal("system")
      )),
      readBy: v.optional(v.array(v.object({
        userId: v.id("users"),
        readAt: v.number()
      }))),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      editedAt: v.optional(v.number()),
      sender: v.object({
        _id: v.id("users"),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      }),
    })),
    hasMore: v.boolean(),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, { roomId, limit = 50, cursor }) => {
    // Verify room exists
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    let query = ctx.db
      .query("messages")
      .withIndex("by_roomId_createdAt", q => q.eq("roomId", roomId))
      .order("desc");

    if (cursor) {
      // Parse cursor to get timestamp
      const cursorTime = parseInt(cursor, 10);
      query = query.filter(q => q.lt(q.field("createdAt"), cursorTime));
    }

    const messages = await query.take(limit + 1);
    const hasMore = messages.length > limit;
    const actualMessages = hasMore ? messages.slice(0, limit) : messages;

    // Get sender information for each message
    const messagesWithSenders = await Promise.all(
      actualMessages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        if (!sender) {
          throw new Error(`Sender not found for message ${message._id}`);
        }
        return {
          ...message,
          sender: {
            _id: sender._id,
            firstName: sender.firstName,
            lastName: sender.lastName,
            imageUrl: sender.imageUrl,
          },
        };
      })
    );

    return {
      messages: messagesWithSenders,
      hasMore,
      nextCursor: hasMore ? actualMessages[actualMessages.length - 1].createdAt.toString() : undefined,
    };
  },
});

// Send a message in a room
export const sendMessage = mutation({
  args: { 
    roomId: v.id("rooms"), 
    senderId: v.id("users"), 
    content: v.string(),
    messageType: v.optional(v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("file"),
      v.literal("system")
    )),
  },
  returns: v.id("messages"),
  handler: async (ctx, { roomId, senderId, content, messageType = "text" }) => {
    // Verify room exists
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Verify sender exists and is part of the room
    const sender = await ctx.db.get(senderId);
    if (!sender) {
      throw new Error("Sender not found");
    }

    if (!room.userIds.includes(senderId)) {
      throw new Error("Sender is not a member of this room");
    }

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      roomId,
      senderId,
      content: content.trim(),
      messageType,
      createdAt: Date.now(),
    });

    // Update room's last activity
    await ctx.db.patch(roomId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

// Mark message as read by a user
export const markMessageAsRead = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, { messageId, userId }) => {
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify user is part of the room
    const room = await ctx.db.get(message.roomId);
    if (!room || !room.userIds.includes(userId)) {
      throw new Error("User is not a member of this room");
    }

    // Don't mark own messages as read
    if (message.senderId === userId) {
      return null;
    }

    const currentReadBy = message.readBy || [];
    const alreadyRead = currentReadBy.some(read => read.userId === userId);

    if (!alreadyRead) {
      const newReadBy = [...currentReadBy, {
        userId,
        readAt: Date.now(),
      }];

      await ctx.db.patch(messageId, {
        readBy: newReadBy,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

// Mark all messages in a room as read by a user
export const markAllMessagesAsRead = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, { roomId, userId }) => {
    // Verify room exists and user is a member
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (!room.userIds.includes(userId)) {
      throw new Error("User is not a member of this room");
    }

    // Get all unread messages in the room (excluding user's own messages)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_roomId", q => q.eq("roomId", roomId))
      .filter(q => q.neq(q.field("senderId"), userId))
      .collect();

    const now = Date.now();

    // Mark each message as read if not already read by this user
    await Promise.all(
      messages.map(async (message) => {
        const currentReadBy = message.readBy || [];
        const alreadyRead = currentReadBy.some(read => read.userId === userId);

        if (!alreadyRead) {
          const newReadBy = [...currentReadBy, {
            userId,
            readAt: now,
          }];

          await ctx.db.patch(message._id, {
            readBy: newReadBy,
            updatedAt: now,
          });
        }
      })
    );

    return null;
  },
});

// Get latest message for a room
export const getLatestMessageForRoom = query({
  args: { roomId: v.id("rooms") },
  returns: v.union(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      roomId: v.id("rooms"),
      senderId: v.id("users"),
      content: v.string(),
      messageType: v.optional(v.union(
        v.literal("text"),
        v.literal("image"),
        v.literal("file"),
        v.literal("system")
      )),
      readBy: v.optional(v.array(v.object({
        userId: v.id("users"),
        readAt: v.number()
      }))),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      editedAt: v.optional(v.number()),
      sender: v.object({
        _id: v.id("users"),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, { roomId }) => {
    const message = await ctx.db
      .query("messages")
      .withIndex("by_roomId_createdAt", q => q.eq("roomId", roomId))
      .order("desc")
      .first();

    if (!message) {
      return null;
    }

    const sender = await ctx.db.get(message.senderId);
    if (!sender) {
      throw new Error(`Sender not found for message ${message._id}`);
    }

    return {
      ...message,
      sender: {
        _id: sender._id,
        firstName: sender.firstName,
        lastName: sender.lastName,
        imageUrl: sender.imageUrl,
      },
    };
  },
});

// Get latest messages for multiple rooms (for chat list)
export const getLatestMessagesForRooms = query({
  args: { roomIds: v.array(v.id("rooms")) },
  returns: v.record(v.id("rooms"), v.union(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      roomId: v.id("rooms"),
      senderId: v.id("users"),
      content: v.string(),
      messageType: v.optional(v.union(
        v.literal("text"),
        v.literal("image"),
        v.literal("file"),
        v.literal("system")
      )),
      readBy: v.optional(v.array(v.object({
        userId: v.id("users"),
        readAt: v.number()
      }))),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      editedAt: v.optional(v.number()),
      sender: v.object({
        _id: v.id("users"),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      }),
    }),
    v.null()
  )),
  handler: async (ctx, { roomIds }) => {
    const result: Record<Id<"rooms">, any> = {};
    
    for (const roomId of roomIds) {
      const message = await ctx.db
        .query("messages")
        .withIndex("by_roomId_createdAt", q => q.eq("roomId", roomId))
        .order("desc")
        .first();

      if (message) {
        const sender = await ctx.db.get(message.senderId);
        if (sender) {
          result[roomId] = {
            ...message,
            sender: {
              _id: sender._id,
              firstName: sender.firstName,
              lastName: sender.lastName,
              imageUrl: sender.imageUrl,
            },
          };
        }
      }
    }
    
    return result;
  },
});

// Get unread message count for a user in a room
export const getUnreadMessageCount = query({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  returns: v.number(),
  handler: async (ctx, { roomId, userId }) => {
    // Verify room exists and user is a member
    const room = await ctx.db.get(roomId);
    if (!room || !room.userIds.includes(userId)) {
      return 0;
    }

    // Get all messages in the room (excluding user's own messages)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_roomId", q => q.eq("roomId", roomId))
      .filter(q => q.neq(q.field("senderId"), userId))
      .collect();

    // Count unread messages
    let unreadCount = 0;
    for (const message of messages) {
      const readBy = message.readBy || [];
      const isRead = readBy.some(read => read.userId === userId);
      if (!isRead) {
        unreadCount++;
      }
    }

    return unreadCount;
  },
});

// Get unread message counts for multiple rooms
export const getUnreadMessageCounts = query({
  args: {
    roomIds: v.array(v.id("rooms")),
    userId: v.id("users"),
  },
  returns: v.record(v.id("rooms"), v.number()),
  handler: async (ctx, { roomIds, userId }) => {
    const result: Record<Id<"rooms">, number> = {};

    for (const roomId of roomIds) {
      const count = await ctx.runQuery("messages:getUnreadMessageCount" as any, {
        roomId,
        userId,
      });
      result[roomId] = count;
    }

    return result;
  },
});

// ===== ADMIN FUNCTIONS =====

/**
 * Get all chat rooms for all staff members (admin only)
 */
export const getAllStaffRoomsForAdmin = query({
  args: {
    adminUserId: v.id("users"),
    staffProfileId: v.optional(v.id("staff_profiles")), // Filter by specific staff member
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    room: v.object({
      _id: v.id("rooms"),
      _creationTime: v.number(),
      userIds: v.array(v.id("users")),
      name: v.optional(v.string()),
      type: v.optional(v.union(
        v.literal("direct"),
        v.literal("group"),
        v.literal("support")
      )),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
    staffMember: v.object({
      _id: v.id("users"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.string(),
      imageUrl: v.optional(v.string()),
    }),
    patient: v.object({
      _id: v.id("users"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.string(),
      imageUrl: v.optional(v.string()),
    }),
    lastMessage: v.union(
      v.object({
        _id: v.id("messages"),
        content: v.string(),
        senderId: v.id("users"),
        createdAt: v.number(),
      }),
      v.null()
    ),
    unreadCount: v.number(),
  })),
  handler: async (ctx, args) => {
    // Verify admin has permission
    const adminProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.adminUserId))
      .first();

    if (!adminProfile || !["admin", "superadmin"].includes(adminProfile.role)) {
      throw new Error("Unauthorized: Only admins can view all staff rooms");
    }

    // Get all staff profiles
    let staffProfiles = await ctx.db.query("staff_profiles").collect();

    // Filter by specific staff member if provided
    if (args.staffProfileId) {
      staffProfiles = staffProfiles.filter(profile => profile._id === args.staffProfileId);
    }

    // Get all rooms involving staff members
    const allRooms = await ctx.db.query("rooms").collect();
    
    const staffRooms: Array<{
      room: any;
      staffMember: any;
      patient: any;
      lastMessage: any;
      unreadCount: number;
    }> = [];

    for (const room of allRooms) {
      // Check if any staff member is in this room
      for (const staffProfile of staffProfiles) {
        const staffUserId = staffProfile.userId;
        
        if (room.userIds.includes(staffUserId)) {
          // This room includes a staff member
          const staffUser = await ctx.db.get(staffUserId);
          if (!staffUser) continue;

          // Get the other user (patient)
          const patientUserId = room.userIds.find(id => id !== staffUserId);
          if (!patientUserId) continue;

          const patientUser = await ctx.db.get(patientUserId);
          if (!patientUser) continue;

          // Get last message
          const lastMessage = await ctx.db
            .query("messages")
            .withIndex("by_roomId_createdAt", q => q.eq("roomId", room._id))
            .order("desc")
            .first();

          // Get unread count for staff member
          const messages = await ctx.db
            .query("messages")
            .withIndex("by_roomId", q => q.eq("roomId", room._id))
            .filter(q => q.neq(q.field("senderId"), staffUserId))
            .collect();

          let unreadCount = 0;
          for (const message of messages) {
            const readBy = message.readBy || [];
            const isRead = readBy.some(read => read.userId === staffUserId);
            if (!isRead) {
              unreadCount++;
            }
          }

          staffRooms.push({
            room,
            staffMember: {
              _id: staffUser._id,
              firstName: staffUser.firstName,
              lastName: staffUser.lastName,
              email: staffUser.email,
              imageUrl: staffUser.imageUrl,
            },
            patient: {
              _id: patientUser._id,
              firstName: patientUser.firstName,
              lastName: patientUser.lastName,
              email: patientUser.email,
              imageUrl: patientUser.imageUrl,
            },
            lastMessage: lastMessage ? {
              _id: lastMessage._id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            } : null,
            unreadCount,
          });
        }
      }
    }

    // Sort by last message time (most recent first)
    staffRooms.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || 0;
      const bTime = b.lastMessage?.createdAt || 0;
      return bTime - aTime;
    });

    // Limit results
    if (args.limit) {
      return staffRooms.slice(0, args.limit);
    }

    return staffRooms;
  },
});

/**
 * Send message on behalf of a staff member (admin only)
 */
export const sendMessageOnBehalfOf = mutation({
  args: {
    adminUserId: v.id("users"),
    roomId: v.id("rooms"),
    staffUserId: v.id("users"), // The staff member on whose behalf the admin is sending
    content: v.string(),
    messageType: v.optional(v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("file"),
      v.literal("system")
    )),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    // Verify admin has permission
    const adminProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.adminUserId))
      .first();

    if (!adminProfile || !["admin", "superadmin"].includes(adminProfile.role)) {
      throw new Error("Unauthorized: Only admins can send messages on behalf of staff");
    }

    // Verify room exists
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Verify staff user exists and is part of the room
    const staffUser = await ctx.db.get(args.staffUserId);
    if (!staffUser) {
      throw new Error("Staff user not found");
    }

    if (!room.userIds.includes(args.staffUserId)) {
      throw new Error("Staff user is not a member of this room");
    }

    // Insert the message (sent by the staff member, but initiated by admin)
    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      senderId: args.staffUserId, // Message appears to be from the staff member
      content: args.content.trim(),
      messageType: args.messageType || "text",
      createdAt: Date.now(),
    });

    // Update room's last activity
    await ctx.db.patch(args.roomId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Get message statistics for admin dashboard
 */
export const getMessageStatsForAdmin = query({
  args: {
    adminUserId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    totalRooms: v.number(),
    totalMessages: v.number(),
    unreadMessages: v.number(),
    byStaff: v.array(v.object({
      staffUserId: v.id("users"),
      staffName: v.string(),
      roomCount: v.number(),
      messageCount: v.number(),
      unreadCount: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    // Verify admin has permission
    const adminProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.adminUserId))
      .first();

    if (!adminProfile || !["admin", "superadmin"].includes(adminProfile.role)) {
      throw new Error("Unauthorized: Only admins can view message statistics");
    }

    // Get all staff profiles
    const staffProfiles = await ctx.db.query("staff_profiles").collect();
    
    // Get all rooms and messages
    const allRooms = await ctx.db.query("rooms").collect();
    let allMessages = await ctx.db.query("messages").collect();

    // Apply date filters
    if (args.startDate) {
      allMessages = allMessages.filter(msg => msg.createdAt >= args.startDate!);
    }

    if (args.endDate) {
      allMessages = allMessages.filter(msg => msg.createdAt <= args.endDate!);
    }

    // Calculate statistics per staff member
    const byStaff: Array<{
      staffUserId: Id<"users">;
      staffName: string;
      roomCount: number;
      messageCount: number;
      unreadCount: number;
    }> = [];

    for (const staffProfile of staffProfiles) {
      const staffUserId = staffProfile.userId;
      const staffUser = await ctx.db.get(staffUserId);
      if (!staffUser) continue;

      // Count rooms involving this staff member
      const staffRooms = allRooms.filter(room => room.userIds.includes(staffUserId));
      
      // Count messages in these rooms
      const staffMessages = allMessages.filter(msg => 
        staffRooms.some(room => room._id === msg.roomId)
      );

      // Count unread messages for this staff member
      let unreadCount = 0;
      for (const message of staffMessages) {
        if (message.senderId === staffUserId) continue; // Don't count own messages
        const readBy = message.readBy || [];
        const isRead = readBy.some(read => read.userId === staffUserId);
        if (!isRead) {
          unreadCount++;
        }
      }

      byStaff.push({
        staffUserId,
        staffName: `${staffUser.firstName || ""} ${staffUser.lastName || ""}`.trim() || staffUser.email,
        roomCount: staffRooms.length,
        messageCount: staffMessages.length,
        unreadCount,
      });
    }

    // Sort by message count (descending)
    byStaff.sort((a, b) => b.messageCount - a.messageCount);

    // Calculate total unread messages
    let totalUnreadMessages = 0;
    for (const message of allMessages) {
      const readBy = message.readBy || [];
      // Count as unread if not read by at least one staff member in the room
      const room = await ctx.db.get(message.roomId);
      if (room) {
        for (const userId of room.userIds) {
          const staffProfile = staffProfiles.find(sp => sp.userId === userId);
          if (staffProfile && userId !== message.senderId) {
            const isRead = readBy.some(read => read.userId === userId);
            if (!isRead) {
              totalUnreadMessages++;
              break; // Only count once per message
            }
          }
        }
      }
    }

    return {
      totalRooms: allRooms.length,
      totalMessages: allMessages.length,
      unreadMessages: totalUnreadMessages,
      byStaff,
    };
  },
});