import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// Get all published news, sorted by publishedAt descending
export const getPublishedNews = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("news")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .order("desc")
      .collect();
  },
});

// Get a single news article by its id
export const getNewsById = query({
  args: { id: v.id("news") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get published news by category
export const getPublishedNewsByCategory = query({
  args: {
    category: v.union(
      v.literal("Announcements"),
      v.literal("Health Tips"),
      v.literal("Community Programs"),
      v.literal("Medical Updates"),
      v.literal("Staff Highlights"),
      v.literal("Success Stories"),
      v.literal("Event Recaps"),
      v.literal("Policy Changes"),
      v.literal("Emergency Alerts"),
      v.literal("Research & Innovation")
    )
  },
  handler: async (ctx, { category }) => {
    return await ctx.db
      .query("news")
      .withIndex("by_category_isPublished", q => q.eq("category", category).eq("isPublished", true))
      .order("desc")
      .collect();
  },
});

// Get published news by institution
export const getPublishedNewsByInstitution = query({
  args: {
    institution: v.optional(
      v.union(
        v.literal("Boost Health Initiative"),
        v.literal("Suubi Medical Centre"),
        v.string()
      )
    ),
  },
  handler: async (ctx, { institution }) => {
    return await ctx.db
      .query("news")
      .withIndex("by_institution_isPublished", q => q.eq("institution", institution).eq("isPublished", true))
      .order("desc")
      .collect();
  },
});

// Get all news that is not published (for review by editors, admins, superadmins)
export const getUnpublishedNews = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("news")
      .withIndex("by_isPublished", q => q.eq("isPublished", false))
      .order("desc")
      .collect();
  },
});

// Get all news items
export const getAllNews = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("news").order("desc").collect();
  },
});

// Create news mutation
export const createNews = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    summary: v.string(),
    images: v.array(v.string()),
    videos: v.optional(v.array(v.string())),
    category: v.union(
      v.literal("Announcements"),
      v.literal("Health Tips"),
      v.literal("Community Programs"),
      v.literal("Medical Updates"),
      v.literal("Staff Highlights"),
      v.literal("Success Stories"),
      v.literal("Event Recaps"),
      v.literal("Policy Changes"),
      v.literal("Emergency Alerts"),
      v.literal("Research & Innovation")
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    publishedAt: v.number(),
    updatedAt: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    institution: v.optional(
      v.union(
        v.literal("Boost Health Initiative"),
        v.literal("Suubi Medical Centre"),
        v.string()
      )
    ),
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

    // Check if user has staff profile with appropriate role
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!staffProfile || !["editor", "admin", "superadmin"].includes(staffProfile.role)) {
      throw new Error("You do not have permission to create news");
    }

    // Only admin and superadmin can set isPublished to true
    let isPublished = false;
    if (args.isPublished && ["admin", "superadmin"].includes(staffProfile.role)) {
      isPublished = args.isPublished;
    }

    const newsId = await ctx.db.insert("news", {
      title: args.title,
      content: args.content,
      summary: args.summary,
      authorId: user._id,
      images: args.images,
      videos: args.videos,
      category: args.category,
      startDate: args.startDate,
      endDate: args.endDate,
      publishedAt: args.publishedAt,
      updatedAt: args.updatedAt,
      createdAt: Date.now(),
      isPublished,
      tags: args.tags,
      institution: args.institution,
    });
    return newsId;
  },
});

// Delete news mutation
export const deleteNews = mutation({
  args: { id: v.id("news") },
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

    // Get the news item
    // Check if user has staff profile with appropriate role
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!staffProfile) {
      throw new Error("You do not have permission to delete news");
    }

    const news = await ctx.db.get(id);
    if (!news) throw new Error("News not found");

    // If published, only admin and superadmin can delete
    if (news.isPublished) {
      if (!["admin", "superadmin"].includes(staffProfile.role)) {
        throw new Error("Only admin or superadmin can delete published news");
      }
    } else {
      // If not published, allow editor, admin, superadmin
      if (!["editor", "admin", "superadmin"].includes(staffProfile.role)) {
        throw new Error("You do not have permission to delete this news");
      }
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});

// Update news mutation
export const updateNews = mutation({
  args: {
    id: v.id("news"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    summary: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    videos: v.optional(v.array(v.string())),
    category: v.optional(v.union(
      v.literal("Announcements"),
      v.literal("Health Tips"),
      v.literal("Community Programs"),
      v.literal("Medical Updates"),
      v.literal("Staff Highlights"),
      v.literal("Success Stories"),
      v.literal("Event Recaps"),
      v.literal("Policy Changes"),
      v.literal("Emergency Alerts"),
      v.literal("Research & Innovation")
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    institution: v.optional(
      v.union(
        v.literal("Boost Health Initiative"),
        v.literal("Suubi Medical Centre"),
        v.string()
      )
    ),
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

    // Check if user has staff profile with appropriate role
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!staffProfile || !["editor", "admin", "superadmin"].includes(staffProfile.role)) {
      throw new Error("You do not have permission to update news");
    }

    // Get the news item
    const news = await ctx.db.get(args.id);
    if (!news) throw new Error("News not found");

    const patchData: Partial<Doc<"news">> = {
      ...(args.title !== undefined && { title: args.title }),
      ...(args.content !== undefined && { content: args.content }),
      ...(args.summary !== undefined && { summary: args.summary }),
      ...(args.images !== undefined && { images: args.images }),
      ...(args.videos !== undefined && { videos: args.videos }),
      ...(args.category !== undefined && { category: args.category }),
      ...(args.startDate !== undefined && { startDate: args.startDate }),
      ...(args.endDate !== undefined && { endDate: args.endDate }),
      ...(args.tags !== undefined && { tags: args.tags }),
      ...(args.institution !== undefined && { institution: args.institution }),
      updatedAt: Date.now(),
    };

    // Handle publishing rights
    if (args.isPublished !== undefined) {
      if (["admin", "superadmin"].includes(staffProfile.role)) {
        patchData.isPublished = args.isPublished;
        if (args.isPublished && !news.publishedAt) {
          patchData.publishedAt = Date.now();
        }
      } else if (news.isPublished && !args.isPublished) {
        // Allow editors to unpublish an article
        patchData.isPublished = false;
      }
    }

    await ctx.db.patch(args.id, patchData);
    return { success: true };
  },
});

/**
 * Migration function to convert author field to authorId in news records
 * Run this once after schema update to fix existing data
 */
export const migrateNewsAuthor = mutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Get all news records
      const newsItems = await ctx.db.query("news").collect();

      for (const item of newsItems) {
        try {
          // Check if item needs migration
          const needsAuthorMigration = item.author && !item.authorId;
          const needsCreatedAtMigration = !item.createdAt;
          
          if (needsAuthorMigration || needsCreatedAtMigration) {
            const patchData: any = {
              updatedAt: Date.now(),
            };

            // Handle author migration
            if (needsAuthorMigration) {
              // Try to find the user by clerkId (assuming author is a clerkId)
              const user = await ctx.db
                .query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", item.author!))
                .first();

              if (user) {
                patchData.authorId = user._id;
                patchData.author = undefined; // Remove the old field
              } else {
                patchData.author = undefined; // Remove the old field
              }
            }

            // Handle createdAt migration
            if (needsCreatedAtMigration) {
              patchData.createdAt = item._creationTime;
            }

            await ctx.db.patch(item._id, patchData);
            migratedCount++;
          }
        } catch (error) {
          errors.push(`Failed to migrate news item ${item._id}: ${error}`);
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