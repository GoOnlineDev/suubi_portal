import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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
      isAvailable: true, // Default to available
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
    const subRoles: Record<string, string[]> = {
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

    return subRoles[String(args.role)] || [];
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
  returns: v.object({
    hasProfile: v.boolean(),
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
      v.literal("editor"),
      v.null()
    ),
    isStaff: v.boolean(),
    profile: v.union(
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
        createdAt: v.number(),
        updatedAt: v.optional(v.number()),
      }),
      v.null()
    ),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { hasProfile: false, role: null, isStaff: false, profile: null };
    }

    const profile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    // Anyone with a staff profile is considered staff (including all roles)
    const isStaff = !!profile;

    return {
      hasProfile: !!profile,
      role: profile?.role || null,
      isStaff: isStaff,
      profile: profile || null
    };
  },
});

// Joined view: staff profiles with their user (excluding admin/superadmin/editor users), optional filters
export const listStaffWithUsers = query({
  args: {
    role: v.optional(
      v.union(
        v.literal("doctor"),
        v.literal("nurse"),
        v.literal("allied_health"),
        v.literal("support_staff"),
        v.literal("administrative_staff"),
        v.literal("technical_staff"),
        v.literal("training_research_staff")
      )
    ),
    subRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Base query: filter staff_profiles by role if provided
    let profiles;
    
    if (args.role) {
      // Use index to filter by role
      profiles = await ctx.db
        .query("staff_profiles")
        .withIndex("by_role", (q) => q.eq("role", args.role!))
        .collect();
    } else {
      // Get all profiles
      profiles = await ctx.db
        .query("staff_profiles")
        .collect();
    }

    console.log("All profiles:", profiles.map(p => ({ id: p._id, role: p.role, userId: p.userId })));

    if (args.subRole) {
      profiles = profiles.filter((p) => p.subRole === args.subRole);
    }

    const results: Array<{ user: any; staffProfile: any }> = []; // Fixed type definition

    for (const profile of profiles) {
      const user = await ctx.db.get(profile.userId);
      if (!user) {
        console.log(`User not found for profile ${profile._id}, userId: ${profile.userId}`);
        continue;
      }
      // Exclude admins/superadmins/editors
      if (["admin", "superadmin", "editor"].includes(profile.role)) {
        console.log(`Excluding profile ${profile._id} with role ${profile.role}`);
        continue;
      }

      results.push({ user, staffProfile: profile });
    }

    console.log("Final results:", results.map(r => ({ profileId: r.staffProfile._id, userId: r.user._id, role: r.staffProfile.role })));
    return results;
  },
});

/**
 * Debug function to check all staff profiles
 */
export const debugStaffProfiles = query({
  args: {},
  handler: async (ctx) => {
    try {
      // Try different query methods to see what works
      console.log("Starting debug query...");
      
      const allProfiles = await ctx.db.query("staff_profiles").collect();
      console.log("Debug - All profiles count:", allProfiles.length);
      console.log("Debug - All profiles:", allProfiles.map(p => ({ id: p._id, role: p.role, userId: p.userId })));
      
      const doctorProfiles = await ctx.db.query("staff_profiles").withIndex("by_role", (q) => q.eq("role", "doctor")).collect();
      console.log("Debug - Doctor profiles count:", doctorProfiles.length);
      
      // Try to get any single profile to test basic access
      const firstProfile = await ctx.db.query("staff_profiles").first();
      console.log("Debug - First profile:", firstProfile ? { id: firstProfile._id, role: firstProfile.role } : "No profiles found");
      
      return {
        allProfiles: allProfiles.map(p => ({
          id: p._id,
          role: p.role,
          userId: p.userId,
          isAvailable: p.isAvailable,
          verified: p.verified
        })),
        doctorProfiles: doctorProfiles.map(p => ({
          id: p._id,
          role: p.role,
          userId: p.userId,
          isAvailable: p.isAvailable,
          verified: p.verified
        })),
        firstProfile: firstProfile ? {
          id: firstProfile._id,
          role: firstProfile.role,
          userId: firstProfile.userId
        } : null
      };
    } catch (error) {
      console.error("Debug query error:", error);
      return {
        error: String(error),
        allProfiles: [],
        doctorProfiles: [],
        firstProfile: null
      };
    }
  },
});

