import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// Get all approved programs, sorted by startDate descending
export const getApprovedPrograms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("programs")
      .withIndex("by_approved", q => q.eq("approved", true))
      .order("desc")
      .collect();
  },
});

// Get a single program by its id
export const getProgramById = query({
  args: { id: v.id("programs") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get approved programs by status
export const getApprovedProgramsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, { status }) => {
    return await ctx.db
      .query("programs")
      .withIndex("by_status_approved", q => q.eq("status", status).eq("approved", true))
      .order("desc")
      .collect();
  },
});

// Get featured and approved programs
export const getFeaturedApprovedPrograms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("programs")
      .withIndex("by_isFeatured_approved", q => q.eq("isFeatured", true).eq("approved", true))
      .order("desc")
      .collect();
  },
});

// Create program mutation
export const createProgram = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    goal: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    images: v.array(v.string()),
    videos: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    status: v.string(),
    contactPerson: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    relatedNewsIds: v.optional(v.array(v.id("news"))),
    isFeatured: v.boolean(),
    approved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Find the user in the users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Only allow editor, admin, superadmin to create programs
    if (!["editor", "admin", "superadmin"].includes(user.role)) {
      throw new Error("You do not have permission to create programs");
    }

    // Only admin and superadmin can set approved to true
    let approved = false;
    if (args.approved && ["admin", "superadmin"].includes(user.role)) {
      approved = args.approved;
    }

    const programId = await ctx.db.insert("programs", {
      name: args.name,
      description: args.description,
      goal: args.goal,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      images: args.images,
      videos: args.videos,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
      status: args.status,
      contactPerson: args.contactPerson,
      contactPhone: args.contactPhone,
      contactEmail: args.contactEmail,
      tags: args.tags,
      relatedNewsIds: args.relatedNewsIds,
      isFeatured: args.isFeatured,
      approved,
      createdById: user._id, // Include the creator's ID
    });
    return programId;
  },
});

// Delete program mutation
export const deleteProgram = mutation({
  args: { id: v.id("programs") },
  handler: async (ctx, { id }) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Find the user in the users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Get the program item
    const program = await ctx.db.get(id);
    if (!program) throw new Error("Program not found");

    // If approved, only admin and superadmin can delete
    if (program.approved) {
      if (!["admin", "superadmin"].includes(user.role)) {
        throw new Error("Only admin or superadmin can delete approved programs");
      }
    } else {
      // If not approved, allow editor, admin, superadmin
      if (!["editor", "admin", "superadmin"].includes(user.role)) {
        throw new Error("You do not have permission to delete this program");
      }
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});

// Update program mutation
export const updateProgram = mutation({
  args: {
    id: v.id("programs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    goal: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    videos: v.optional(v.array(v.string())),
    updatedAt: v.optional(v.number()),
    status: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    relatedNewsIds: v.optional(v.array(v.id("news"))),
    isFeatured: v.optional(v.boolean()),
    approved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    if (!["editor", "admin", "superadmin"].includes(user.role)) {
      throw new Error("You do not have permission to update programs");
    }

    // Get the program
    const program = await ctx.db.get(args.id);
    if (!program) throw new Error("Program not found");

    const patchData: Partial<Doc<"programs">> = {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.goal !== undefined && { goal: args.goal }),
      ...(args.startDate !== undefined && { startDate: args.startDate }),
      ...(args.endDate !== undefined && { endDate: args.endDate }),
      ...(args.location !== undefined && { location: args.location }),
      ...(args.images !== undefined && { images: args.images }),
      ...(args.videos !== undefined && { videos: args.videos }),
      ...(args.status !== undefined && { status: args.status }),
      ...(args.contactPerson !== undefined && { contactPerson: args.contactPerson }),
      ...(args.contactPhone !== undefined && { contactPhone: args.contactPhone }),
      ...(args.contactEmail !== undefined && { contactEmail: args.contactEmail }),
      ...(args.tags !== undefined && { tags: args.tags }),
      ...(args.relatedNewsIds !== undefined && { relatedNewsIds: args.relatedNewsIds }),
      ...(args.isFeatured !== undefined && { isFeatured: args.isFeatured }),
      updatedAt: Date.now(),
    };

    // Handle approval rights
    if (args.approved !== undefined) {
      if (["admin", "superadmin"].includes(user.role)) {
        patchData.approved = args.approved;
      } else if (program.approved && !args.approved) {
        // Allow editors to un-approve a program
        patchData.approved = false;
      }
    }
    
    await ctx.db.patch(args.id, patchData);
    return { success: true };
  },
});

// Get all unapproved programs
export const getUnapprovedPrograms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("programs")
      .withIndex("by_approved", q => q.eq("approved", false))
      .order("desc")
      .collect();
  },
});

// Get all programs
export const getAllPrograms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("programs").order("desc").collect();
  },
});

/**
 * Migration function to convert contactPerson field to contactPersonId in programs records
 * Run this once after schema update to fix existing data
 */
export const migrateProgramsContactPerson = mutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Get all programs records
      const programs = await ctx.db.query("programs").collect();

      for (const program of programs) {
        try {
          // Check if program needs migration
          const needsContactPersonMigration = program.contactPerson && !program.contactPersonId;
          const needsCreatedAtMigration = !program.createdAt;
          
          if (needsContactPersonMigration || needsCreatedAtMigration) {
            const patchData: any = {
              updatedAt: Date.now(),
            };

            // Handle contactPerson migration
            if (needsContactPersonMigration) {
              // Try to find the user by clerkId (assuming contactPerson is a clerkId)
              const user = await ctx.db
                .query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", program.contactPerson!))
                .first();

              if (user) {
                patchData.contactPersonId = user._id;
                patchData.contactPerson = undefined; // Remove the old field
              } else {
                patchData.contactPerson = undefined; // Remove the old field
              }
            }

            // Handle createdAt migration
            if (needsCreatedAtMigration) {
              patchData.createdAt = program._creationTime;
            }

            await ctx.db.patch(program._id, patchData);
            migratedCount++;
          }
        } catch (error) {
          errors.push(`Failed to migrate program ${program._id}: ${error}`);
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