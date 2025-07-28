import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createOrGetUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called createOrGetUser without authentication");
    }
    const clerkId = String(identity.subject || identity.id);
    const email = String(identity.email);
    const firstName = identity.firstName ? String(identity.firstName) : (identity.name ? String(identity.name) : undefined);
    const lastName = identity.lastName ? String(identity.lastName) : (identity.surname ? String(identity.surname) : undefined);
    const imageUrl = identity.imageUrl ? String(identity.imageUrl) : undefined;
    if (!clerkId || !email) {
      throw new Error("Missing required user data from JWT token");
    }
    // Check if the user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", clerkId)
      )
      .unique();
    if (user) {
      await ctx.db.patch(user._id, {
        email: email,
        firstName: firstName,
        lastName: lastName,
        imageUrl: imageUrl,
      });
      return user._id;
    }
    const userId = await ctx.db.insert("users", {
      clerkId: clerkId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      imageUrl: imageUrl,
      role: "patient"
    });
    return userId;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const clerkId = String(identity.subject || identity.id);
    if (!clerkId) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", clerkId))
      .unique();
    return user;
  },
});

// List all users
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(u => ({
      _id: u._id,
      clerkId: u.clerkId,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      imageUrl: u.imageUrl,
    }));
  },
});

// Add a test mutation to debug JWT token structure
export const debugAuth = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      hasIdentity: !!identity,
      identity: identity,
      timestamp: Date.now()
    };
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(
      v.literal("admin"),
      v.literal("patient"),
      v.literal("doctor"),
      v.literal("superadmin"),
      v.literal("editor"),
      v.literal("nurse") // Add nurse role here
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: args.newRole });
  },
}); 