/**
 * Test function to create a sample staff profile
 */
export const createTestStaffProfile = mutation({
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
  },
  handler: async (ctx, args) => {
    try {
      console.log("Creating test staff profile for user:", args.userId);
      
      const staffProfileId = await ctx.db.insert("staff_profiles", {
        userId: args.userId,
        role: args.role,
        isAvailable: true,
        verified: false,
        createdAt: Date.now(),
      });
      
      console.log("Created staff profile with ID:", staffProfileId);
      return staffProfileId;
    } catch (error) {
      console.error("Error creating test staff profile:", error);
      throw error;
    }
  },
});

/**
 * Debug function to check users table
 */
export const debugUsers = query({
  args: {},
  handler: async (ctx) => {
    try {
      const users = await ctx.db.query("users").collect();
      console.log("Debug - Users count:", users.length);
      console.log("Debug - Users:", users.map(u => ({ 
        id: u._id, 
        email: u.email, 
        firstName: u.firstName, 
        lastName: u.lastName,
        role: u.role // This might be undefined in new schema
      })));
      
      return {
        users: users.map(u => ({
          id: u._id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role
        }))
      };
    } catch (error) {
      console.error("Debug users error:", error);
      return { error: String(error), users: [] };
    }
  },
});

// ===== APPOINTMENT MANAGEMENT FUNCTIONS FOR STAFF =====

/**
 * Get all appointments for a specific staff member
 */
export const getStaffAppointments = query({
  args: {
    staffUserId: v.id("users"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("rescheduled"),
      v.literal("no_show")
    )),
    date: v.optional(v.number()), // Get appointments for a specific date
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("appointments"),
    _creationTime: v.number(),
    patientId: v.id("users"),
    staffProfileId: v.optional(v.id("staff_profiles")), // Made optional to match schema
    appointmentDate: v.number(),
    duration: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("rescheduled"),
      v.literal("no_show")
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
    reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    symptoms: v.optional(v.array(v.string())),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    location: v.optional(v.string()),
    roomNumber: v.optional(v.string()),
    fee: v.optional(v.number()),
    paymentStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("partial"),
      v.literal("waived"),
      v.literal("refunded")
    )),
    reminderSent: v.optional(v.boolean()),
    followUpRequired: v.optional(v.boolean()),
    followUpDate: v.optional(v.number()),
    createdById: v.id("users"),
    approvedById: v.optional(v.id("users")),
    cancelledById: v.optional(v.id("users")),
    cancellationReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    rescheduledFrom: v.optional(v.id("appointments")),
    // Patient information
    patient: v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      gender: v.optional(v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("other"),
        v.literal("prefer_not_to_say")
      )),
    }),
  })),
  handler: async (ctx, args) => {
    // Verify staff member exists and get their staff profile
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    let appointments = await ctx.db
      .query("appointments")
      .withIndex("by_staffProfileId", (q) => q.eq("staffProfileId", staffProfile._id))
      .collect();

    // Apply status filter
    if (args.status) {
      appointments = appointments.filter(appointment => appointment.status === args.status);
    }

    // Apply date filter
    if (args.date) {
      const startOfDay = new Date(args.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(args.date);
      endOfDay.setHours(23, 59, 59, 999);

      appointments = appointments.filter(appointment => 
        appointment.appointmentDate >= startOfDay.getTime() && 
        appointment.appointmentDate <= endOfDay.getTime()
      );
    }

    // Sort by appointment date
    appointments.sort((a, b) => a.appointmentDate - b.appointmentDate);

    // Get patient information for each appointment
    const appointmentsWithPatients = await Promise.all(
      appointments.map(async (appointment) => {
        const patient = await ctx.db.get(appointment.patientId);
        if (!patient) {
          throw new Error(`Patient not found for appointment ${appointment._id}`);
        }

        return {
          ...appointment,
          patient: {
            _id: patient._id,
            _creationTime: patient._creationTime,
            clerkId: patient.clerkId,
            email: patient.email,
            firstName: patient.firstName,
            lastName: patient.lastName,
            imageUrl: patient.imageUrl,
            phoneNumber: patient.phoneNumber,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
          },
        };
      })
    );

    return appointmentsWithPatients.slice(0, args.limit || 50);
  },
});

