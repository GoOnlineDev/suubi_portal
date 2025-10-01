import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Debug: Check for duplicate staff profiles
 */
export const checkDuplicateStaffProfiles = query({
  args: {},
  returns: v.object({
    totalProfiles: v.number(),
    uniqueUsers: v.number(),
    duplicateUsers: v.array(v.object({
      userId: v.id("users"),
      profileCount: v.number(),
      profileIds: v.array(v.id("staff_profiles")),
    })),
  }),
  handler: async (ctx) => {
    const staffProfiles = await ctx.db.query("staff_profiles").collect();
    
    // Group by userId
    const profilesByUser = new Map<string, string[]>();
    for (const profile of staffProfiles) {
      const userId = profile.userId;
      if (!profilesByUser.has(userId)) {
        profilesByUser.set(userId, []);
      }
      profilesByUser.get(userId)!.push(profile._id);
    }
    
    // Find duplicates
    const duplicates = [];
    for (const [userId, profileIds] of profilesByUser.entries()) {
      if (profileIds.length > 1) {
        duplicates.push({
          userId: userId as any,
          profileCount: profileIds.length,
          profileIds: profileIds as any[],
        });
      }
    }
    
    return {
      totalProfiles: staffProfiles.length,
      uniqueUsers: profilesByUser.size,
      duplicateUsers: duplicates,
    };
  },
});

/**
 * Debug: Delete specific staff profile
 */
export const deleteStaffProfile = mutation({
  args: {
    staffProfileId: v.id("staff_profiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.staffProfileId);
    return null;
  },
});

/**
 * Debug: Delete duplicate staff profiles (keep only the newest one per user)
 */
export const cleanupDuplicateStaffProfiles = mutation({
  args: {},
  returns: v.object({
    deletedCount: v.number(),
    keptProfiles: v.number(),
  }),
  handler: async (ctx) => {
    const staffProfiles = await ctx.db.query("staff_profiles").collect();
    
    // Group by userId and keep only the newest profile
    const profilesByUser = new Map();
    for (const profile of staffProfiles) {
      const existing = profilesByUser.get(profile.userId);
      if (!existing || profile._creationTime > existing._creationTime) {
        if (existing) {
          // Mark old profile for deletion
          await ctx.db.delete(existing._id);
        }
        profilesByUser.set(profile.userId, profile);
      } else {
        // This profile is older, delete it
        await ctx.db.delete(profile._id);
      }
    }
    
    return {
      deletedCount: staffProfiles.length - profilesByUser.size,
      keptProfiles: profilesByUser.size,
    };
  },
});

