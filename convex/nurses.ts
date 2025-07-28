import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create a new nurse profile
export const createNurse = mutation({
  args: {
    userId: v.id("users"),
    licenseNumber: v.string(),
    qualifications: v.array(v.string()),
    experience: v.number(),
    bio: v.optional(v.string()),
    languages: v.array(v.string()),
    isAvailable: v.optional(v.boolean()),
    profileImage: v.optional(v.string()),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const newNurse = {
      userId: args.userId,
      licenseNumber: args.licenseNumber,
      qualifications: args.qualifications,
      experience: args.experience,
      bio: args.bio,
      languages: args.languages,
      isAvailable: args.isAvailable,
      profileImage: args.profileImage,
      verified: args.verified,
      createdAt: Date.now(),
      rating: 0, // Initialize rating
      totalReviews: 0, // Initialize total reviews
    };
    const nurseId = await ctx.db.insert("nurses", newNurse);
    await ctx.db.patch(args.userId, { role: "nurse" }); // Update user role
    return nurseId;
  },
});

// Get a nurse profile by userId
export const getNurseByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nurses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get a nurse profile by nurse ID
export const getNurseById = query({
  args: { nurseId: v.id("nurses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.nurseId);
  },
});

// Update a nurse profile
export const updateNurse = mutation({
  args: {
    nurseId: v.id("nurses"),
    licenseNumber: v.optional(v.string()),
    qualifications: v.optional(v.array(v.string())),
    experience: v.optional(v.number()),
    bio: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
    isAvailable: v.optional(v.boolean()),
    profileImage: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    totalReviews: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { nurseId, ...rest } = args;
    return await ctx.db.patch(nurseId, { ...rest, updatedAt: Date.now() });
  },
});

// Delete a nurse profile
export const deleteNurse = mutation({
  args: { nurseId: v.id("nurses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.nurseId);
  },
});