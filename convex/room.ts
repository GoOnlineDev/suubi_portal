import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create or get a room for two users (patient-to-staff messaging)
export const createOrGetRoom = mutation({
  args: { 
    userId1: v.id("users"), 
    userId2: v.id("users"),
    roomType: v.optional(v.union(
      v.literal("direct"),
      v.literal("group"),
      v.literal("support")
    )),
  },
  returns: v.id("rooms"),
  handler: async (ctx, { userId1, userId2, roomType = "direct" }) => {
    // Verify both users exist
    const user1 = await ctx.db.get(userId1);
    const user2 = await ctx.db.get(userId2);
    
    if (!user1 || !user2) {
      throw new Error("One or both users not found");
    }

    // Always store userIds in sorted order for uniqueness
    const ids = [userId1, userId2].sort();
    
    // Check if room already exists by querying all rooms and filtering in JS
    // This is more reliable than complex Convex filters for array comparisons
    const allRooms = await ctx.db.query("rooms").collect();
    
    const existingRoom = allRooms.find(room => {
      // Check if room type matches
      if (room.type !== roomType) return false;
      
      // Check if it's a 2-person room
      if (room.userIds.length !== 2) return false;
      
      // Sort the room's userIds and compare with our sorted IDs
      const sortedRoomIds = [...room.userIds].sort();
      return sortedRoomIds[0] === ids[0] && sortedRoomIds[1] === ids[1];
    });

    if (existingRoom) {
      return existingRoom._id;
    }

    // Create new room
    const roomId = await ctx.db.insert("rooms", { 
      userIds: ids,
      type: roomType,
      createdAt: Date.now(),
    });
    
    return roomId;
  },
});

// Create or get room using staff profile ID (for patient-to-doctor messaging)
export const createOrGetRoomWithStaffProfile = mutation({
  args: {
    patientUserId: v.id("users"),
    staffProfileId: v.id("staff_profiles"),
  },
  returns: v.id("rooms"),
  handler: async (ctx, { patientUserId, staffProfileId }) => {
    // Verify patient exists
    const patient = await ctx.db.get(patientUserId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Get staff profile and corresponding user
    const staffProfile = await ctx.db.get(staffProfileId);
    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    const staffUser = await ctx.db.get(staffProfile.userId);
    if (!staffUser) {
      throw new Error("Staff user not found");
    }

    // Use the existing createOrGetRoom function
    return await ctx.runMutation("room:createOrGetRoom" as any, {
      userId1: patientUserId,
      userId2: staffProfile.userId,
      roomType: "support",
    });
  },
});

// List all rooms for a user with enhanced metadata
export const listRoomsForUser = query({
  args: { userId: v.id("users") },
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
    otherUser: v.union(
      v.object({
        _id: v.id("users"),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        email: v.string(),
      }),
      v.null()
    ),
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
        bio: v.optional(v.string()),
        profileImage: v.optional(v.string()),
        isAvailable: v.optional(v.boolean()),
      }),
      v.null()
    ),
    lastMessage: v.union(
      v.object({
        _id: v.id("messages"),
        content: v.string(),
        createdAt: v.number(),
        senderId: v.id("users"),
      }),
      v.null()
    ),
    unreadCount: v.number(),
  })),
  handler: async (ctx, { userId }) => {
    // Get all rooms where the user is a member
    const allRooms = await ctx.db.query("rooms").collect();
    const userRooms = allRooms.filter(room => room.userIds.includes(userId));

    const result = [];
    for (const room of userRooms) {
      // Get the other user in the room
      const otherUserId = room.userIds.find((id) => id !== userId);
      let otherUser = null;
      let staffProfile = null;

      if (otherUserId) {
        otherUser = await ctx.db.get(otherUserId);
        if (otherUser) {
          // Check if the other user has a staff profile
          const profile = await ctx.db
            .query("staff_profiles")
            .withIndex("by_userId", q => q.eq("userId", otherUserId))
            .first();
          
          if (profile) {
            staffProfile = {
              _id: profile._id,
              role: profile.role,
              specialty: profile.specialty,
              bio: profile.bio,
              profileImage: profile.profileImage,
              isAvailable: profile.isAvailable,
            };
          }
        }
      }

      // Get the latest message in this room
      const lastMessage = await ctx.db
        .query("messages")
        .withIndex("by_roomId_createdAt", q => q.eq("roomId", room._id))
        .order("desc")
        .first();

      // Get unread message count
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_roomId", q => q.eq("roomId", room._id))
        .filter(q => q.neq(q.field("senderId"), userId))
        .collect();

      let unreadCount = 0;
      for (const message of messages) {
        const readBy = message.readBy || [];
        const isRead = readBy.some(read => read.userId === userId);
        if (!isRead) {
          unreadCount++;
        }
      }

      result.push({
        room,
        otherUser: otherUser ? {
          _id: otherUser._id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          imageUrl: otherUser.imageUrl,
          email: otherUser.email,
        } : null,
        staffProfile,
        lastMessage: lastMessage ? {
          _id: lastMessage._id,
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.senderId,
        } : null,
        unreadCount,
      });
    }

    // Sort by last message time (most recent first)
    result.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.room.createdAt;
      const bTime = b.lastMessage?.createdAt || b.room.createdAt;
      return bTime - aTime;
    });

    return result;
  },
});

