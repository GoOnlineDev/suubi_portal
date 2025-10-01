import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create a new available time slot
export const createAvailableTime = mutation({
  args: {
    userId: v.id("users"),
    dayOfWeek: v.union(
      v.literal("Monday"),
      v.literal("Tuesday"),
      v.literal("Wednesday"),
      v.literal("Thursday"),
      v.literal("Friday"),
      v.literal("Saturday"),
      v.literal("Sunday")
    ),
    startTime: v.string(),
    endTime: v.string(),
    isRecurring: v.boolean(),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const newAvailableTime = {
      userId: args.userId,
      dayOfWeek: args.dayOfWeek,
      startTime: args.startTime,
      endTime: args.endTime,
      isRecurring: args.isRecurring,
      date: args.date,
      createdAt: Date.now(),
    };
    const availableTimeId = await ctx.db.insert("availableTimes", newAvailableTime);
    return availableTimeId;
  },
});

// Get available time slots for a user
export const getAvailableTimesByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("availableTimes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Update an available time slot
export const updateAvailableTime = mutation({
  args: {
    availableTimeId: v.id("availableTimes"),
    dayOfWeek: v.optional(v.union(
      v.literal("Monday"),
      v.literal("Tuesday"),
      v.literal("Wednesday"),
      v.literal("Thursday"),
      v.literal("Friday"),
      v.literal("Saturday"),
      v.literal("Sunday")
    )),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    isRecurring: v.optional(v.boolean()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { availableTimeId, ...rest } = args;
    return await ctx.db.patch(availableTimeId, { ...rest, updatedAt: Date.now() });
  },
});

// Delete an available time slot
export const deleteAvailableTime = mutation({
  args: { availableTimeId: v.id("availableTimes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.availableTimeId);
  },
});

// Get available time slots by day of week for a user
export const getAvailableTimesByDayOfWeek = query({
  args: {
    userId: v.id("users"),
    dayOfWeek: v.union(
      v.literal("Monday"),
      v.literal("Tuesday"),
      v.literal("Wednesday"),
      v.literal("Thursday"),
      v.literal("Friday"),
      v.literal("Saturday"),
      v.literal("Sunday")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("availableTimes")
      .withIndex("by_userId_dayOfWeek", (q) =>
        q.eq("userId", args.userId).eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();
  },
});

// Get available time slots by date for a user (for one-off slots)
export const getAvailableTimesByDate = query({
  args: {
    userId: v.id("users"),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("availableTimes")
      .withIndex("by_userId", (q) =>
        q.eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("date"), args.date))
      .collect();
  },
});

/**
 * Migration function to convert userId field to staffProfileId in availableTimes records
 * Run this once after schema update to fix existing data
 */
export const migrateAvailableTimes = mutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Get all availableTimes records
      const availableTimes = await ctx.db.query("availableTimes").collect();

      for (const timeSlot of availableTimes) {
        try {
          // Check if timeSlot needs migration
          const needsUserIdMigration = timeSlot.userId && !timeSlot.staffProfileId;
          const needsIsAvailableMigration = timeSlot.isAvailable === undefined;
          
          if (needsUserIdMigration || needsIsAvailableMigration) {
            const patchData: any = {
              updatedAt: Date.now(),
            };

            // Handle userId to staffProfileId migration
            if (needsUserIdMigration) {
              // Find the staff profile for this user
              const staffProfile = await ctx.db
                .query("staff_profiles")
                .withIndex("by_userId", (q) => q.eq("userId", timeSlot.userId!))
                .first();

              if (staffProfile) {
                patchData.staffProfileId = staffProfile._id;
                patchData.userId = undefined; // Remove the old field
              } else {
                // If no staff profile found, just remove the userId field
                patchData.userId = undefined;
              }
            }

            // Handle isAvailable migration
            if (needsIsAvailableMigration) {
              patchData.isAvailable = true; // Default to available
            }

            await ctx.db.patch(timeSlot._id, patchData);
            migratedCount++;
          }
        } catch (error) {
          errors.push(`Failed to migrate availableTime ${timeSlot._id}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Migration failed: ${error}`);
    }

    return {
      migratedCount,
      errors,
    };
  },
});
