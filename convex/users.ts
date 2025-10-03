import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ===== USER MANAGEMENT FUNCTIONS =====

/**
 * Get current user by Clerk ID (commonly used function)
 */
export const getCurrentUser = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      gender: v.optional(v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("other"),
        v.literal("prefer_not_to_say")
      )),
      phoneNumber: v.optional(v.string()),
      emergencyContact: v.optional(v.string()),
      medicalHistory: v.optional(v.array(v.string())),
      allergies: v.optional(v.array(v.string())),
      currentMedications: v.optional(v.array(v.string())),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
      role: v.optional(v.string()), // Legacy field for existing data
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    if (!args.clerkId) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId!))
      .first();

    return user;
  },
});

/**
 * Create or get user (commonly used for authentication)
 */
export const createOrGetUser = mutation({
  args: {
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx, args) => {
    // If no clerkId provided, return null
    if (!args.clerkId) {
      return null;
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId!))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // If no email provided, we can't create a user
    if (!args.email) {
      return null;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });

    return userId;
  },
});

/**
 * List staff users (commonly used function)
 */
export const listStaffUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    user: v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      gender: v.optional(v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("other"),
        v.literal("prefer_not_to_say")
      )),
      phoneNumber: v.optional(v.string()),
      emergencyContact: v.optional(v.string()),
      medicalHistory: v.optional(v.array(v.string())),
      allergies: v.optional(v.array(v.string())),
      currentMedications: v.optional(v.array(v.string())),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
    staffProfile: v.object({
      _id: v.id("staff_profiles"),
      _creationTime: v.number(),
      userId: v.id("users"),
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
      subRole: v.optional(v.string()),
      specialty: v.optional(v.string()),
      licenseNumber: v.optional(v.string()),
      qualifications: v.optional(v.array(v.string())),
      experience: v.optional(v.number()),
      bio: v.optional(v.string()),
      languages: v.optional(v.array(v.string())),
      consultationFee: v.optional(v.number()),
      isAvailable: v.optional(v.boolean()),
      rating: v.optional(v.number()),
      totalReviews: v.optional(v.number()),
      profileImage: v.optional(v.string()),
      verified: v.boolean(),
      verifiedById: v.optional(v.id("users")),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
  })),
  handler: async (ctx, args) => {
    // Get all staff profiles
    const staffProfiles = await ctx.db.query("staff_profiles").collect();

    // Deduplicate by userId - keep only the most recent profile per user
    const profilesByUser = new Map();
    for (const profile of staffProfiles) {
      const existing = profilesByUser.get(profile.userId);
      if (!existing || profile._creationTime > existing._creationTime) {
        profilesByUser.set(profile.userId, profile);
      }
    }
    const uniqueProfiles = Array.from(profilesByUser.values());

    // Get user data for each staff profile
    const staffUsers = await Promise.all(
      uniqueProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId) as any;
        if (!user) {
          throw new Error(`User not found for staff profile ${profile._id}`);
        }
        // Return only the fields defined in the validator to avoid extra fields
        return {
          user: {
            _id: user._id,
            _creationTime: user._creationTime,
            clerkId: user.clerkId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            phoneNumber: user.phoneNumber,
            emergencyContact: user.emergencyContact,
            medicalHistory: user.medicalHistory,
            allergies: user.allergies,
            currentMedications: user.currentMedications,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          staffProfile: profile,
        };
      })
    );

    // Sort by creation time and limit
    staffUsers.sort((a, b) => b.staffProfile._creationTime - a.staffProfile._creationTime);
    return staffUsers.slice(0, args.limit || 50);
  },
});

/**
 * Create a new user (all users are patients by default)
 */
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    // Patient-specific fields
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.union(
      v.literal("male"),
      v.literal("female"),
      v.literal("other"),
      v.literal("prefer_not_to_say")
    )),
    phoneNumber: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    medicalHistory: v.optional(v.array(v.string())),
    allergies: v.optional(v.array(v.string())),
    currentMedications: v.optional(v.array(v.string())),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      throw new Error("User already exists");
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      phoneNumber: args.phoneNumber,
      emergencyContact: args.emergencyContact,
      medicalHistory: args.medicalHistory,
      allergies: args.allergies,
      currentMedications: args.currentMedications,
      createdAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Update user profile (patient information)
 */
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      gender: v.optional(v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("other"),
        v.literal("prefer_not_to_say")
      )),
      phoneNumber: v.optional(v.string()),
      emergencyContact: v.optional(v.string()),
      medicalHistory: v.optional(v.array(v.string())),
      allergies: v.optional(v.array(v.string())),
      currentMedications: v.optional(v.array(v.string())),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get user by Clerk ID
 */
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      gender: v.optional(v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("other"),
        v.literal("prefer_not_to_say")
      )),
      phoneNumber: v.optional(v.string()),
      emergencyContact: v.optional(v.string()),
      medicalHistory: v.optional(v.array(v.string())),
      allergies: v.optional(v.array(v.string())),
      currentMedications: v.optional(v.array(v.string())),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return user;
  },
});

