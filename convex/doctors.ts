import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create a new doctor profile
export const createDoctor = mutation({
  args: {
    userId: v.id("users"),
    specialty: v.string(),
    licenseNumber: v.string(),
    qualifications: v.array(v.string()),
    experience: v.number(),
    bio: v.optional(v.string()),
    languages: v.array(v.string()),
    consultationFee: v.optional(v.number()),
    isAvailable: v.optional(v.boolean()),
    profileImage: v.optional(v.string()),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const newDoctor = {
      userId: args.userId,
      specialty: args.specialty,
      licenseNumber: args.licenseNumber,
      qualifications: args.qualifications,
      experience: args.experience,
      bio: args.bio,
      languages: args.languages,
      consultationFee: args.consultationFee,
      verified: args.verified,
      createdAt: Date.now(),
      rating: 0, // Initialize rating
      totalReviews: 0, // Initialize total reviews
    };
    const doctorId = await ctx.db.insert("doctors", newDoctor);
    await ctx.db.patch(args.userId, { role: "doctor" }); // Update user role
    return doctorId;
  },
});

// Get a doctor profile by userId
export const getDoctorByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("doctors")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get a doctor profile by doctor ID
export const getDoctorById = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.doctorId);
  },
});

// Update a doctor profile
export const updateDoctor = mutation({
  args: {
    doctorId: v.id("doctors"),
    specialty: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    qualifications: v.optional(v.array(v.string())),
    experience: v.optional(v.number()),
    bio: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
    consultationFee: v.optional(v.number()),
    isAvailable: v.optional(v.boolean()),
    profileImage: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    totalReviews: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { doctorId, ...rest } = args;
    return await ctx.db.patch(doctorId, { ...rest, updatedAt: Date.now() });
  },
});

// Delete a doctor profile
export const deleteDoctor = mutation({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.doctorId);
  },
});