// Get room details with all participants
export const getRoomDetails = query({
  args: { roomId: v.id("rooms") },
  returns: v.union(
    v.object({
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
      participants: v.array(v.object({
        user: v.object({
          _id: v.id("users"),
          firstName: v.optional(v.string()),
          lastName: v.optional(v.string()),
          imageUrl: v.optional(v.string()),
          email: v.string(),
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
            bio: v.optional(v.string()),
            profileImage: v.optional(v.string()),
            isAvailable: v.optional(v.boolean()),
          }),
          v.null()
        ),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) {
      return null;
    }

    const participants = [];
    for (const userId of room.userIds) {
      const user = await ctx.db.get(userId);
      if (!user) continue;

      // Check for staff profile
      const staffProfile = await ctx.db
        .query("staff_profiles")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .first();

      participants.push({
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          email: user.email,
        },
        staffProfile: staffProfile ? {
          _id: staffProfile._id,
          role: staffProfile.role,
          specialty: staffProfile.specialty,
          bio: staffProfile.bio,
          profileImage: staffProfile.profileImage,
          isAvailable: staffProfile.isAvailable,
        } : null,
      });
    }

    return {
      room,
      participants,
    };
  },
});

// Update room metadata (name, etc.)
export const updateRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    updates: v.object({
      name: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { roomId, updates }) => {
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    await ctx.db.patch(roomId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Delete a room (admin function)
export const deleteRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"), // User requesting deletion
  },
  returns: v.null(),
  handler: async (ctx, { roomId, userId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Verify user is a member of the room
    if (!room.userIds.includes(userId)) {
      throw new Error("User is not a member of this room");
    }

    // Delete all messages in the room first
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_roomId", q => q.eq("roomId", roomId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete typing status entries for this room
    const typingStatuses = await ctx.db
      .query("typing_status")
      .withIndex("by_roomId", q => q.eq("roomId", roomId))
      .collect();

    for (const status of typingStatuses) {
      await ctx.db.delete(status._id);
    }

    // Delete the room
    await ctx.db.delete(roomId);

    return null;
  },
});

// Clean up duplicate rooms (admin function)
export const cleanupDuplicateRooms = mutation({
  args: {},
  returns: v.object({
    duplicatesFound: v.number(),
    duplicatesRemoved: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;

    try {
      // Get all rooms
      const allRooms = await ctx.db.query("rooms").collect();
      
      // Group rooms by their participant pairs and type
      const roomGroups = new Map<string, typeof allRooms>();
      
      for (const room of allRooms) {
        if (room.userIds.length === 2) {
          // Create a unique key for this room combination
          const sortedIds = [...room.userIds].sort();
          const key = `${sortedIds[0]}_${sortedIds[1]}_${room.type || 'direct'}`;
          
          if (!roomGroups.has(key)) {
            roomGroups.set(key, []);
          }
          roomGroups.get(key)!.push(room);
        }
      }
      
      // Find and remove duplicates (keep the oldest room)
      for (const [key, rooms] of roomGroups.entries()) {
        if (rooms.length > 1) {
          duplicatesFound += rooms.length - 1;
          
          // Sort by creation time (oldest first)
          rooms.sort((a, b) => a.createdAt - b.createdAt);
          
          // Keep the first (oldest) room, delete the rest
          const roomsToDelete = rooms.slice(1);
          
          for (const roomToDelete of roomsToDelete) {
            try {
              // Delete messages in this room first
              const messages = await ctx.db
                .query("messages")
                .withIndex("by_roomId", q => q.eq("roomId", roomToDelete._id))
                .collect();
              
              for (const message of messages) {
                await ctx.db.delete(message._id);
              }
              
              // Delete typing status entries
              const typingStatuses = await ctx.db
                .query("typing_status")
                .withIndex("by_roomId", q => q.eq("roomId", roomToDelete._id))
                .collect();
              
              for (const status of typingStatuses) {
                await ctx.db.delete(status._id);
              }
              
              // Delete the room
              await ctx.db.delete(roomToDelete._id);
              duplicatesRemoved++;
              
            } catch (error) {
              errors.push(`Failed to delete room ${roomToDelete._id}: ${error}`);
            }
          }
        }
      }
      
    } catch (error) {
      errors.push(`Cleanup failed: ${error}`);
    }

    return {
      duplicatesFound,
      duplicatesRemoved,
      errors,
    };
  },
});
