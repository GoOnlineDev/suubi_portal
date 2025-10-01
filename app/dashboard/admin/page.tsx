"use client";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { 
  Calendar, 
  MessageSquare, 
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingUp
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  // Get current user data
  const convexUser = useQuery(api.users.getCurrentUser, user?.id ? { clerkId: user.id } : "skip");
  
  // Get appointment statistics
  const appointmentStats = useQuery(
    api.appointments.getAppointmentStatsForAdmin,
    convexUser?._id ? { adminUserId: convexUser._id } : "skip"
  );

  // Get message statistics
  const messageStats = useQuery(
    api.messages.getMessageStatsForAdmin,
    convexUser?._id ? { adminUserId: convexUser._id } : "skip"
  );

  // Get verification statistics
  const verificationStats = useQuery(
    api.staffProfiles.getVerificationStats,
    convexUser?._id ? { adminUserId: convexUser._id } : "skip"
  );

  // Get all staff
  const allStaff = useQuery(api.users.listStaffUsers, {});

  if (!convexUser) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of all appointments, messages, and staff</p>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Appointments Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{appointmentStats?.total || 0}</p>
            <p className="text-sm text-gray-600">Total Appointments</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/admin/appointments')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View all</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Messages Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            {messageStats && messageStats.unreadMessages > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {messageStats.unreadMessages} unread
              </span>
            )}
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{messageStats?.totalMessages || 0}</p>
            <p className="text-sm text-gray-600">Total Messages</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/admin/messages')}
            className="text-sm text-green-600 hover:text-green-700 flex items-center space-x-1"
          >
            <span>View all</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Staff Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{allStaff?.length || 0}</p>
            <p className="text-sm text-gray-600">Staff Members</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/admin/staff')}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
          >
            <span>Manage staff</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Staff Verification Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            {verificationStats && verificationStats.unverified > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {verificationStats.unverified} unverified
              </span>
            )}
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{verificationStats?.verified || 0}</p>
            <p className="text-sm text-gray-600">Verified Staff</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/admin/verify-staff')}
            className="text-sm text-orange-600 hover:text-orange-700 flex items-center space-x-1"
          >
            <span>Verify staff</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Appointment Status Breakdown */}
      {appointmentStats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.approved}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.confirmed}</p>
                <p className="text-sm text-gray-600">Confirmed</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Staff by Appointments */}
      {appointmentStats && appointmentStats.byStaff.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Staff by Appointments</h2>
          <div className="space-y-3">
            {appointmentStats.byStaff.slice(0, 5).map((staff, index) => (
              <div key={staff.staffProfileId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{staff.staffName}</span>
                </div>
                <span className="text-emerald-600 font-semibold">{staff.count} appointments</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Staff by Messages */}
      {messageStats && messageStats.byStaff.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Staff by Messages</h2>
          <div className="space-y-3">
            {messageStats.byStaff.slice(0, 5).map((staff, index) => (
              <div key={staff.staffUserId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{staff.staffName}</p>
                    <p className="text-sm text-gray-600">{staff.roomCount} rooms</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-600 font-semibold">{staff.messageCount} messages</p>
                  {staff.unreadCount > 0 && (
                    <p className="text-xs text-red-600">{staff.unreadCount} unread</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

