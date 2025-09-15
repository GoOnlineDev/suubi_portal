import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAllSubscribers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subscribers").collect();
  },
});

export const addSubscriber = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // Check if already subscribed
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", q => q.eq("email", email))
      .unique();
    if (existing) return existing._id;
    // Add new subscriber
    const id = await ctx.db.insert("subscribers", {
      email,
      isActive: true,
      createdAt: Date.now(),
    });
    return id;
  },
});

/**
 * Migration function to add isActive field to existing subscribers records
 * Run this once after schema update to fix existing data
 */
export const migrateSubscribersIsActive = mutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Get all subscribers records
      const subscribers = await ctx.db.query("subscribers").collect();

      for (const subscriber of subscribers) {
        try {
          // Check if subscriber needs migration
          const needsIsActiveMigration = subscriber.isActive === undefined;
          
          if (needsIsActiveMigration) {
            await ctx.db.patch(subscriber._id, {
              isActive: true, // Default to active for existing subscribers
              updatedAt: Date.now(),
            });
            migratedCount++;
          }
        } catch (error) {
          errors.push(`Failed to migrate subscriber ${subscriber._id}: ${error}`);
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