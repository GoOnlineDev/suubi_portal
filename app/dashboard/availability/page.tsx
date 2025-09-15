"use client";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Clock, Calendar, Plus, AlertCircle } from "lucide-react";

import AvailableTimeForm from "@/app/components/AvailableTimeForm";
import AvailableTimeList from "@/app/components/AvailableTimeList";

export default function AvailabilityPage() {
  const { user: clerkUser } = useUser();

  // Fetch user data from Convex
  const convexUser = useQuery(api.users.getCurrentUser, clerkUser?.id ? { clerkId: clerkUser.id } : "skip");
  
  // Fetch staff profile using the new unified system
  const staffProfile = useQuery(
    api.staffProfiles.getStaffProfileByUserId,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Show loading state
  if (!convexUser) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-xl text-slate-600">Loading user profile...</p>
      </div>
    );
  }

  // Show patient message (users without staff profiles)
  if (!staffProfile) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-lg">
          <Clock size={32} className="text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">Availability Management</h2>
        <p className="text-slate-600 mb-8 px-4">
          Availability management is for staff members only.
        </p>
      </div>
    );
  }

  // Show profile completion prompt for staff without profiles
  // This should not happen since we already check for staffProfile above
  // But keeping it as a fallback
  if (!staffProfile) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-lg">
          <AlertCircle size={32} className="text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">Complete Your Profile First</h2>
        <p className="text-slate-600 mb-8 px-4">
          Please complete your professional profile before managing your availability.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard/profile'}
          className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Plus size={20} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
          Complete Profile
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl mr-4 shadow-lg">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Availability Management</h1>
              <p className="text-slate-600">Manage your available time slots and schedule</p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        {staffProfile && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {convexUser?.firstName} {convexUser?.lastName}
                </h3>
                <p className="text-slate-600">
                  {staffProfile.subRole ? 
                    staffProfile.subRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                    "Staff Member"
                  }
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                  <span className="text-sm text-slate-600">Profile Complete</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Availability Form and List */}
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">Add Available Time</h2>
            <AvailableTimeForm />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">Your Available Times</h2>
            <AvailableTimeList />
          </div>
        </div>
      </div>
    </div>
  );
} 