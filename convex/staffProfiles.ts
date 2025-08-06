import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createStaffProfile = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("doctor"),
      v.literal("nurse"),
      v.literal("allied_health"),
      v.literal("support_staff"),
      v.literal("administrative_staff"),
      v.literal("technical_staff"),
      v.literal("training_research_staff")
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
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("staff_profiles", {
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
      profileImage: args.profileImage,
      verified: args.verified,
      createdAt: Date.now(),
    });
  },
});

export const getStaffProfileByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const listStaffProfiles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("staff_profiles").collect();
  },
});

export const listStaffProfilesByRole = query({
  args: { role: v.union(
    v.literal("doctor"),
    v.literal("nurse"),
    v.literal("allied_health"),
    v.literal("support_staff"),
    v.literal("administrative_staff"),
    v.literal("technical_staff"),
    v.literal("training_research_staff")
  ) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("staff_profiles")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();
  },
});

export const listStaffProfilesBySubRole = query({
  args: { subRole: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("staff_profiles")
      .withIndex("by_subRole", (q) => q.eq("subRole", args.subRole))
      .collect();
  },
});

export const updateStaffProfile = mutation({
  args: {
    userId: v.id("users"),
    role: v.optional(v.union(
      v.literal("doctor"),
      v.literal("nurse"),
      v.literal("allied_health"),
      v.literal("support_staff"),
      v.literal("administrative_staff"),
      v.literal("technical_staff"),
      v.literal("training_research_staff")
    )),
    subRole: v.optional(v.string()),
    specialty: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    qualifications: v.optional(v.array(v.string())),
    experience: v.optional(v.number()),
    bio: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
    consultationFee: v.optional(v.number()),
    profileImage: v.optional(v.string()),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (!profile) {
      throw new Error("Staff profile not found");
    }

    const updateData: any = { updatedAt: Date.now() };
    if (args.role !== undefined) updateData.role = args.role;
    if (args.subRole !== undefined) updateData.subRole = args.subRole;
    if (args.specialty !== undefined) updateData.specialty = args.specialty;
    if (args.licenseNumber !== undefined) updateData.licenseNumber = args.licenseNumber;
    if (args.qualifications !== undefined) updateData.qualifications = args.qualifications;
    if (args.experience !== undefined) updateData.experience = args.experience;
    if (args.bio !== undefined) updateData.bio = args.bio;
    if (args.languages !== undefined) updateData.languages = args.languages;
    if (args.consultationFee !== undefined) updateData.consultationFee = args.consultationFee;
    if (args.profileImage !== undefined) updateData.profileImage = args.profileImage;
    if (args.verified !== undefined) updateData.verified = args.verified;

    await ctx.db.patch(profile._id, updateData);
    return profile._id;
  },
});

// Helper function to get available sub-roles for each main role
export const getAvailableSubRoles = query({
  args: { role: v.union(
    v.literal("doctor"),
    v.literal("nurse"),
    v.literal("allied_health"),
    v.literal("support_staff"),
    v.literal("administrative_staff"),
    v.literal("technical_staff"),
    v.literal("training_research_staff")
  ) },
  handler: async (ctx, args) => {
    const subRoles = {
      doctor: [
        "general_practitioner",
        "surgeon",
        "anesthesiologist",
        "pediatrician",
        "cardiologist",
        "oncologist",
        "neurologist",
        "radiologist",
        "psychiatrist",
        "obgyn",
        "emergency_doctor",
        "internist"
      ],
      nurse: [
        "registered_nurse",
        "practical_nurse",
        "nurse_practitioner",
        "nurse_midwife",
        "nurse_anesthetist",
        "icu_nurse",
        "er_nurse",
        "or_nurse",
        "pediatric_nurse",
        "oncology_nurse"
      ],
      allied_health: [
        "lab_technologist",
        "radiographer",
        "pharmacist",
        "pharmacy_technician",
        "physiotherapist",
        "occupational_therapist",
        "speech_therapist",
        "dietitian",
        "medical_social_worker",
        "respiratory_therapist",
        "optometrist",
        "audiologist"
      ],
      support_staff: [
        "healthcare_assistant",
        "ward_assistant",
        "cleaner",
        "laundry_staff",
        "cook",
        "porter",
        "driver",
        "security_officer"
      ],
      administrative_staff: [
        "hospital_administrator",
        "medical_records_officer",
        "receptionist",
        "health_information_officer",
        "billing_officer",
        "cashier",
        "clerical_staff",
        "hr_officer",
        "finance_officer",
        "procurement_officer",
        "it_officer",
        "quality_assurance_officer"
      ],
      technical_staff: [
        "biomedical_engineer",
        "maintenance_technician",
        "it_support_technician",
        "facility_manager"
      ],
      training_research_staff: [
        "medical_educator",
        "research_scientist",
        "clinical_researcher",
        "intern_coordinator",
        "health_program_officer"
      ]
    };

    return subRoles[args.role] || [];
  },
});

// New function to check if user has completed their profile
export const hasCompletedProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    
    return !!profile; // Returns true if profile exists, false otherwise
  },
});

// New function to get user's profile completion status
export const getUserProfileStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { hasProfile: false, role: null, isStaff: false };
    }

    const profile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    const isStaff = user.role && 
      (user.role as string) !== "patient" && 
      (user.role as string) !== "admin" && 
      (user.role as string) !== "superadmin" && 
      (user.role as string) !== "editor";

    return {
      hasProfile: !!profile,
      role: user.role,
      isStaff: isStaff,
      profile: profile
    };
  },
}); 