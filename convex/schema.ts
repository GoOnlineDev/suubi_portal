import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.union(
      v.literal("admin"),
      v.literal("patient"),
      v.literal("doctor"),
      v.literal("nurse"),
      v.literal("allied_health"),
      v.literal("support_staff"),
      v.literal("administrative_staff"),
      v.literal("technical_staff"),
      v.literal("training_research_staff"),
      v.literal("superadmin"),
      v.literal("editor")
    ),
    subRole: v.optional(v.string()), // For specific subcategories like "surgeon", "cardiologist", "registered_nurse", etc.
  })
  .index("by_clerkId", ["clerkId"])
  .index("by_role", ["role"]),
  news: defineTable({
    title: v.string(),             // Headline of the news article
    content: v.string(),           // Main body/content
    summary: v.string(),           // Short summary or excerpt
    author: v.string(),            // Who posted it (can be name or ID)
    images: v.array(v.string()),   // List of image URLs
    videos: v.optional(v.array(v.string())), // Video URLs (optional array)
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
    ), // Required category
    startDate: v.number(),         // When the news happened (timestamp)
    endDate: v.optional(v.number()), // Optional end time/date
    publishedAt: v.number(),       // Timestamp (Date.now())
    updatedAt: v.optional(v.number()), // For tracking updates
    isPublished: v.boolean(),      // Toggle visibility on frontend
    tags: v.optional(v.array(v.string())), // Optional tags like ["covid", "staff", "tips"]
    institution: v.optional(
      v.union(
        v.literal("Boost Health Initiative"),
        v.literal("Suubi Medical Centre"),
        v.string() // For future institutions
      )
    ),
  })
  .index("by_publishedAt", ["publishedAt"])
  .index("by_category", ["category"])
  .index("by_author", ["author"])
  .index("by_isPublished", ["isPublished"])
  .index("by_institution", ["institution"])
  .index("by_category_publishedAt", ["category", "publishedAt"])
  .index("by_category_isPublished", ["category", "isPublished"])
  .index("by_institution_isPublished", ["institution", "isPublished"]),
  programs: defineTable({
    name: v.string(),                     // Program title
    description: v.string(),              // Full description of the program
    goal: v.optional(v.string()),         // Optional: specific aim or objective
    startDate: v.number(),                // Timestamp for when it begins
    endDate: v.optional(v.number()),      // Optional: when it ends
    location: v.optional(v.string()),     // Where the program is held (optional)
    images: v.array(v.string()),          // Banner or feature images (array)
    videos: v.optional(v.array(v.string())), // Video URLs (optional array)
    createdAt: v.number(),                // Timestamp for record creation
    updatedAt: v.optional(v.number()),    // Optional update tracker
    status: v.string(),                   // "upcoming", "ongoing", "completed"
    contactPerson: v.optional(v.string()),// Coordinator/Lead for the program
    contactPhone: v.optional(v.string()), // Optional phone number
    contactEmail: v.optional(v.string()), // Optional email
    tags: v.optional(v.array(v.string())),// E.g. ["nutrition", "education"]
    relatedNewsIds: v.optional(v.array(v.id("news"))), // Links to news
    isFeatured: v.boolean(),              // Should it be highlighted?
    approved: v.boolean(),                // Whether the program is approved
  })
  .index("by_startDate", ["startDate"])
  .index("by_status", ["status"])
  .index("by_isFeatured", ["isFeatured"])
  .index("by_approved", ["approved"])
  .index("by_status_approved", ["status", "approved"])
  .index("by_isFeatured_approved", ["isFeatured", "approved"]),
  
  // Subscribers table for email subscriptions
  subscribers: defineTable({
    email: v.string(), // Subscriber email address
    createdAt: v.number(), // Timestamp for when the subscription was added
  })
  .index("by_email", ["email"])
  .index("by_createdAt", ["createdAt"]),

  // Gallery table for media items (photos and videos)
  gallery: defineTable({
    title: v.optional(v.string()),                    // Title of the media item
    description: v.optional(v.string()),              // Description of the media item
    type: v.optional(v.union(v.literal("image"), v.literal("video"))), // Media type
    url: v.optional(v.string()),                      // URL of the media file
    thumbnail: v.optional(v.string()),                // Optional thumbnail URL for videos
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
    )),                                               // Fixed missing closing parenthesis
    date: v.optional(v.number()),                     // Date when the media was created/taken (timestamp)
    location: v.optional(v.string()),                 // Location where the media was taken
    tags: v.optional(v.array(v.string())),           // Tags for categorization and search
    createdAt: v.number(),                           // When the record was created
    updatedAt: v.optional(v.number()),               // When the record was last updated
    isPublished: v.boolean(),                        // Whether the media is published/visible
    uploadedBy: v.optional(v.string()),              // User ID who uploaded the media
  })
  .index("by_type", ["type"])
  .index("by_category", ["category"])
  .index("by_date", ["date"])
  .index("by_isPublished", ["isPublished"])
  .index("by_createdAt", ["createdAt"])
  .index("by_category_isPublished", ["category", "isPublished"])
  .index("by_type_isPublished", ["type", "isPublished"]),

  // Cron state table for persistent cron job state
  cron_state: defineTable({
    key: v.string(), // e.g., "lastCounts"
    value: v.any(),
  })
  .index("by_key", ["key"]),
  rooms: defineTable({
    userIds: v.array(v.id("users")),
  }).index("by_userIds", ["userIds"]),
  messages: defineTable({
    roomId: v.id("rooms"),
    senderId: v.id("users"),
    content: v.string(),
  }).index("by_roomId", ["roomId"]),

  // Staff profiles table - unified table for all staff types
  staff_profiles: defineTable({
    userId: v.id("users"),                    // Reference to the user
    role: v.union(
      v.literal("doctor"),
      v.literal("nurse"),
      v.literal("allied_health"),
      v.literal("support_staff"),
      v.literal("administrative_staff"),
      v.literal("technical_staff"),
      v.literal("training_research_staff")
    ),
    subRole: v.optional(v.string()),          // Specific subcategory (e.g., "surgeon", "cardiologist", "registered_nurse")
    specialty: v.optional(v.string()),        // Medical specialty (for doctors)
    licenseNumber: v.optional(v.string()),    // License number
    qualifications: v.optional(v.array(v.string())), // Array of qualifications/degrees
    experience: v.optional(v.number()),       // Years of experience
    bio: v.optional(v.string()),              // Professional biography
    languages: v.optional(v.array(v.string())), // Languages spoken
    consultationFee: v.optional(v.number()),  // Consultation fee (for clinical staff)
    isAvailable: v.optional(v.boolean()),     // Current availability status
    rating: v.optional(v.number()),           // Average rating (1-5)
    totalReviews: v.optional(v.number()),     // Total number of reviews
    profileImage: v.optional(v.string()),     // Profile image URL
    verified: v.boolean(),                    // Whether the staff member is verified
    createdAt: v.number(),                    // When the profile was created
    updatedAt: v.optional(v.number()),        // When the profile was last updated
  })
  .index("by_userId", ["userId"])
  .index("by_role", ["role"])
  .index("by_subRole", ["subRole"])
  .index("by_role_subRole", ["role", "subRole"])
  .index("by_isAvailable", ["isAvailable"])
  .index("by_verified", ["verified"])
  .index("by_rating", ["rating"])
  .index("by_createdAt", ["createdAt"]),

  // Available Times table
  availableTimes: defineTable({
    userId: v.id("users"),                    // Reference to the user who owns this time slot
    dayOfWeek: v.union(                       // Day of the week for recurring slots
      v.literal("Monday"),
      v.literal("Tuesday"),
      v.literal("Wednesday"),
      v.literal("Thursday"),
      v.literal("Friday"),
      v.literal("Saturday"),
      v.literal("Sunday")
    ),
    startTime: v.string(),                    // Start time of the slot (e.g., "09:00")
    endTime: v.string(),                      // End time of the slot (e.g., "17:00")
    isRecurring: v.boolean(),                 // True if this slot recurs weekly
    date: v.optional(v.number()),             // Specific date for one-off slots (timestamp)
    createdAt: v.number(),                    // When the slot was created
    updatedAt: v.optional(v.number()),        // When the slot was last updated
  })
  .index("by_userId", ["userId"])
  .index("by_dayOfWeek", ["dayOfWeek"])
  .index("by_isRecurring", ["isRecurring"])
  .index("by_date", ["date"])
  .index("by_userId_dayOfWeek", ["userId", "dayOfWeek"])
  .index("by_userId_date", ["userId", "date"]),
}); 