/**
 * Get all patients (users without staff profiles)
 */
export const getPatients = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.union(
      v.literal("male"),
      v.literal("female"),
      v.literal("other"),
      v.literal("prefer_not_to_say")
    )),
    phoneNumber: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    medicalHistory: v.optional(v.array(v.string())),
    allergies: v.optional(v.array(v.string())),
    currentMedications: v.optional(v.array(v.string())),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    // Get all users
    const allUsers = await ctx.db
      .query("users")
      .order("desc")
      .collect();

    // Get all staff profile user IDs
    const staffProfiles = await ctx.db
      .query("staff_profiles")
      .collect();
    
    const staffUserIds = new Set(staffProfiles.map(profile => profile.userId));

    // Filter out users who have staff profiles (they are staff, not patients)
    const patients = allUsers.filter(user => !staffUserIds.has(user._id));

    // Remove role field from returned data and add createdAt if missing
    const cleanedPatients = patients.map(user => ({
      _id: user._id,
      _creationTime: user._creationTime,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      phoneNumber: user.phoneNumber,
      emergencyContact: user.emergencyContact,
      medicalHistory: user.medicalHistory,
      allergies: user.allergies,
      currentMedications: user.currentMedications,
      createdAt: user.createdAt || user._creationTime,
      updatedAt: user.updatedAt,
    }));

    return cleanedPatients.slice(0, args.limit || 50);
  },
});

/**
 * Get user with their staff profile (if they have one)
 */
export const getUserWithStaffProfile = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    user: v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      gender: v.optional(v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("other"),
        v.literal("prefer_not_to_say")
      )),
      phoneNumber: v.optional(v.string()),
      emergencyContact: v.optional(v.string()),
      medicalHistory: v.optional(v.array(v.string())),
      allergies: v.optional(v.array(v.string())),
      currentMedications: v.optional(v.array(v.string())),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
    staffProfile: v.union(
      v.object({
        _id: v.id("staff_profiles"),
        _creationTime: v.number(),
        userId: v.id("users"),
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
        subRole: v.optional(v.string()),
        specialty: v.optional(v.string()),
        licenseNumber: v.optional(v.string()),
        qualifications: v.optional(v.array(v.string())),
        experience: v.optional(v.number()),
        bio: v.optional(v.string()),
        languages: v.optional(v.array(v.string())),
        consultationFee: v.optional(v.number()),
        isAvailable: v.optional(v.boolean()),
        rating: v.optional(v.number()),
        totalReviews: v.optional(v.number()),
        profileImage: v.optional(v.string()),
        verified: v.boolean(),
        verifiedById: v.optional(v.id("users")),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
      }),
      v.null()
    ),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return {
      user,
      staffProfile,
    };
  },
});

// ===== STAFF PROFILE MANAGEMENT FUNCTIONS =====

/**
 * Create staff profile (promote user to staff)
 */
export const createStaffProfile = mutation({
  args: {
    userId: v.id("users"),
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
    subRole: v.optional(v.string()),
    specialty: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    qualifications: v.optional(v.array(v.string())),
    experience: v.optional(v.number()),
    bio: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
    consultationFee: v.optional(v.number()),
    profileImage: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  returns: v.id("staff_profiles"),
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has a staff profile
    const existingProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingProfile) {
      throw new Error("User already has a staff profile");
    }

    // Verify the creator has admin privileges
    const creatorProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.createdBy))
      .first();

    if (!creatorProfile || !["admin", "superadmin"].includes(creatorProfile.role)) {
      throw new Error("Unauthorized: Only admins can create staff profiles");
    }

    const staffProfileId = await ctx.db.insert("staff_profiles", {
      userId: args.userId,
      role: args.role,
      subRole: args.subRole,
      specialty: args.specialty,
      licenseNumber: args.licenseNumber,
      qualifications: args.qualifications,
      experience: args.experience,
      bio: args.bio,
      languages: args.languages,
      consultationFee: args.consultationFee,
      isAvailable: true, // Default to available
      profileImage: args.profileImage,
      verified: false, // Requires verification
      createdAt: Date.now(),
    });

    return staffProfileId;
  },
});

/**
 * Update staff profile
 */
