import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    
    // Patient-specific fields (all users are patients by default)
    dateOfBirth: v.optional(v.number()),       // Date of birth (timestamp)
    gender: v.optional(v.union(
      v.literal("male"),
      v.literal("female"),
      v.literal("other"),
      v.literal("prefer_not_to_say")
    )),
    phoneNumber: v.optional(v.string()),       // Patient's phone number
    emergencyContact: v.optional(v.string()),  // Emergency contact info
    medicalHistory: v.optional(v.array(v.string())), // Medical history notes
    allergies: v.optional(v.array(v.string())), // Known allergies
    currentMedications: v.optional(v.array(v.string())), // Current medications
    
    // Common fields
    createdAt: v.optional(v.number()),             // Made optional to handle existing data
    updatedAt: v.optional(v.number()),         // When the user was last updated
    role: v.optional(v.string()),              // Legacy field for existing data
  })
  .index("by_clerkId", ["clerkId"])
  .index("by_email", ["email"])               // Added email index for lookups
  .index("by_createdAt", ["createdAt"]),

  news: defineTable({
    title: v.string(),             // Headline of the news article
    content: v.string(),           // Main body/content
    summary: v.string(),           // Short summary or excerpt
    authorId: v.optional(v.id("users")), // Made optional to handle existing data
    author: v.optional(v.string()), // Legacy field for existing data
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
    createdAt: v.optional(v.number()), // Made optional to handle existing data
  })
  .index("by_publishedAt", ["publishedAt"])
  .index("by_category", ["category"])
  .index("by_authorId", ["authorId"])        // Updated index name
  .index("by_isPublished", ["isPublished"])
  .index("by_institution", ["institution"])
  .index("by_category_publishedAt", ["category", "publishedAt"])
  .index("by_category_isPublished", ["category", "isPublished"])
  .index("by_institution_isPublished", ["institution", "isPublished"])
  .index("by_createdAt", ["createdAt"]),     // Added createdAt index

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
    status: v.union(                      // Made status more strict with predefined values
      v.literal("upcoming"),
      v.literal("ongoing"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("postponed")
    ),
    contactPersonId: v.optional(v.id("users")), // Changed to reference user ID
    contactPerson: v.optional(v.string()), // Legacy field for existing data
    contactPhone: v.optional(v.string()), // Optional phone number
    contactEmail: v.optional(v.string()), // Optional email
    tags: v.optional(v.array(v.string())),// E.g. ["nutrition", "education"]
    relatedNewsIds: v.optional(v.array(v.id("news"))), // Links to news
    isFeatured: v.boolean(),              // Should it be highlighted?
    approved: v.boolean(),                // Whether the program is approved
    approvedById: v.optional(v.id("users")), // Who approved the program
    createdById: v.optional(v.id("users")), // Who created the program (optional for existing data)
  })
  .index("by_startDate", ["startDate"])
  .index("by_status", ["status"])
  .index("by_isFeatured", ["isFeatured"])
  .index("by_approved", ["approved"])
  .index("by_status_approved", ["status", "approved"])
  .index("by_isFeatured_approved", ["isFeatured", "approved"])
  .index("by_createdById", ["createdById"])
  .index("by_approvedById", ["approvedById"])
  .index("by_createdAt", ["createdAt"]),
  
  // Subscribers table for email subscriptions
  subscribers: defineTable({
    email: v.string(),                    // Subscriber email address
    isActive: v.optional(v.boolean()), // Made optional to handle existing data
    categories: v.optional(v.array(v.string())), // Categories they're subscribed to
    createdAt: v.number(),                // Timestamp for when the subscription was added
    updatedAt: v.optional(v.number()),    // When subscription was last updated
  })
  .index("by_email", ["email"])
  .index("by_isActive", ["isActive"])    // Added index for active subscribers
  .index("by_createdAt", ["createdAt"]),

  // Gallery table for media items (photos and videos)
  gallery: defineTable({
    title: v.optional(v.string()),        // Title of the media item
    description: v.optional(v.string()),  // Description of the media item
    type: v.union(                        // Made required and more strict
      v.literal("image"), 
      v.literal("video")
    ),
    url: v.string(),                      // Made required - URL of the media file
    thumbnail: v.optional(v.string()),    // Optional thumbnail URL for videos
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
    date: v.optional(v.number()),         // Date when the media was created/taken (timestamp)
    location: v.optional(v.string()),     // Location where the media was taken
    tags: v.optional(v.array(v.string())), // Tags for categorization and search
    createdAt: v.number(),               // When the record was created
    updatedAt: v.optional(v.number()),   // When the record was last updated
    isPublished: v.boolean(),            // Whether the media is published/visible
    uploadedById: v.optional(v.id("users")), // Changed to reference user ID
    uploadedBy: v.optional(v.string()),      // Legacy field for existing data
  })
  .index("by_type", ["type"])
  .index("by_category", ["category"])
  .index("by_date", ["date"])
  .index("by_isPublished", ["isPublished"])
  .index("by_createdAt", ["createdAt"])
  .index("by_category_isPublished", ["category", "isPublished"])
  .index("by_type_isPublished", ["type", "isPublished"])
  .index("by_uploadedById", ["uploadedById"]), // Added index for uploader

  // Cron state table for persistent cron job state
  cron_state: defineTable({
    key: v.string(), // e.g., "lastCounts"
    value: v.any(),
    createdAt: v.optional(v.number()),    // Made optional to handle existing data
    updatedAt: v.optional(v.number()),   // Added for consistency
  })
  .index("by_key", ["key"]),

  // Chat rooms table
  rooms: defineTable({
    userIds: v.array(v.id("users")),
    name: v.optional(v.string()),        // Optional room name
    type: v.optional(v.union(            // Room type (direct message, group, etc.)
      v.literal("direct"),
      v.literal("group"),
      v.literal("support")
    )),
    createdAt: v.number(),               // When the room was created
    updatedAt: v.optional(v.number()),   // When the room was last updated
  })
  .index("by_userIds", ["userIds"])
  .index("by_type", ["type"])
  .index("by_createdAt", ["createdAt"]),

  // Chat messages table
  messages: defineTable({
    roomId: v.id("rooms"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.optional(v.union(     // Type of message
      v.literal("text"),
      v.literal("image"),
      v.literal("file"),
      v.literal("system")
    )),
    readBy: v.optional(v.array(v.object({ // Track who has read the message
      userId: v.id("users"),
      readAt: v.number()
    }))),
    createdAt: v.number(),               // When the message was sent
    updatedAt: v.optional(v.number()),   // When the message was last updated
    editedAt: v.optional(v.number()),    // When the message was edited
  })
  .index("by_roomId", ["roomId"])
  .index("by_senderId", ["senderId"])
  .index("by_createdAt", ["createdAt"])
  .index("by_roomId_createdAt", ["roomId", "createdAt"]),

  // Typing status table for real-time typing indicators
  typing_status: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    isTyping: v.boolean(),
    lastTypingAt: v.number(),
  })
  .index("by_roomId", ["roomId"])
  .index("by_userId", ["userId"])
  .index("by_roomId_userId", ["roomId", "userId"])
  .index("by_roomId_isTyping", ["roomId", "isTyping"]),

  // Staff profiles table - unified table for all staff types (source of truth for roles)
  staff_profiles: defineTable({
    userId: v.id("users"),               // Reference to the user
    role: v.union(
      v.literal("admin"),
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
    subRole: v.optional(v.string()),     // Specific subcategory (e.g., "surgeon", "cardiologist", "registered_nurse")
    specialty: v.optional(v.string()),   // Medical specialty (for doctors)
    licenseNumber: v.optional(v.string()), // License number
    qualifications: v.optional(v.array(v.string())), // Array of qualifications/degrees
    experience: v.optional(v.number()),  // Years of experience
    bio: v.optional(v.string()),         // Professional biography
    languages: v.optional(v.array(v.string())), // Languages spoken
    consultationFee: v.optional(v.number()), // Consultation fee (for clinical staff)
    isAvailable: v.optional(v.boolean()), // Made optional to handle existing data - Current availability status
    rating: v.optional(v.number()),      // Average rating (1-5)
    totalReviews: v.optional(v.number()), // Total number of reviews
    profileImage: v.optional(v.string()), // Profile image URL
    verified: v.boolean(),               // Whether the staff member is verified
    verifiedById: v.optional(v.id("users")), // Who verified this staff member
    createdAt: v.number(),               // When the profile was created
    updatedAt: v.optional(v.number()),   // When the profile was last updated
  })
  .index("by_userId", ["userId"])
  .index("by_role", ["role"])
  .index("by_subRole", ["subRole"])
  .index("by_role_subRole", ["role", "subRole"])
  .index("by_isAvailable", ["isAvailable"])
  .index("by_verified", ["verified"])
  .index("by_rating", ["rating"])
  .index("by_createdAt", ["createdAt"])
  .index("by_verifiedById", ["verifiedById"]),


  // Available Times table
  availableTimes: defineTable({
    staffProfileId: v.optional(v.id("staff_profiles")), // Made optional to handle existing data
    userId: v.optional(v.id("users")), // Legacy field for existing data
    dayOfWeek: v.optional(v.union(        // Made optional for one-off dates
      v.literal("Monday"),
      v.literal("Tuesday"),
      v.literal("Wednesday"),
      v.literal("Thursday"),
      v.literal("Friday"),
      v.literal("Saturday"),
      v.literal("Sunday")
    )),
    startTime: v.string(),                // Start time of the slot (e.g., "09:00")
    endTime: v.string(),                  // End time of the slot (e.g., "17:00")
    isRecurring: v.boolean(),             // True if this slot recurs weekly
    date: v.optional(v.number()),         // Specific date for one-off slots (timestamp)
    isAvailable: v.optional(v.boolean()), // Made optional to handle existing data
    createdAt: v.number(),                // When the slot was created
    updatedAt: v.optional(v.number()),    // When the slot was last updated
  })
  .index("by_staffProfileId", ["staffProfileId"])
  .index("by_userId", ["userId"]) // Legacy index for existing data
  .index("by_dayOfWeek", ["dayOfWeek"])
  .index("by_isRecurring", ["isRecurring"])
  .index("by_date", ["date"])
  .index("by_isAvailable", ["isAvailable"])
  .index("by_staffProfileId_dayOfWeek", ["staffProfileId", "dayOfWeek"])
  .index("by_staffProfileId_date", ["staffProfileId", "date"])
  .index("by_staffProfileId_isAvailable", ["staffProfileId", "isAvailable"])
  .index("by_userId_dayOfWeek", ["userId", "dayOfWeek"]), // Legacy index

  // Appointments table
  appointments: defineTable({
    patientId: v.id("users"),            // Reference to the patient
    staffProfileId: v.id("staff_profiles"), // Reference to the staff profile instead of user
    appointmentDate: v.number(),         // Date and time of the appointment (timestamp)
    duration: v.number(),                // Duration in minutes (default 30)
    status: v.union(
      v.literal("pending"),              // Waiting for doctor approval
      v.literal("approved"),             // Doctor has approved
      v.literal("confirmed"),            // Patient has confirmed
      v.literal("completed"),            // Appointment completed
      v.literal("cancelled"),            // Appointment cancelled
      v.literal("rescheduled"),          // Appointment rescheduled
      v.literal("no_show")               // Patient didn't show up
    ),
    appointmentType: v.optional(v.union(
      v.literal("consultation"),
      v.literal("follow_up"),
      v.literal("emergency"),
      v.literal("routine_checkup"),
      v.literal("specialist_referral"),
      v.literal("telemedicine"),
      v.literal("in_person")
    )),
    reason: v.optional(v.string()),      // Reason for the appointment
    notes: v.optional(v.string()),       // Additional notes
    symptoms: v.optional(v.array(v.string())), // Patient symptoms
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    location: v.optional(v.string()),    // Location of the appointment
    roomNumber: v.optional(v.string()),   // Specific room number
    fee: v.optional(v.number()),         // Appointment fee
    paymentStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("partial"),
      v.literal("waived"),
      v.literal("refunded")
    )),
    reminderSent: v.optional(v.boolean()), // Whether reminder was sent
    followUpRequired: v.optional(v.boolean()), // Whether follow-up is needed
    followUpDate: v.optional(v.number()), // Suggested follow-up date
    createdById: v.id("users"),          // Who created the appointment
    approvedById: v.optional(v.id("users")), // Who approved the appointment
    cancelledById: v.optional(v.id("users")), // Who cancelled the appointment
    cancellationReason: v.optional(v.string()), // Reason for cancellation
    createdAt: v.number(),               // When the appointment was created
    updatedAt: v.optional(v.number()),   // When the appointment was last updated
    rescheduledFrom: v.optional(v.id("appointments")), // Reference to original appointment if rescheduled
  })
  .index("by_patientId", ["patientId"])
  .index("by_staffProfileId", ["staffProfileId"]) // Updated index name
  .index("by_status", ["status"])
  .index("by_appointmentDate", ["appointmentDate"])
  .index("by_patientId_status", ["patientId", "status"])
  .index("by_staffProfileId_status", ["staffProfileId", "status"])
  .index("by_appointmentDate_status", ["appointmentDate", "status"])
  .index("by_createdById", ["createdById"])
  .index("by_approvedById", ["approvedById"])
  .index("by_patientId_appointmentDate", ["patientId", "appointmentDate"])
  .index("by_staffProfileId_appointmentDate", ["staffProfileId", "appointmentDate"])
  .index("by_appointmentType", ["appointmentType"])
  .index("by_priority", ["priority"])
  .index("by_paymentStatus", ["paymentStatus"])
  .index("by_createdAt", ["createdAt"]),
});