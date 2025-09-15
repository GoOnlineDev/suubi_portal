import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ===== QUERIES =====

/**
 * Get all appointments for a specific patient
 */
export const getPatientAppointments = query({
  args: {
    patientId: v.id("users"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("rescheduled"),
      v.literal("no_show")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("appointments"),
    _creationTime: v.number(),
    patientId: v.id("users"),
    staffProfileId: v.id("staff_profiles"),
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
    approvedBy: v.optional(v.id("users")),
    cancelledById: v.optional(v.id("users")),
    cancellationReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    rescheduledFrom: v.optional(v.id("appointments")),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId));

    if (args.status) {
      query = ctx.db
        .query("appointments")
        .withIndex("by_patientId_status", (q) => 
          q.eq("patientId", args.patientId).eq("status", args.status!)
        );
    }

    const appointments = await query
      .order("desc")
      .take(args.limit || 50);

    return appointments;
  },
});

/**
 * Get all appointments for a specific patient with staff profile information
 */
export const getPatientAppointmentsWithStaff = query({
  args: {
    patientId: v.id("users"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("rescheduled"),
      v.literal("no_show")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("appointments"),
    _creationTime: v.number(),
    patientId: v.id("users"),
    staffProfileId: v.id("staff_profiles"),
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
    approvedBy: v.optional(v.id("users")),
    cancelledById: v.optional(v.id("users")),
    cancellationReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    rescheduledFrom: v.optional(v.id("appointments")),
    // Staff profile information
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
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
    // User information for the staff member
    staffUser: v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
    }),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId));

    if (args.status) {
      query = ctx.db
        .query("appointments")
        .withIndex("by_patientId_status", (q) => 
          q.eq("patientId", args.patientId).eq("status", args.status!)
        );
    }

    const appointments = await query
      .order("desc")
      .take(args.limit || 50);

    // Get staff profile and user information for each appointment
    const appointmentsWithStaff = await Promise.all(
      appointments.map(async (appointment) => {
        const staffProfile = await ctx.db.get(appointment.staffProfileId);
        if (!staffProfile) {
          throw new Error(`Staff profile not found for appointment ${appointment._id}`);
        }

        const staffUser = await ctx.db.get(staffProfile.userId);
        if (!staffUser) {
          throw new Error(`User not found for staff profile ${staffProfile._id}`);
        }

        // Map legacy fields to match validator and omit extras
        const { approvedById, ...appointmentRest } = appointment as any;

        return {
          ...appointmentRest,
          approvedBy: (appointment as any).approvedBy ?? approvedById,
          staffProfile,
          staffUser: {
            _id: staffUser._id,
            _creationTime: staffUser._creationTime,
            clerkId: staffUser.clerkId,
            email: staffUser.email,
            firstName: staffUser.firstName,
            lastName: staffUser.lastName,
            imageUrl: staffUser.imageUrl,
            phoneNumber: staffUser.phoneNumber,
          },
        };
      })
    );

    return appointmentsWithStaff;
  },
});

/**
 * Get all appointments for a specific doctor
 */