export const updateStaffProfile = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
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
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    await ctx.db.patch(staffProfile._id, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get all staff members
 */
export const getStaffMembers = query({
  args: {
    role: v.optional(v.union(
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
    )),
    isAvailable: v.optional(v.boolean()),
    verified: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    user: v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      gender: v.optional(v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("other"),
        v.literal("prefer_not_to_say")
      )),
      phoneNumber: v.optional(v.string()),
      emergencyContact: v.optional(v.string()),
      medicalHistory: v.optional(v.array(v.string())),
      allergies: v.optional(v.array(v.string())),
      currentMedications: v.optional(v.array(v.string())),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
    staffProfile: v.object({
      _id: v.id("staff_profiles"),
      _creationTime: v.number(),
      userId: v.id("users"),
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
    subRole: v.optional(v.string()),
      specialty: v.optional(v.string()),
      licenseNumber: v.optional(v.string()),
      qualifications: v.optional(v.array(v.string())),
      experience: v.optional(v.number()),
      bio: v.optional(v.string()),
      languages: v.optional(v.array(v.string())),
      consultationFee: v.optional(v.number()),
      isAvailable: v.optional(v.boolean()),
      rating: v.optional(v.number()),
      totalReviews: v.optional(v.number()),
      profileImage: v.optional(v.string()),
      verified: v.boolean(),
      verifiedById: v.optional(v.id("users")),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
  })),
  handler: async (ctx, args) => {
    let staffProfiles = await ctx.db.query("staff_profiles").collect();

    // Apply filters
    if (args.role) {
      staffProfiles = staffProfiles.filter(profile => profile.role === args.role);
    }
    if (args.isAvailable !== undefined) {
      staffProfiles = staffProfiles.filter(profile => profile.isAvailable === args.isAvailable);
    }
    if (args.verified !== undefined) {
      staffProfiles = staffProfiles.filter(profile => profile.verified === args.verified);
    }

    // Get user data for each staff profile
    const staffMembers = await Promise.all(
      staffProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        if (!user) {
          throw new Error(`User not found for staff profile ${profile._id}`);
        }
        return {
          user,
          staffProfile: profile,
        };
      })
    );

    // Sort by creation time and limit
    staffMembers.sort((a, b) => b.staffProfile._creationTime - a.staffProfile._creationTime);
    return staffMembers.slice(0, args.limit || 50);
  },
});

/**
 * Get medical staff only (doctors, nurses, allied health)
 */
export const getMedicalStaff = query({
  args: {
    role: v.optional(v.union(
      v.literal("doctor"),
      v.literal("nurse"),
      v.literal("allied_health")
    )),
    isAvailable: v.optional(v.boolean()),
    verified: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    user: v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      gender: v.optional(v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("other"),
        v.literal("prefer_not_to_say")
      )),
      phoneNumber: v.optional(v.string()),
      emergencyContact: v.optional(v.string()),
      medicalHistory: v.optional(v.array(v.string())),
      allergies: v.optional(v.array(v.string())),
      currentMedications: v.optional(v.array(v.string())),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
    staffProfile: v.object({
      _id: v.id("staff_profiles"),
      _creationTime: v.number(),
      userId: v.id("users"),
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
    subRole: v.optional(v.string()),
      specialty: v.optional(v.string()),
      licenseNumber: v.optional(v.string()),
      qualifications: v.optional(v.array(v.string())),
      experience: v.optional(v.number()),
      bio: v.optional(v.string()),
      languages: v.optional(v.array(v.string())),
      consultationFee: v.optional(v.number()),
      isAvailable: v.optional(v.boolean()),
      rating: v.optional(v.number()),
      totalReviews: v.optional(v.number()),
      profileImage: v.optional(v.string()),
      verified: v.boolean(),
      verifiedById: v.optional(v.id("users")),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
  })),
  handler: async (ctx, args) => {
    let staffProfiles = await ctx.db.query("staff_profiles").collect();

    // Filter to medical staff only
    staffProfiles = staffProfiles.filter(profile => 
      ["doctor", "nurse", "allied_health"].includes(profile.role)
    );

    // Apply additional filters
    if (args.role) {
      staffProfiles = staffProfiles.filter(profile => profile.role === args.role);
    }
    if (args.isAvailable !== undefined) {
      staffProfiles = staffProfiles.filter(profile => profile.isAvailable === args.isAvailable);
    }
    if (args.verified !== undefined) {
      staffProfiles = staffProfiles.filter(profile => profile.verified === args.verified);
    }

    // Get user data for each staff profile and shape to validator
    const medicalStaff = await Promise.all(
      staffProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        if (!user) {
          throw new Error(`User not found for staff profile ${profile._id}`);
        }
        const cleanedUser = {
          _id: user._id,
          _creationTime: user._creationTime,
          clerkId: user.clerkId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          phoneNumber: user.phoneNumber,
          emergencyContact: user.emergencyContact,
          medicalHistory: user.medicalHistory,
          allergies: user.allergies,
          currentMedications: user.currentMedications,
          createdAt: user.createdAt || user._creationTime,
          updatedAt: user.updatedAt,
        };
        return {
          user: cleanedUser,
          staffProfile: profile,
        };
      })
    );

    // Sort by creation time and limit
    medicalStaff.sort((a, b) => b.staffProfile._creationTime - a.staffProfile._creationTime);
    return medicalStaff.slice(0, args.limit || 50);
  },
});

