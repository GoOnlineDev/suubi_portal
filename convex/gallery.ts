import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// Get all published gallery items, sorted by date descending
export const getPublishedGallery = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("gallery")
      .withIndex("by_isPublished", (q) => q.eq("isPublished", true))
      .order("desc")
      .collect();
  },
});

// Get a single gallery item by its id
export const getGalleryItemById = query({
  args: { id: v.id("gallery") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get published gallery items by category
export const getPublishedGalleryByCategory = query({
  args: {
    category: v.union(
      v.literal("Maternal Health"),
      v.literal("Education"),
      v.literal("Mental Health"),
      v.literal("Clinical Services"),
      v.literal("Laboratory"),
      v.literal("Facilities"),
      v.literal("Community Outreach"),
      v.literal("Youth Services"),
      v.literal("Nursing"),
      v.literal("Environmental Health"),
      v.literal("Training")
    )
  },
  handler: async (ctx, { category }) => {
    return await ctx.db
      .query("gallery")
      .withIndex("by_category_isPublished", q => q.eq("category", category).eq("isPublished", true))
      .order("desc")
      .collect();
  },
});

// Get published gallery items by type (image/video)
export const getPublishedGalleryByType = query({
  args: {
    type: v.union(v.literal("image"), v.literal("video"))
  },
  handler: async (ctx, { type }) => {
    return await ctx.db
      .query("gallery")
      .withIndex("by_type_isPublished", q => q.eq("type", type).eq("isPublished", true))
      .order("desc")
      .collect();
  },
});

// Get all gallery items that are not published (for admin review)
export const getUnpublishedGallery = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("gallery")
      .withIndex("by_isPublished", q => q.eq("isPublished", false))
      .order("desc")
      .collect();
  },
});

// Get all gallery items
export const getAllGalleryItems = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("gallery").order("desc").collect();
  },
});

// Search gallery items by tags
export const searchGalleryByTags = query({
  args: { tags: v.array(v.string()) },
  handler: async (ctx, { tags }) => {
    const allItems = await ctx.db
      .query("gallery")
      .withIndex("by_isPublished", q => q.eq("isPublished", true))
      .collect();
    
    // Filter items that contain any of the search tags
    return allItems.filter(item => 
      item.tags && item.tags.length > 0 && tags.some(tag => 
        item.tags!.some(itemTag => 
          itemTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    );
  },
});

// Create gallery item mutation
export const createGalleryItem = mutation({
  args: {
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("image"), v.literal("video"))),
    url: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("Maternal Health"),
      v.literal("Education"),
      v.literal("Mental Health"),
      v.literal("Clinical Services"),
      v.literal("Laboratory"),
      v.literal("Facilities"),
      v.literal("Community Outreach"),
      v.literal("Youth Services"),
      v.literal("Nursing"),
      v.literal("Environmental Health"),
      v.literal("Training")
    )),
    date: v.optional(v.number()),
    location: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPublished: v.optional(v.boolean()),
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
      throw new Error("You do not have permission to create gallery items");
    }

    // Only admin and superadmin can set isPublished to true
    let isPublished = false;
    if (args.isPublished && ["admin", "superadmin"].includes(staffProfile.role)) {
      isPublished = args.isPublished;
    }

    const galleryId = await ctx.db.insert("gallery", {
      title: args.title || "Untitled",
      description: args.description || "",
      type: args.type || "image",
      url: args.url || "",
      thumbnail: args.thumbnail,
      category: args.category || "Clinical Services",
      date: args.date || Date.now(),
      location: args.location,
      tags: args.tags || [],
      createdAt: Date.now(),
      isPublished,
      uploadedBy: user._id,
    });
    return galleryId;
  },
});

// Delete gallery item mutation
export const deleteGalleryItem = mutation({
  args: { id: v.id("gallery") },
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

    // Check if user has staff profile with appropriate role
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!staffProfile) {
      throw new Error("You do not have permission to delete gallery items");
    }

    // Get the gallery item
    const galleryItem = await ctx.db.get(id);
    if (!galleryItem) throw new Error("Gallery item not found");

    // If published, only admin and superadmin can delete
    if (galleryItem.isPublished) {
      if (!["admin", "superadmin"].includes(staffProfile.role)) {
        throw new Error("Only admin or superadmin can delete published gallery items");
      }
    } else {
      // If not published, allow editor, admin, superadmin
      if (!["editor", "admin", "superadmin"].includes(staffProfile.role)) {
        throw new Error("You do not have permission to delete this gallery item");
      }
    }

    await ctx.db.delete(id);
    return { success: true };
  },
});