/**
 * Get upcoming appointments for a staff member (next 7 days)
 */
export const getUpcomingStaffAppointments = query({
  args: {
    staffUserId: v.id("users"),
    days: v.optional(v.number()), // Number of days to look ahead (default 7)
  },
  returns: v.array(v.object({
    _id: v.id("appointments"),
    _creationTime: v.number(),
    patientId: v.id("users"),
    staffProfileId: v.optional(v.id("staff_profiles")), // Made optional to match schema
    appointmentDate: v.number(),
    duration: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("rescheduled"),
      v.literal("no_show")
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
    reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    symptoms: v.optional(v.array(v.string())),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    location: v.optional(v.string()),
    roomNumber: v.optional(v.string()),
    fee: v.optional(v.number()),
    paymentStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("partial"),
      v.literal("waived"),
      v.literal("refunded")
    )),
    reminderSent: v.optional(v.boolean()),
    followUpRequired: v.optional(v.boolean()),
    followUpDate: v.optional(v.number()),
    createdById: v.id("users"),
    approvedById: v.optional(v.id("users")),
    cancelledById: v.optional(v.id("users")),
    cancellationReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    rescheduledFrom: v.optional(v.id("appointments")),
    // Patient information
    patient: v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      dateOfBirth: v.optional(v.number()),
      gender: v.optional(v.union(
        v.literal("male"),
        v.literal("female"),
        v.literal("other"),
        v.literal("prefer_not_to_say")
      )),
    }),
  })),
  handler: async (ctx, args) => {
    // Get staff profile first
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    const now = Date.now();
    const daysAhead = args.days || 7;
    const futureDate = now + (daysAhead * 24 * 60 * 60 * 1000);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_staffProfileId_appointmentDate", (q) => 
        q.eq("staffProfileId", staffProfile._id)
      )
      .filter((q: any) => 
        q.and(
          q.gte(q.field("appointmentDate"), now),
          q.lte(q.field("appointmentDate"), futureDate),
          q.neq(q.field("status"), "cancelled"),
          q.neq(q.field("status"), "completed")
        )
      )
      .order("asc")
      .collect();

    // Get patient information for each appointment
    const appointmentsWithPatients = await Promise.all(
      appointments.map(async (appointment) => {
        const patient = await ctx.db.get(appointment.patientId);
        if (!patient) {
          throw new Error(`Patient not found for appointment ${appointment._id}`);
        }

        return {
          ...appointment,
          patient: {
            _id: patient._id,
            _creationTime: patient._creationTime,
            clerkId: patient.clerkId,
            email: patient.email,
            firstName: patient.firstName,
            lastName: patient.lastName,
            imageUrl: patient.imageUrl,
            phoneNumber: patient.phoneNumber,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
          },
        };
      })
    );

    return appointmentsWithPatients;
  },
});

/**
 * Approve an appointment (staff action)
 */