/**
 * Verify staff member
 */
export const verifyStaffMember = mutation({
  args: {
    userId: v.id("users"),
    verifiedBy: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    // Verify the verifier has admin privileges
    const verifierProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.verifiedBy))
      .first();

    if (!verifierProfile || !["admin", "superadmin"].includes(verifierProfile.role)) {
      throw new Error("Unauthorized: Only admins can verify staff");
    }

    await ctx.db.patch(staffProfile._id, {
      verified: true,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update staff availability
 */
export const updateStaffAvailability = mutation({
  args: {
    userId: v.id("users"),
    isAvailable: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    await ctx.db.patch(staffProfile._id, {
      isAvailable: args.isAvailable,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete staff profile (demote staff back to patient)
 */
export const deleteStaffProfile = mutation({
  args: {
    userId: v.id("users"),
    deletedBy: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    // Verify the deleter has admin privileges
    const deleterProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.deletedBy))
      .first();

    if (!deleterProfile || !["admin", "superadmin"].includes(deleterProfile.role)) {
      throw new Error("Unauthorized: Only admins can delete staff profiles");
    }

    // Delete the staff profile
    await ctx.db.delete(staffProfile._id);
  },
});

// ===== MIGRATION FUNCTIONS =====

/**
 * Migrate existing users to new schema (run once after schema update)
 * This function handles users who are missing createdAt field
 */
export const migrateUsersToNewSchema = mutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Get all users
      const allUsers = await ctx.db.query("users").collect();

      for (const user of allUsers) {
        try {
          const updates: any = {};

          // Add createdAt if missing
          if (!user.createdAt) {
            updates.createdAt = user._creationTime;
          }

          // Update user if there are changes
          if (Object.keys(updates).length > 0) {
            await ctx.db.patch(user._id, updates);
            migratedCount++;
          }
        } catch (error) {
          errors.push(`Failed to migrate user ${user._id}: ${error}`);
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

/**
 * Clean up any legacy data from users table (run after migration)
 * This function can be used for future cleanup tasks
 */
export const cleanupLegacyData = mutation({
  args: {},
  returns: v.object({
    cleanedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let cleanedCount = 0;

    try {
      // Get all users
      const allUsers = await ctx.db.query("users").collect();

      for (const user of allUsers) {
        try {
          const updates: any = {};

          // Add any missing required fields or cleanup logic here
          // For now, this is a placeholder for future cleanup tasks

          // Update user if there are changes
          if (Object.keys(updates).length > 0) {
            await ctx.db.patch(user._id, updates);
            cleanedCount++;
          }
        } catch (error) {
          errors.push(`Failed to clean user ${user._id}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Cleanup failed: ${error}`);
    }

    return {
      cleanedCount,
      errors,
    };
  },
});

/**
 * Migration function to add createdAt field and handle role field in users records
 * Run this once after schema update to fix existing data
 */
export const migrateUsersFields = mutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Get all users records
      const users = await ctx.db.query("users").collect();

      for (const user of users) {
        try {
          // Check if user needs migration
          const needsCreatedAtMigration = !user.createdAt;
          const hasRoleField = user.role !== undefined;
          
          if (needsCreatedAtMigration || hasRoleField) {
            const patchData: any = {
              updatedAt: Date.now(),
            };

            // Handle createdAt migration
            if (needsCreatedAtMigration) {
              patchData.createdAt = user._creationTime;
            }

            // Handle role field - if user has a role, create a staff profile
            if (hasRoleField && user.role) {
              // Check if staff profile already exists
              const existingStaffProfile = await ctx.db
                .query("staff_profiles")
                .withIndex("by_userId", (q) => q.eq("userId", user._id))
                .first();

              if (!existingStaffProfile) {
                // Create staff profile from user role
                await ctx.db.insert("staff_profiles", {
                  userId: user._id,
                  role: user.role as any, // Cast to the role type
                  isAvailable: true,
                  verified: false, // Default to unverified
                  createdAt: user._creationTime,
                });
              }
              
              // Remove the role field from user
              patchData.role = undefined;
            }

            await ctx.db.patch(user._id, patchData);
            migratedCount++;
          }
        } catch (error) {
          errors.push(`Failed to migrate user ${user._id}: ${error}`);
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