export const getDoctorAppointments = query({
  args: {
    staffProfileId: v.id("staff_profiles"),
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
    staffProfileId: v.id("staff_profiles"),
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
    approvedBy: v.optional(v.id("users")),
    cancelledById: v.optional(v.id("users")),
    cancellationReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    rescheduledFrom: v.optional(v.id("appointments")),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("appointments")
      .withIndex("by_staffProfileId", (q) => q.eq("staffProfileId", args.staffProfileId));

    if (args.status) {
      query = ctx.db
        .query("appointments")
        .withIndex("by_staffProfileId_status", (q) => 
          q.eq("staffProfileId", args.staffProfileId).eq("status", args.status!)
        );
    }

    const appointments = await query
      .order("asc") // Order by appointment date ascending
      .take(args.limit || 50);

    // Filter by date if provided
    if (args.date) {
      const startOfDay = new Date(args.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(args.date);
      endOfDay.setHours(23, 59, 59, 999);

      return appointments.filter(appointment => 
        appointment.appointmentDate >= startOfDay.getTime() && 
        appointment.appointmentDate <= endOfDay.getTime()
      );
    }

    return appointments;
  },
});

/**
 * Get a specific appointment by ID
 */
export const getAppointment = query({
  args: {
    appointmentId: v.id("appointments"),
  },
  returns: v.union(
    v.object({
      _id: v.id("appointments"),
      _creationTime: v.number(),
      patientId: v.id("users"),
      staffProfileId: v.id("staff_profiles"),
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
      approvedBy: v.optional(v.id("users")),
      cancelledById: v.optional(v.id("users")),
      cancellationReason: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      rescheduledFrom: v.optional(v.id("appointments")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    return appointment;
  },
});

/**
 * Get upcoming appointments for a doctor (next 7 days)
 */
export const getUpcomingDoctorAppointments = query({
  args: {
    staffProfileId: v.id("staff_profiles"),
    days: v.optional(v.number()), // Number of days to look ahead (default 7)
  },
  returns: v.array(v.object({
    _id: v.id("appointments"),
    _creationTime: v.number(),
    patientId: v.id("users"),
    staffProfileId: v.id("staff_profiles"),
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
    approvedBy: v.optional(v.id("users")),
    cancelledById: v.optional(v.id("users")),
    cancellationReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    rescheduledFrom: v.optional(v.id("appointments")),
  })),
  handler: async (ctx, args) => {
    const now = Date.now();
    const daysAhead = args.days || 7;
    const futureDate = now + (daysAhead * 24 * 60 * 60 * 1000);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_staffProfileId_appointmentDate", (q) => 
        q.eq("staffProfileId", args.staffProfileId)
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

    return appointments;
  },
});

// ===== MUTATIONS =====

/**
 * Create a new appointment
 */
export const createAppointment = mutation({
  args: {
    patientId: v.id("users"),
    staffProfileId: v.id("staff_profiles"),
    appointmentDate: v.number(),
    duration: v.optional(v.number()),
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
    createdById: v.id("users"),
  },
  returns: v.id("appointments"),
  handler: async (ctx, args) => {
    // Verify patient exists
    const patient = await ctx.db.get(args.patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Verify staff profile exists and has appropriate role
    const staffProfile = await ctx.db.get(args.staffProfileId);

    if (!staffProfile) {
      throw new Error("User is not authorized to provide medical services - no staff profile found");
    }

    if (!["doctor", "nurse", "allied_health"].includes(staffProfile.role)) {
      throw new Error("User is not authorized to provide medical services - invalid role");
    }

    // Check if doctor is available at the requested time
    const isAvailable = await checkDoctorAvailability(ctx, args.staffProfileId, args.appointmentDate, args.duration || 30);
    if (!isAvailable) {
      throw new Error("Doctor is not available at the requested time");
    }

    // Check for conflicts with existing appointments
    const hasConflict = await checkAppointmentConflict(ctx, args.staffProfileId, args.appointmentDate, args.duration || 30);
    if (hasConflict) {
      throw new Error("Time slot conflicts with existing appointment");
    }

    const appointmentId = await ctx.db.insert("appointments", {
      patientId: args.patientId,
      staffProfileId: args.staffProfileId,
      appointmentDate: args.appointmentDate,
      duration: args.duration || 30,
      status: "pending",
      appointmentType: args.appointmentType,
      reason: args.reason,
      notes: args.notes,
      symptoms: args.symptoms,
      priority: args.priority || "medium",
      location: args.location,
      roomNumber: args.roomNumber,
      fee: args.fee,
      paymentStatus: args.fee ? "pending" : undefined,
      createdById: args.createdById,
      createdAt: Date.now(),
    });

    return appointmentId;
  },
});

/**
 * Approve an appointment
 */
export const approveAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    approvedBy: v.id("users"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status !== "pending") {
      throw new Error("Only pending appointments can be approved");
    }

    await ctx.db.patch(args.appointmentId, {
      status: "approved",
      approvedById: args.approvedBy,
      notes: args.notes ? `${appointment.notes || ""}\nApproval notes: ${args.notes}` : appointment.notes,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Confirm an appointment (by patient)
 */
export const confirmAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    confirmedBy: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status !== "approved") {
      throw new Error("Only approved appointments can be confirmed");
    }

    if (appointment.patientId !== args.confirmedBy) {
      throw new Error("Only the patient can confirm the appointment");
    }

    await ctx.db.patch(args.appointmentId, {
      status: "confirmed",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Cancel an appointment
 */
export const cancelAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    cancelledBy: v.id("users"),
    cancellationReason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status === "cancelled") {
      throw new Error("Appointment is already cancelled");
    }

    if (appointment.status === "completed") {
      throw new Error("Cannot cancel completed appointment");
    }

    await ctx.db.patch(args.appointmentId, {
      status: "cancelled",
      cancelledById: args.cancelledBy,
      cancellationReason: args.cancellationReason,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Reschedule an appointment
 */
export const rescheduleAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    newAppointmentDate: v.number(),
    newDuration: v.optional(v.number()),
    rescheduledBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  returns: v.id("appointments"),
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status === "cancelled") {
      throw new Error("Cannot reschedule cancelled appointment");
    }

    if (appointment.status === "completed") {
      throw new Error("Cannot reschedule completed appointment");
    }

    // Check if doctor is available at the new time
    const isAvailable = await checkDoctorAvailability(ctx, appointment.staffProfileId, args.newAppointmentDate, args.newDuration || appointment.duration);
    if (!isAvailable) {
      throw new Error("Doctor is not available at the requested time");
    }

    // Check for conflicts with existing appointments
    const hasConflict = await checkAppointmentConflict(ctx, appointment.staffProfileId, args.newAppointmentDate, args.newDuration || appointment.duration, args.appointmentId);
    if (hasConflict) {
      throw new Error("Time slot conflicts with existing appointment");
    }

    // Create new appointment
    const newAppointmentId = await ctx.db.insert("appointments", {
      patientId: appointment.patientId,
      staffProfileId: appointment.staffProfileId,
      appointmentDate: args.newAppointmentDate,
      duration: args.newDuration || appointment.duration,
      status: "pending",
      appointmentType: appointment.appointmentType,
      reason: appointment.reason,
      notes: appointment.notes,
      symptoms: appointment.symptoms,
      priority: appointment.priority,
      location: appointment.location,
      roomNumber: appointment.roomNumber,
      fee: appointment.fee,
      paymentStatus: appointment.paymentStatus,
      createdById: args.rescheduledBy,
      rescheduledFrom: args.appointmentId,
      createdAt: Date.now(),
    });

    // Update original appointment
    await ctx.db.patch(args.appointmentId, {
      status: "rescheduled",
      updatedAt: Date.now(),
    });

    return newAppointmentId;
  },
});

/**
 * Mark appointment as completed
 */
export const completeAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    completedBy: v.id("users"),
    notes: v.optional(v.string()),
    followUpRequired: v.optional(v.boolean()),
    followUpDate: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
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
 * Mark appointment as no-show
 */
export const markNoShow = mutation({
  args: {
    appointmentId: v.id("appointments"),
    markedBy: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
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

/**
 * Update appointment details
 */
export const updateAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    updates: v.object({
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
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status === "cancelled") {
      throw new Error("Cannot update cancelled appointment");
    }

    if (appointment.status === "completed") {
      throw new Error("Cannot update completed appointment");
    }

    await ctx.db.patch(args.appointmentId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete an appointment (soft delete by cancelling)
 */
export const deleteAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    deletedBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status === "completed") {
      throw new Error("Cannot delete completed appointment");
    }

    await ctx.db.patch(args.appointmentId, {
      status: "cancelled",
      cancelledById: args.deletedBy,
      cancellationReason: args.reason || "Deleted by user",
      updatedAt: Date.now(),
    });
  },
});

// ===== INTERNAL HELPER FUNCTIONS =====

/**
 * Check if doctor is available at a specific time
 */
async function checkDoctorAvailability(
  ctx: any,
  staffProfileId: Id<"staff_profiles">,
  appointmentDate: number,
  duration: number
): Promise<boolean> {
  const appointmentDateTime = new Date(appointmentDate);
  const dayOfWeek = appointmentDateTime.toLocaleDateString('en-US', { weekday: 'long' }) as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  
  // Get both recurring slots for this day and specific date slots
  const recurringSlots = await ctx.db
    .query("availableTimes")
    .withIndex("by_staffProfileId_dayOfWeek", (q: any) => 
      q.eq("staffProfileId", staffProfileId).eq("dayOfWeek", dayOfWeek)
    )
    .filter((q: any) => q.eq(q.field("isRecurring"), true))
    .collect();

  const specificSlots = await ctx.db
    .query("availableTimes")
    .withIndex("by_staffProfileId_date", (q: any) => 
      q.eq("staffProfileId", staffProfileId).eq("date", appointmentDate)
    )
    .collect();

  const availableTimes = [...recurringSlots, ...specificSlots];

  if (availableTimes.length === 0) {
    return false;
  }

  const appointmentTime = appointmentDateTime.getHours() * 60 + appointmentDateTime.getMinutes();
  const appointmentEndTime = appointmentTime + duration;

  // Check if appointment time falls within any available slot
  for (const slot of availableTimes) {
    const slotStartTime = timeStringToMinutes(slot.startTime);
    let slotEndTime = timeStringToMinutes(slot.endTime);

    // Handle overnight shifts (when end time is less than start time)
    if (slotEndTime <= slotStartTime) {
      // This is an overnight shift
      // Check if appointment is in the first part (same day)
      if (appointmentTime >= slotStartTime && appointmentEndTime <= 24 * 60) {
        return true;
      }
      // Check if appointment is in the second part (next day)
      if (appointmentTime >= 0 && appointmentEndTime <= slotEndTime) {
        return true;
      }
      // Check if appointment spans midnight (starts before midnight, ends after)
      if (appointmentTime >= slotStartTime && appointmentTime < 24 * 60 && 
          appointmentEndTime > 24 * 60 && (appointmentEndTime - 24 * 60) <= slotEndTime) {
        return true;
      }
    } else {
      // Regular shift (same day)
      if (appointmentTime >= slotStartTime && appointmentEndTime <= slotEndTime) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check for appointment conflicts
 */
async function checkAppointmentConflict(
  ctx: any,
  staffProfileId: Id<"staff_profiles">,
  appointmentDate: number,
  duration: number,
  excludeAppointmentId?: Id<"appointments">
): Promise<boolean> {
  const appointmentEndTime = appointmentDate + (duration * 60 * 1000);

  const existingAppointments = await ctx.db
    .query("appointments")
    .withIndex("by_staffProfileId_appointmentDate", (q: any) => 
      q.eq("staffProfileId", staffProfileId)
    )
    .filter((q: any) => 
      q.and(
        q.neq(q.field("status"), "cancelled"),
        q.neq(q.field("status"), "completed"),
        q.neq(q.field("status"), "no_show"),
        q.neq(q.field("status"), "rescheduled"),
        excludeAppointmentId ? q.neq(q.field("_id"), excludeAppointmentId) : q.neq(q.field("_id"), ""),
        q.or(
          q.and(
            q.gte(q.field("appointmentDate"), appointmentDate),
            q.lt(q.field("appointmentDate"), appointmentEndTime)
          ),
          q.and(
            q.gt(q.field("appointmentDate"), appointmentDate),
            q.lte(q.field("appointmentDate"), appointmentEndTime)
          )
        )
      )
    )
    .collect();

  return existingAppointments.length > 0;
}

/**
 * Convert time string (HH:MM) to minutes
 */
function timeStringToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// ===== INTERNAL QUERIES FOR AVAILABILITY =====

/**
 * Get doctor's available time slots for a specific date
 */
export const getDoctorAvailableSlots = query({
  args: {
    staffProfileId: v.id("staff_profiles"),
    date: v.number(), // Date timestamp
  },
  returns: v.array(v.object({
    startTime: v.string(),
    endTime: v.string(),
    isRecurring: v.boolean(),
    date: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const appointmentDate = new Date(args.date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }) as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    
    // Get recurring slots for this day of week
    const recurringSlots = await ctx.db
      .query("availableTimes")
      .withIndex("by_staffProfileId_dayOfWeek", (q) => 
        q.eq("staffProfileId", args.staffProfileId).eq("dayOfWeek", dayOfWeek)
      )
      .filter((q: any) => q.eq(q.field("isRecurring"), true))
      .collect();

    // Get specific date slots
    const specificSlots = await ctx.db
      .query("availableTimes")
      .withIndex("by_staffProfileId_date", (q) => 
        q.eq("staffProfileId", args.staffProfileId).eq("date", args.date)
      )
      .collect();

    // Combine and return all available slots
    return [...recurringSlots, ...specificSlots].map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      isRecurring: slot.isRecurring,
      date: slot.date,
    }));
  },
});

/**
 * Check if a specific time slot is available for booking
 */
export const checkTimeSlotAvailability = query({
  args: {
    staffProfileId: v.id("staff_profiles"),
    appointmentDate: v.number(),
    duration: v.number(),
  },
  returns: v.object({
    isAvailable: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Check doctor availability
    const isDoctorAvailable = await checkDoctorAvailability(ctx, args.staffProfileId, args.appointmentDate, args.duration);
    if (!isDoctorAvailable) {
      return {
        isAvailable: false,
        reason: "Doctor is not available at this time"
      };
    }

    // Check for conflicts
    const hasConflict = await checkAppointmentConflict(ctx, args.staffProfileId, args.appointmentDate, args.duration);
    if (hasConflict) {
      return {
        isAvailable: false,
        reason: "Time slot conflicts with existing appointment"
      };
    }

    return {
      isAvailable: true,
    };
  },
});

/**
 * Get doctor's available time slots with conflict checking for a specific date
 * This function returns available slots broken down by appointment duration intervals
 */
export const getDoctorAvailableSlotsWithConflicts = query({
  args: {
    staffProfileId: v.id("staff_profiles"),
    date: v.number(), // Date timestamp
    appointmentDuration: v.optional(v.number()), // Duration in minutes, defaults to 30
  },
  returns: v.array(v.object({
    startTime: v.string(), // 24-hour format HH:MM
    endTime: v.string(), // 24-hour format HH:MM
    isAvailable: v.boolean(),
    conflictReason: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const duration = args.appointmentDuration || 30; // Default 30 minutes
    const appointmentDate = new Date(args.date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }) as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    
    // Get all available time slots for this day
    const recurringSlots = await ctx.db
      .query("availableTimes")
      .withIndex("by_staffProfileId_dayOfWeek", (q) => 
        q.eq("staffProfileId", args.staffProfileId).eq("dayOfWeek", dayOfWeek)
      )
      .filter((q: any) => q.eq(q.field("isRecurring"), true))
      .collect();

    const specificSlots = await ctx.db
      .query("availableTimes")
      .withIndex("by_staffProfileId_date", (q) => 
        q.eq("staffProfileId", args.staffProfileId).eq("date", args.date)
      )
      .collect();

    const allSlots = [...recurringSlots, ...specificSlots];
    
    if (allSlots.length === 0) {
      return [];
    }

    // Generate time slots broken down by appointment duration
    const availableSlots: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      conflictReason?: string;
    }> = [];

    for (const slot of allSlots) {
      const slotStartMinutes = timeStringToMinutes(slot.startTime);
      let slotEndMinutes = timeStringToMinutes(slot.endTime);
      
      // Handle overnight shifts
      if (slotEndMinutes <= slotStartMinutes) {
        slotEndMinutes += 24 * 60; // Add 24 hours for next day
      }

      // Generate appointment slots within this available time
      for (let currentMinutes = slotStartMinutes; currentMinutes + duration <= slotEndMinutes; currentMinutes += duration) {
        const appointmentStartTime = minutesToTimeString(currentMinutes % (24 * 60));
        const appointmentEndTime = minutesToTimeString((currentMinutes + duration) % (24 * 60));
        
        // Create timestamp for this specific appointment slot
        const appointmentDateTime = new Date(args.date);
        const [hours, minutes] = appointmentStartTime.split(':').map(Number);
        appointmentDateTime.setHours(hours, minutes, 0, 0);
        
        // Check if this specific slot is available
        const isDoctorAvailable = await checkDoctorAvailability(ctx, args.staffProfileId, appointmentDateTime.getTime(), duration);
        const hasConflict = await checkAppointmentConflict(ctx, args.staffProfileId, appointmentDateTime.getTime(), duration);
        
        const slotAvailability = {
          isAvailable: isDoctorAvailable && !hasConflict,
          reason: !isDoctorAvailable ? "Doctor is not available at this time" : 
                  hasConflict ? "Time slot conflicts with existing appointment" : undefined,
        };

        availableSlots.push({
          startTime: appointmentStartTime,
          endTime: appointmentEndTime,
          isAvailable: slotAvailability.isAvailable,
          conflictReason: slotAvailability.reason,
        });
      }
    }

    // Sort by start time and remove duplicates
    const uniqueSlots = availableSlots.reduce((acc, slot) => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!acc.some(existing => `${existing.startTime}-${existing.endTime}` === key)) {
        acc.push(slot);
      }
      return acc;
    }, [] as typeof availableSlots);

    return uniqueSlots.sort((a, b) => 
      timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime)
    );
  },
});

/**
 * Convert minutes to time string (HH:MM)
 */
function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get available appointment slots for a doctor in user-friendly 24-hour format
 * This is the main function UI should use to display available slots to patients
 */
export const getAvailableAppointmentSlots = query({
  args: {
    staffProfileId: v.id("staff_profiles"),
    date: v.number(), // Date timestamp
    appointmentDuration: v.optional(v.number()), // Duration in minutes, defaults to 30
  },
  returns: v.array(v.object({
    startTime: v.string(), // 24-hour format HH:MM
    endTime: v.string(), // 24-hour format HH:MM
    displayTime: v.string(), // User-friendly display format
    isAvailable: v.boolean(),
    timestamp: v.number(), // Full timestamp for booking
  })),
  handler: async (ctx, args) => {
    const duration = args.appointmentDuration || 30;
    const appointmentDate = new Date(args.date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }) as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    
    // Get all available time slots for this day
    const recurringSlots = await ctx.db
      .query("availableTimes")
      .withIndex("by_staffProfileId_dayOfWeek", (q) => 
        q.eq("staffProfileId", args.staffProfileId).eq("dayOfWeek", dayOfWeek)
      )
      .filter((q: any) => q.eq(q.field("isRecurring"), true))
      .collect();

    const specificSlots = await ctx.db
      .query("availableTimes")
      .withIndex("by_staffProfileId_date", (q) => 
        q.eq("staffProfileId", args.staffProfileId).eq("date", args.date)
      )
      .collect();

    const allSlots = [...recurringSlots, ...specificSlots];
    
    if (allSlots.length === 0) {
      return [];
    }

    // Generate available appointment slots
    const availableSlots: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      timestamp: number;
    }> = [];

    for (const slot of allSlots) {
      const slotStartMinutes = timeStringToMinutes(slot.startTime);
      let slotEndMinutes = timeStringToMinutes(slot.endTime);
      
      // Handle overnight shifts
      if (slotEndMinutes <= slotStartMinutes) {
        slotEndMinutes += 24 * 60;
      }

      // Generate appointment slots within this available time
      for (let currentMinutes = slotStartMinutes; currentMinutes + duration <= slotEndMinutes; currentMinutes += 30) { // 30-minute intervals
        const appointmentStartTime = minutesToTimeString(currentMinutes % (24 * 60));
        const appointmentEndTime = minutesToTimeString((currentMinutes + duration) % (24 * 60));
        
        // Create timestamp for this specific appointment slot
        const slotDateTime = new Date(args.date);
        const [hours, minutes] = appointmentStartTime.split(':').map(Number);
        slotDateTime.setHours(hours, minutes, 0, 0);
        
        // Check if this specific slot is available
        const isDoctorAvailable = await checkDoctorAvailability(ctx, args.staffProfileId, slotDateTime.getTime(), duration);
        const hasConflict = await checkAppointmentConflict(ctx, args.staffProfileId, slotDateTime.getTime(), duration);
        
        if (isDoctorAvailable && !hasConflict) {
          availableSlots.push({
            startTime: appointmentStartTime,
            endTime: appointmentEndTime,
            isAvailable: true,
            timestamp: slotDateTime.getTime(),
          });
        }
      }
    }

    // Remove duplicates and sort
    const uniqueSlots = availableSlots.reduce((acc, slot) => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!acc.some(existing => `${existing.startTime}-${existing.endTime}` === key)) {
        acc.push(slot);
      }
      return acc;
    }, [] as typeof availableSlots);

    const slotsWithConflicts = uniqueSlots.sort((a, b) => 
      timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime)
    );

    return slotsWithConflicts.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      displayTime: `${slot.startTime} - ${slot.endTime}`,
      isAvailable: slot.isAvailable,
      timestamp: slot.timestamp,
    }));
  },
});

