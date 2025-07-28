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
      createdAt: Date.now(),
    });
    return id;
  },
}); 