import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create a new doctor profile
export const createDoctor = mutation({
  args: {
    userId: v.id("users"),
    subRole: v.optional(v.string()), // e.g., "surgeon", "cardiologist", "pediatrician"
    specialty: v.optional(v.string()),
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
      role: "doctor" as const,
      subRole: args.subRole,
      specialty: args.specialty,
      licenseNumber: args.licenseNumber,
      qualifications: args.qualifications,
      experience: args.experience,
      bio: args.bio,
      languages: args.languages,
      consultationFee: args.consultationFee,
      isAvailable: args.isAvailable,
      profileImage: args.profileImage,
      verified: args.verified,
      createdAt: Date.now(),
      rating: 0, // Initialize rating
      totalReviews: 0, // Initialize total reviews
    };
    const doctorId = await ctx.db.insert("staff_profiles", newDoctor);
    await ctx.db.patch(args.userId, { role: "doctor", subRole: args.subRole }); // Update user role
    return doctorId;
  },
});

// Get a doctor profile by userId
export const getDoctorByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("role"), "doctor"))
      .unique();
  },
});

// Get a doctor profile by doctor ID
export const getDoctorById = query({
  args: { doctorId: v.id("staff_profiles") },
  handler: async (ctx, args) => {
    const doctor = await ctx.db.get(args.doctorId);
    if (doctor && doctor.role === "doctor") {
      return doctor;
    }
    return null;
  },
});

// List all doctors
export const listDoctors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("staff_profiles")
      .withIndex("by_role", (q) => q.eq("role", "doctor"))
      .collect();
  },
});

// List doctors by sub-role
export const listDoctorsBySubRole = query({
  args: { subRole: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("staff_profiles")
      .withIndex("by_role_subRole", (q) => 
        q.eq("role", "doctor").eq("subRole", args.subRole)
      )
      .collect();
  },
});

// Update a doctor profile
export const updateDoctor = mutation({
  args: {
    userId: v.id("users"),
    subRole: v.optional(v.string()),
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
    const doctor = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("role"), "doctor"))
      .unique();
    
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const updateData: any = { updatedAt: Date.now() };
    if (args.subRole !== undefined) updateData.subRole = args.subRole;
    if (args.specialty !== undefined) updateData.specialty = args.specialty;
    if (args.licenseNumber !== undefined) updateData.licenseNumber = args.licenseNumber;
    if (args.qualifications !== undefined) updateData.qualifications = args.qualifications;
    if (args.experience !== undefined) updateData.experience = args.experience;
    if (args.bio !== undefined) updateData.bio = args.bio;
    if (args.languages !== undefined) updateData.languages = args.languages;
    if (args.consultationFee !== undefined) updateData.consultationFee = args.consultationFee;
    if (args.isAvailable !== undefined) updateData.isAvailable = args.isAvailable;
    if (args.profileImage !== undefined) updateData.profileImage = args.profileImage;
    if (args.verified !== undefined) updateData.verified = args.verified;
    if (args.rating !== undefined) updateData.rating = args.rating;
    if (args.totalReviews !== undefined) updateData.totalReviews = args.totalReviews;

    await ctx.db.patch(doctor._id, updateData);
    return doctor._id;
  },
});

// Delete a doctor profile
export const deleteDoctor = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const doctor = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("role"), "doctor"))
      .unique();
    
    if (doctor) {
      await ctx.db.delete(doctor._id);
      await ctx.db.patch(args.userId, { role: "patient", subRole: undefined });
    }
  },
});