export const approveAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    staffUserId: v.id("users"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify staff member exists
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify the appointment belongs to this staff member
    if (appointment.staffProfileId !== staffProfile._id) {
      throw new Error("Unauthorized: Appointment does not belong to this staff member");
    }

    if (appointment.status !== "pending") {
      throw new Error("Only pending appointments can be approved");
    }

    await ctx.db.patch(args.appointmentId, {
      status: "approved",
      approvedById: args.staffUserId,
      notes: args.notes ? `${appointment.notes || ""}\nApproval notes: ${args.notes}` : appointment.notes,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Cancel an appointment (staff action)
 */
export const cancelAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    staffUserId: v.id("users"),
    cancellationReason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify staff member exists
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify the appointment belongs to this staff member
    if (appointment.staffProfileId !== staffProfile._id) {
      throw new Error("Unauthorized: Appointment does not belong to this staff member");
    }

    if (appointment.status === "cancelled") {
      throw new Error("Appointment is already cancelled");
    }

    if (appointment.status === "completed") {
      throw new Error("Cannot cancel completed appointment");
    }

    await ctx.db.patch(args.appointmentId, {
      status: "cancelled",
      cancelledById: args.staffUserId,
      cancellationReason: args.cancellationReason,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Request reschedule (staff action)
 */
export const requestReschedule = mutation({
  args: {
    appointmentId: v.id("appointments"),
    staffUserId: v.id("users"),
    suggestedDate: v.number(),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify staff member exists
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify the appointment belongs to this staff member
    if (appointment.staffProfileId !== staffProfile._id) {
      throw new Error("Unauthorized: Appointment does not belong to this staff member");
    }

    if (appointment.status === "cancelled") {
      throw new Error("Cannot reschedule cancelled appointment");
    }

    if (appointment.status === "completed") {
      throw new Error("Cannot reschedule completed appointment");
    }

    // Add reschedule request to notes
    const rescheduleNote = `Reschedule requested by staff. Suggested date: ${new Date(args.suggestedDate).toLocaleString()}. Reason: ${args.reason || "No reason provided"}`;
    
    await ctx.db.patch(args.appointmentId, {
      notes: `${appointment.notes || ""}\n${rescheduleNote}`,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark appointment as completed (staff action)
 */
export const completeAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    staffUserId: v.id("users"),
    notes: v.optional(v.string()),
    followUpRequired: v.optional(v.boolean()),
    followUpDate: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify staff member exists
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify the appointment belongs to this staff member
    if (appointment.staffProfileId !== staffProfile._id) {
      throw new Error("Unauthorized: Appointment does not belong to this staff member");
    }

    if (appointment.status === "cancelled") {
      throw new Error("Cannot complete cancelled appointment");
    }

    await ctx.db.patch(args.appointmentId, {
      status: "completed",
      notes: args.notes ? `${appointment.notes || ""}\nCompletion notes: ${args.notes}` : appointment.notes,
      followUpRequired: args.followUpRequired,
      followUpDate: args.followUpDate,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark appointment as no-show (staff action)
 */
export const markNoShow = mutation({
  args: {
    appointmentId: v.id("appointments"),
    staffUserId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify staff member exists
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify the appointment belongs to this staff member
    if (appointment.staffProfileId !== staffProfile._id) {
      throw new Error("Unauthorized: Appointment does not belong to this staff member");
    }

    if (appointment.status === "cancelled") {
      throw new Error("Cannot mark cancelled appointment as no-show");
    }

    if (appointment.status === "completed") {
      throw new Error("Cannot mark completed appointment as no-show");
    }

    await ctx.db.patch(args.appointmentId, {
      status: "no_show",
      updatedAt: Date.now(),
    });
  },
});

// ===== AVAILABLE TIMES MANAGEMENT =====

/**
 * Get staff member's available time slots
 */
export const getStaffAvailableTimes = query({
  args: {
    staffUserId: v.id("users"),
    date: v.optional(v.number()), // Get slots for a specific date
  },
  returns: v.array(v.object({
    _id: v.id("availableTimes"),
    _creationTime: v.number(),
    staffProfileId: v.optional(v.id("staff_profiles")), // Made optional to match schema
    userId: v.optional(v.id("users")), // Legacy field
    dayOfWeek: v.optional(v.union(
      v.literal("Monday"),
      v.literal("Tuesday"),
      v.literal("Wednesday"),
      v.literal("Thursday"),
      v.literal("Friday"),
      v.literal("Saturday"),
      v.literal("Sunday")
    )),
    startTime: v.string(),
    endTime: v.string(),
    isRecurring: v.boolean(),
    date: v.optional(v.number()),
    isAvailable: v.optional(v.boolean()), // Added to match schema
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    // Get staff profile first
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    let availableTimes = await ctx.db
      .query("availableTimes")
      .withIndex("by_staffProfileId", (q) => q.eq("staffProfileId", staffProfile._id))
      .collect();

    // Filter by selected date if provided
    if (args.date) {
      const selectedDate = new Date(args.date);
      // Normalize to local calendar day
      const selectedYear = selectedDate.getFullYear();
      const selectedMonth = selectedDate.getMonth();
      const selectedDay = selectedDate.getDate();
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }) as
        'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

      availableTimes = availableTimes.filter((slot) => {
        // Exclude explicitly unavailable slots
        if (slot.isAvailable === false) return false;

        // Recurring slots must match the selected day of week
        if (slot.isRecurring && slot.dayOfWeek === dayOfWeek) {
          return true;
        }

        // Specific-date slots must match the same calendar day
        if (slot.date) {
          const slotDate = new Date(slot.date);
          return (
            slotDate.getFullYear() === selectedYear &&
            slotDate.getMonth() === selectedMonth &&
            slotDate.getDate() === selectedDay
          );
        }

        return false;
      });
    } else {
      // When no date filter is provided, exclude explicitly unavailable slots
      availableTimes = availableTimes.filter((slot) => slot.isAvailable !== false);
    }

    // Deduplicate identical time ranges (start-end) to avoid duplicates in UI
    const seen: Record<string, boolean> = {};
    const deduped = availableTimes.filter((slot) => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });

    return deduped;
  },
});

/**
 * Add available time slot for staff member
 */
export const addAvailableTime = mutation({
  args: {
    staffUserId: v.id("users"),
    dayOfWeek: v.union(
      v.literal("Monday"),
      v.literal("Tuesday"),
      v.literal("Wednesday"),
      v.literal("Thursday"),
      v.literal("Friday"),
      v.literal("Saturday"),
      v.literal("Sunday")
    ),
    startTime: v.string(),
    endTime: v.string(),
    isRecurring: v.boolean(),
    date: v.optional(v.number()), // Specific date for one-off slots
  },
  returns: v.id("availableTimes"),
  handler: async (ctx, args) => {
    // Verify staff member exists
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    const timeSlotId = await ctx.db.insert("availableTimes", {
      staffProfileId: staffProfile._id,
      dayOfWeek: args.dayOfWeek,
      startTime: args.startTime,
      endTime: args.endTime,
      isRecurring: args.isRecurring,
      isAvailable: true, // Default to available
      date: args.date,
      createdAt: Date.now(),
    });

    return timeSlotId;
  },
});

/**
 * Remove available time slot
 */
export const removeAvailableTime = mutation({
  args: {
    timeSlotId: v.id("availableTimes"),
    staffUserId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify staff member exists
    const staffProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.staffUserId))
      .first();

    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    const timeSlot = await ctx.db.get(args.timeSlotId);
    if (!timeSlot) {
      throw new Error("Time slot not found");
    }

    // Verify the time slot belongs to this staff member
    if (timeSlot.staffProfileId !== staffProfile._id) {
      throw new Error("Unauthorized: Time slot does not belong to this staff member");
    }

    await ctx.db.delete(args.timeSlotId);
  },
});

// ===== STAFF DISCOVERY FUNCTIONS FOR PATIENTS =====

/**
 * Get all doctors available for appointments
 */
export const getAvailableDoctors = query({
  args: {},
  returns: v.array(v.object({
    user: v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
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
    // Get all doctor profiles (role = "doctor")
    const doctorProfiles = await ctx.db
      .query("staff_profiles")
      .withIndex("by_role", (q) => q.eq("role", "doctor"))
      .collect();

    // Get user data for each doctor profile
    const doctors = await Promise.all(
      doctorProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        if (!user) {
          throw new Error(`User not found for doctor profile ${profile._id}`);
        }
        return {
          user: {
            _id: user._id,
            _creationTime: user._creationTime,
            clerkId: user.clerkId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            phoneNumber: user.phoneNumber,
          },
          staffProfile: profile,
        };
      })
    );

    // Sort by rating (highest first)
    doctors.sort((a, b) => (b.staffProfile.rating || 0) - (a.staffProfile.rating || 0));
    return doctors;
  },
});

/**
 * Get all nurses available for appointments
 */
export const getAvailableNurses = query({
  args: {
    subRole: v.optional(v.string()),
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
      phoneNumber: v.optional(v.string()),
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
    // Get all nurse profiles
    const nurseProfiles = await ctx.db
      .query("staff_profiles")
      .withIndex("by_role", (q) => q.eq("role", "nurse"))
      .collect();

    // Apply filters
    let filteredProfiles = nurseProfiles;
    
    if (args.subRole) {
      filteredProfiles = filteredProfiles.filter(profile => 
        profile.subRole === args.subRole
      );
    }
    
    if (args.isAvailable !== undefined) {
      filteredProfiles = filteredProfiles.filter(profile => 
        profile.isAvailable === args.isAvailable
      );
    }
    
    if (args.verified !== undefined) {
      filteredProfiles = filteredProfiles.filter(profile => 
        profile.verified === args.verified
      );
    }

    // Get user data for each nurse profile
    const nurses = await Promise.all(
      filteredProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        if (!user) {
          throw new Error(`User not found for nurse profile ${profile._id}`);
        }
        return {
          user: {
            _id: user._id,
            _creationTime: user._creationTime,
            clerkId: user.clerkId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            phoneNumber: user.phoneNumber,
          },
          staffProfile: profile,
        };
      })
    );

    // Sort by rating (highest first) and limit
    nurses.sort((a, b) => (b.staffProfile.rating || 0) - (a.staffProfile.rating || 0));
    return nurses.slice(0, args.limit || 50);
  },
});

/**
 * Get specialists by specialty
 */
export const getSpecialistsBySpecialty = query({
  args: {
    specialty: v.string(),
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
      phoneNumber: v.optional(v.string()),
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
    // Get all staff profiles with the specified specialty
    const allProfiles = await ctx.db.query("staff_profiles").collect();
    
    let specialistProfiles = allProfiles.filter(profile => 
      profile.specialty?.toLowerCase().includes(args.specialty.toLowerCase())
    );

    // Apply additional filters
    if (args.isAvailable !== undefined) {
      specialistProfiles = specialistProfiles.filter(profile => 
        profile.isAvailable === args.isAvailable
      );
    }
    
    if (args.verified !== undefined) {
      specialistProfiles = specialistProfiles.filter(profile => 
        profile.verified === args.verified
      );
    }

    // Get user data for each specialist profile
    const specialists = await Promise.all(
      specialistProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        if (!user) {
          throw new Error(`User not found for specialist profile ${profile._id}`);
        }
        return {
          user: {
            _id: user._id,
            _creationTime: user._creationTime,
            clerkId: user.clerkId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            phoneNumber: user.phoneNumber,
          },
          staffProfile: profile,
        };
      })
    );

    // Sort by rating (highest first) and limit
    specialists.sort((a, b) => (b.staffProfile.rating || 0) - (a.staffProfile.rating || 0));
    return specialists.slice(0, args.limit || 50);
  },
});

/**
 * Migration function to add isAvailable field to existing staff profiles
 * Run this once after schema update to fix existing data
 */
export const migrateStaffProfilesIsAvailable = mutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Get all staff profiles
      const staffProfiles = await ctx.db.query("staff_profiles").collect();

      for (const profile of staffProfiles) {
        try {
          // Check if profile needs migration
          const needsIsAvailableMigration = profile.isAvailable === undefined;
          
          if (needsIsAvailableMigration) {
            const patchData = {
              isAvailable: true, // Default to available
              updatedAt: Date.now(),
            };

            await ctx.db.patch(profile._id, patchData);
            migratedCount++;
          }
        } catch (error) {
          errors.push(`Failed to migrate staff profile ${profile._id}: ${error}`);
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
 * Comprehensive function to check database state and create test data
 * This will help diagnose and fix the empty staff_profiles issue
 */
/**
 * Quick test function to check a user's profile status
 */
export const testUserProfileStatus = query({
  args: { 
    clerkId: v.string() 
  },
  returns: v.object({
    found: v.boolean(),
    userId: v.union(v.id("users"), v.null()),
    profileStatus: v.union(v.object({
      hasProfile: v.boolean(),
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
        v.literal("editor"),
        v.null()
      ),
      isStaff: v.boolean(),
      profile: v.union(
        v.object({
          _id: v.id("staff_profiles"),
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
          verified: v.boolean(),
        }),
        v.null()
      ),
    }), v.null()),
  }),
  handler: async (ctx, args) => {
    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { found: false, userId: null, profileStatus: null };
    }

    // Get profile status (inline implementation to avoid circular calls)
    const profile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    const profileStatus = {
      hasProfile: !!profile,
      role: profile?.role || null,
      isStaff: !!profile,
      profile: profile || null
    };

    return {
      found: true,
      userId: user._id,
      profileStatus: {
        hasProfile: profileStatus.hasProfile,
        role: profileStatus.role,
        isStaff: profileStatus.isStaff,
        profile: profileStatus.profile ? {
          _id: profileStatus.profile._id,
          role: profileStatus.profile.role,
          verified: profileStatus.profile.verified,
        } : null,
      },
    };
  },
});

export const checkAndFixDatabaseState = mutation({
  args: {},
  returns: v.object({
    usersCount: v.number(),
    staffProfilesCount: v.number(),
    usersWithRole: v.array(v.object({
      id: v.id("users"),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      role: v.optional(v.string()),
    })),
    createdTestProfiles: v.array(v.id("staff_profiles")),
  }),
  handler: async (ctx) => {
    console.log("Starting comprehensive database check and fix...");
    
    // 1. Check users table
    const allUsers = await ctx.db.query("users").collect();
    console.log("Total users found:", allUsers.length);
    
    const usersWithRole = allUsers.filter(user => user.role !== undefined);
    console.log("Users with role field:", usersWithRole.length);
    
    // 2. Check staff_profiles table
    const allStaffProfiles = await ctx.db.query("staff_profiles").collect();
    console.log("Total staff profiles found:", allStaffProfiles.length);
    
    // 3. If no staff profiles, create some test ones
    const createdTestProfiles: Id<"staff_profiles">[] = [];
    
    if (allStaffProfiles.length === 0 && allUsers.length > 0) {
      console.log("No staff profiles found, creating test profiles...");
      
      // Create test staff profiles for first few users
      const usersToCreateProfilesFor = allUsers.slice(0, 3);
      
      // Sample profile images for test doctors
      const sampleProfileImages = [
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&h=400&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=400&h=400&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&h=400&fit=crop&crop=face"
      ];
      
      const specialties = ["Cardiology", "General Practice", "Pediatrics"];
      const experienceYears = [3, 7, 12];
      
      for (let i = 0; i < usersToCreateProfilesFor.length; i++) {
        const user = usersToCreateProfilesFor[i];
        try {
          const staffProfileId = await ctx.db.insert("staff_profiles", {
            userId: user._id,
            role: "doctor",
            specialty: specialties[i] || "General Practice",
            experience: experienceYears[i] || 5,
            bio: `Experienced ${specialties[i] || "General Practice"} specialist dedicated to providing quality healthcare services.`,
            qualifications: ["MD", "MBBS"],
            languages: ["English"],
            consultationFee: 50000 + (i * 10000), // Varying consultation fees
            profileImage: sampleProfileImages[i], // Add profile image
            isAvailable: true,
            verified: true,
            createdAt: Date.now(),
          });
          createdTestProfiles.push(staffProfileId);
          console.log(`Created test staff profile ${staffProfileId} for user ${user._id} with specialty ${specialties[i]}`);
        } catch (error) {
          console.error(`Failed to create test profile for user ${user._id}:`, error);
        }
      }
    }
    
    return {
      usersCount: allUsers.length,
      staffProfilesCount: allStaffProfiles.length,
      usersWithRole: usersWithRole.map(user => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      })),
      createdTestProfiles,
    };
  },
});

// ===== STAFF VERIFICATION FUNCTIONS (ADMIN ONLY) =====

/**
 * Get all unverified staff profiles (admin only)
 */
export const getUnverifiedStaffProfiles = query({
  args: {
    adminUserId: v.id("users"),
  },
  returns: v.array(v.object({
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
    user: v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    }),
  })),
  handler: async (ctx, args) => {
    // Verify admin has permission
    const adminProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.adminUserId))
      .first();

    if (!adminProfile || !["admin", "superadmin"].includes(adminProfile.role)) {
      throw new Error("Unauthorized: Only admins can view unverified staff profiles");
    }

    // Get all unverified staff profiles
    const unverifiedProfiles = await ctx.db
      .query("staff_profiles")
      .withIndex("by_verified", (q) => q.eq("verified", false))
      .collect();

    // Get user info for each profile
    const profilesWithUsers = await Promise.all(
      unverifiedProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        if (!user) {
          throw new Error(`User not found for staff profile ${profile._id}`);
        }
        return {
          staffProfile: profile,
          user: {
            _id: user._id,
            _creationTime: user._creationTime,
            clerkId: user.clerkId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          },
        };
      })
    );

    // Sort by creation time (most recent first)
    profilesWithUsers.sort((a, b) => b.staffProfile._creationTime - a.staffProfile._creationTime);

    return profilesWithUsers;
  },
});