/**
 * Create sample available times for all doctors (for development/testing)
 */
export const createSampleAvailableTimesForAllDoctors = mutation({
  args: {},
  returns: v.array(v.object({
    staffProfileId: v.id("staff_profiles"),
    doctorName: v.string(),
    createdSlots: v.array(v.id("availableTimes")),
  })),
  handler: async (ctx, args) => {
    const results = [];
    const staffProfiles = await ctx.db.query("staff_profiles").collect();
    
    for (const staffProfile of staffProfiles) {
      const user = await ctx.db.get(staffProfile.userId);
      if (!user) continue;
      
      // Check if this doctor already has available times
      const existingTimes = await ctx.db
        .query("availableTimes")
        .withIndex("by_staffProfileId", (q) => q.eq("staffProfileId", staffProfile._id))
        .collect();
      
      if (existingTimes.length > 0) {
        continue; // Skip if already has availability set
      }
      
      const createdSlots: Id<"availableTimes">[] = [];
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
      
      for (const day of weekdays) {
        // Morning shift: 6 AM - 12 PM
        const morningSlot = await ctx.db.insert("availableTimes", {
          staffProfileId: staffProfile._id,
          dayOfWeek: day,
          startTime: "06:00",
          endTime: "12:00",
          isRecurring: true,
          isAvailable: true,
          createdAt: Date.now(),
        });
        createdSlots.push(morningSlot);
        
        // Afternoon shift: 12 PM - 6 PM
        const afternoonSlot = await ctx.db.insert("availableTimes", {
          staffProfileId: staffProfile._id,
          dayOfWeek: day,
          startTime: "12:00",
          endTime: "18:00",
          isRecurring: true,
          isAvailable: true,
          createdAt: Date.now(),
        });
        createdSlots.push(afternoonSlot);
        
        // Evening shift: 6 PM - 12 AM (midnight)
        const eveningSlot = await ctx.db.insert("availableTimes", {
          staffProfileId: staffProfile._id,
          dayOfWeek: day,
          startTime: "18:00",
          endTime: "00:00",
          isRecurring: true,
          isAvailable: true,
          createdAt: Date.now(),
        });
        createdSlots.push(eveningSlot);
      }
      
      results.push({
        staffProfileId: staffProfile._id,
        doctorName: `Dr. ${user.firstName} ${user.lastName}`,
        createdSlots,
      });
    }
    
    return results;
  },
});
