"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { 
  Calendar, 
  Clock, 
  User,
  FileText,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  PhoneCall
} from "lucide-react";

export default function AdminAppointmentsPage() {
  const { user } = useUser();
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get current user data
  const convexUser = useQuery(api.users.getCurrentUser, user?.id ? { clerkId: user.id } : "skip");
  
  // Get all appointments (admin only)
  const allAppointments = useQuery(
    api.appointments.getAllAppointmentsForAdmin,
    convexUser?._id ? {
      adminUserId: convexUser._id,
      staffProfileId: selectedStaffFilter ? selectedStaffFilter as any : undefined,
      status: selectedStatusFilter ? selectedStatusFilter as any : undefined,
      limit: 100,
    } : "skip"
  );

  // Get appointment statistics
  const appointmentStats = useQuery(
    api.appointments.getAppointmentStatsForAdmin,
    convexUser?._id ? { adminUserId: convexUser._id } : "skip"
  );

  // Get all staff members for filtering
  const allStaff = useQuery(api.users.listStaffUsers, {});

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no_show":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!convexUser) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Appointments</h1>
        <p className="text-gray-600">View and manage appointments across all staff members</p>
      </div>

      {/* Statistics Cards */}
      {appointmentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.total}</p>
                <p className="text-gray-600">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.pending}</p>
                <p className="text-gray-600">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.confirmed}</p>
                <p className="text-gray-600">Confirmed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.completed}</p>
                <p className="text-gray-600">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          <Filter className="h-5 w-5" />
          <span>Filters</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Staff Member
              </label>
              <select
                value={selectedStaffFilter || ""}
                onChange={(e) => setSelectedStaffFilter(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Staff</option>
                {allStaff?.map((item: { user: { firstName?: string; lastName?: string }; staffProfile: { _id: string; role: string } }) => (
                  <option key={item.staffProfile._id} value={item.staffProfile._id}>
                    {item.user.firstName} {item.user.lastName} ({item.staffProfile.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={selectedStatusFilter || ""}
                onChange={(e) => setSelectedStatusFilter(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Appointments</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {allAppointments?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium">No appointments found</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          ) : (
            allAppointments?.map((appointment: {
              _id: string;
              appointmentDate: number;
              status: string;
              reason?: string;
              notes?: string;
              patient: {
                firstName?: string;
                lastName?: string;
                email: string;
                phoneNumber?: string;
              };
              staffProfile: {
                role: string;
                specialty?: string;
              };
              staffUser: {
                firstName?: string;
                lastName?: string;
                email: string;
              };
            }) => (
              <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-emerald-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </h3>
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            <span>{appointment.status}</span>
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>Staff: {appointment.staffUser.firstName} {appointment.staffUser.lastName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="h-4 w-4" />
                            <span>{appointment.staffProfile.role} {appointment.staffProfile.specialty && `• ${appointment.staffProfile.specialty}`}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {appointment.patient.phoneNumber && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                            <PhoneCall className="h-4 w-4" />
                            <span>{appointment.patient.phoneNumber}</span>
                          </div>
                        )}

                        {appointment.reason && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Reason:</strong> {appointment.reason}
                          </p>
                        )}

                        {appointment.notes && (
                          <p className="text-sm text-gray-600">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Staff Statistics */}
      {appointmentStats && appointmentStats.byStaff.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointments by Staff Member</h2>
          <div className="space-y-3">
            {appointmentStats.byStaff.map((staff) => (
              <div key={staff.staffProfileId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{staff.staffName}</span>
                <span className="text-emerald-600 font-semibold">{staff.count} appointments</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