/**
 * Verify a staff profile (admin only)
 */
export const verifyStaffProfile = mutation({
  args: {
    staffProfileId: v.id("staff_profiles"),
    adminUserId: v.id("users"),
    verified: v.boolean(), // true to verify, false to unverify
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify admin has permission
    const adminProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.adminUserId))
      .first();

    if (!adminProfile || !["admin", "superadmin"].includes(adminProfile.role)) {
      throw new Error("Unauthorized: Only admins can verify staff profiles");
    }

    // Get the staff profile
    const staffProfile = await ctx.db.get(args.staffProfileId);
    if (!staffProfile) {
      throw new Error("Staff profile not found");
    }

    // Update verification status
    await ctx.db.patch(args.staffProfileId, {
      verified: args.verified,
      verifiedById: args.verified ? args.adminUserId : undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get staff verification statistics (admin only)
 */
export const getVerificationStats = query({
  args: {
    adminUserId: v.id("users"),
  },
  returns: v.object({
    verified: v.number(),
    unverified: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    // Verify admin has permission
    const adminProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.adminUserId))
      .first();

    if (!adminProfile || !["admin", "superadmin"].includes(adminProfile.role)) {
      throw new Error("Unauthorized: Only admins can view verification statistics");
    }

    // Get all staff profiles
    const allProfiles = await ctx.db.query("staff_profiles").collect();

    const stats = {
      verified: allProfiles.filter(p => p.verified).length,
      unverified: allProfiles.filter(p => !p.verified).length,
      total: allProfiles.length,
    };

    return stats;
  },
});

/**
 * Create first admin user (for initial setup only)
 */
export const createFirstAdmin = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if any admin exists
    const existingAdmins = await ctx.db
      .query("staff_profiles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    if (existingAdmins.length > 0) {
      throw new Error("Admin already exists");
    }

    // Check if user already has a staff profile
    const existingProfile = await ctx.db
      .query("staff_profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingProfile) {
      throw new Error("User already has a staff profile");
    }

    // Create admin profile
    await ctx.db.insert("staff_profiles", {
      userId: args.userId,
      role: "admin",
      subRole: "system_admin",
      bio: "System Administrator",
      isAvailable: true,
      verified: true,
      createdAt: Date.now(),
    });
  },
}); 