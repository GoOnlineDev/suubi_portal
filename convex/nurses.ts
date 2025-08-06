import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create a new nurse profile
export const createNurse = mutation({
  args: {
    userId: v.id("users"),
    subRole: v.optional(v.string()), // e.g., "registered_nurse", "practical_nurse", "nurse_practitioner"
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
      role: "nurse" as const,
      subRole: args.subRole,
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
    const nurseId = await ctx.db.insert("staff_profiles", newNurse);
    await ctx.db.patch(args.userId, { role: "nurse", subRole: args.subRole }); // Update user role
    return nurseId;
  },
});

// Get a nurse profile by userId
export const getNurseByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("role"), "nurse"))
      .unique();
  },
});

// Get a nurse profile by nurse ID
export const getNurseById = query({
  args: { nurseId: v.id("staff_profiles") },
  handler: async (ctx, args) => {
    const nurse = await ctx.db.get(args.nurseId);
    if (nurse && nurse.role === "nurse") {
      return nurse;
    }
    return null;
  },
});

// List all nurses
export const listNurses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("staff_profiles")
      .withIndex("by_role", (q) => q.eq("role", "nurse"))
      .collect();
  },
});

// List nurses by sub-role
export const listNursesBySubRole = query({
  args: { subRole: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("staff_profiles")
      .withIndex("by_role_subRole", (q) => 
        q.eq("role", "nurse").eq("subRole", args.subRole)
      )
      .collect();
  },
});

// Update a nurse profile
export const updateNurse = mutation({
  args: {
    userId: v.id("users"),
    subRole: v.optional(v.string()),
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
    const nurse = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("role"), "nurse"))
      .unique();
    
    if (!nurse) {
      throw new Error("Nurse not found");
    }

    const updateData: any = { updatedAt: Date.now() };
    if (args.subRole !== undefined) updateData.subRole = args.subRole;
    if (args.licenseNumber !== undefined) updateData.licenseNumber = args.licenseNumber;
    if (args.qualifications !== undefined) updateData.qualifications = args.qualifications;
    if (args.experience !== undefined) updateData.experience = args.experience;
    if (args.bio !== undefined) updateData.bio = args.bio;
    if (args.languages !== undefined) updateData.languages = args.languages;
    if (args.isAvailable !== undefined) updateData.isAvailable = args.isAvailable;
    if (args.profileImage !== undefined) updateData.profileImage = args.profileImage;
    if (args.verified !== undefined) updateData.verified = args.verified;
    if (args.rating !== undefined) updateData.rating = args.rating;
    if (args.totalReviews !== undefined) updateData.totalReviews = args.totalReviews;

    await ctx.db.patch(nurse._id, updateData);
    return nurse._id;
  },
});

// Delete a nurse profile
export const deleteNurse = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const nurse = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("role"), "nurse"))
      .unique();
    
    if (nurse) {
      await ctx.db.delete(nurse._id);
      await ctx.db.patch(args.userId, { role: "patient", subRole: undefined });
    }
  },
});