// Update gallery item mutation
export const updateGalleryItem = mutation({
  args: {
    id: v.id("gallery"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("image"), v.literal("video"))),
    url: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("Maternal Health"),
      v.literal("Education"),
      v.literal("Mental Health"),
      v.literal("Clinical Services"),
      v.literal("Laboratory"),
      v.literal("Facilities"),
      v.literal("Community Outreach"),
      v.literal("Youth Services"),
      v.literal("Nursing"),
      v.literal("Environmental Health"),
      v.literal("Training")
    )),
    date: v.optional(v.number()),
    location: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPublished: v.optional(v.boolean()),
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
      throw new Error("You do not have permission to update gallery items");
    }

    // Get the gallery item
    const galleryItem = await ctx.db.get(args.id);
    if (!galleryItem) throw new Error("Gallery item not found");

    const patchData: Partial<Doc<"gallery">> = {
      ...(args.title !== undefined && { title: args.title }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.type !== undefined && { type: args.type }),
      ...(args.url !== undefined && { url: args.url }),
      ...(args.thumbnail !== undefined && { thumbnail: args.thumbnail }),
      ...(args.category !== undefined && { category: args.category }),
      ...(args.date !== undefined && { date: args.date }),
      ...(args.location !== undefined && { location: args.location }),
      ...(args.tags !== undefined && { tags: args.tags }),
      updatedAt: Date.now(),
    };

    // Only admin and superadmin can set isPublished to true
    if (typeof args.isPublished === "boolean") {
      if (["admin", "superadmin"].includes(staffProfile.role)) {
        patchData.isPublished = args.isPublished;
      } else if (galleryItem.isPublished && !args.isPublished) {
        // Allow anyone with permission to unpublish
        patchData.isPublished = false;
      }
    }

    await ctx.db.patch(args.id, patchData);
    return { success: true };
  },
});

// Get gallery statistics
export const getGalleryStats = query({
  args: {},
  handler: async (ctx) => {
    const allItems = await ctx.db
      .query("gallery")
      .withIndex("by_isPublished", q => q.eq("isPublished", true))
      .collect();
    
    const images = allItems.filter(item => item.type === "image");
    const videos = allItems.filter(item => item.type === "video");
    
    // Count by category
    const categoryStats = allItems.reduce((acc, item) => {
      if (item.category) {
        acc[item.category] = (acc[item.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: allItems.length,
      images: images.length,
      videos: videos.length,
      categories: categoryStats,
    };
  },
});

/**
 * Migration function to convert uploadedBy field to uploadedById in gallery records
 * Run this once after schema update to fix existing data
 */
export const migrateGalleryUploadedBy = mutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Get all gallery records
      const galleryItems = await ctx.db.query("gallery").collect();

      for (const item of galleryItems) {
        try {
          // If item has uploadedBy but not uploadedById, try to convert
          if (item.uploadedBy && !item.uploadedById) {
            // Try to find the user by clerkId (assuming uploadedBy is a clerkId)
            const user = await ctx.db
              .query("users")
              .withIndex("by_clerkId", (q) => q.eq("clerkId", item.uploadedBy!))
              .first();

            if (user) {
              // Update the record to use uploadedById and remove uploadedBy
              await ctx.db.patch(item._id, {
                uploadedById: user._id,
                uploadedBy: undefined, // Remove the old field
                updatedAt: Date.now(),
              });
              migratedCount++;
            } else {
              // If user not found, just remove the uploadedBy field
              await ctx.db.patch(item._id, {
                uploadedBy: undefined,
                updatedAt: Date.now(),
              });
              migratedCount++;
            }
          }
        } catch (error) {
          errors.push(`Failed to migrate gallery item ${item._id}: ${error}`);
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