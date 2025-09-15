"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Filter,
  Search,
  Eye,
  MoreVertical
} from "lucide-react";

type AppointmentStatus = "pending" | "approved" | "confirmed" | "completed" | "cancelled" | "rescheduled" | "no_show";

export default function AppointmentsPage() {
  const { user: clerkUser } = useUser();
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Fetch user data from Convex
  const convexUser = useQuery(api.users.getCurrentUser, clerkUser?.id ? { clerkId: clerkUser.id } : "skip");
  
  // Fetch staff appointments
  const staffAppointments = useQuery(
    api.staffProfiles.getStaffAppointments,
    convexUser?._id ? { 
      staffUserId: convexUser._id,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      date: selectedDate ? new Date(selectedDate).getTime() : undefined
    } : "skip"
  );

  // Mutations for appointment management
  const approveAppointment = useMutation(api.staffProfiles.approveAppointment);
  const cancelAppointment = useMutation(api.staffProfiles.cancelAppointment);
  const completeAppointment = useMutation(api.staffProfiles.completeAppointment);
  const markNoShow = useMutation(api.staffProfiles.markNoShow);

  const handleApprove = async (appointmentId: Doc<"appointments">["_id"]) => {
    if (!convexUser) return;
    try {
      await approveAppointment({
        appointmentId,
        staffUserId: convexUser._id,
        notes: "Appointment approved by staff member"
      });
    } catch (error) {
      console.error("Error approving appointment:", error);
      alert("Failed to approve appointment");
    }
  };

  const handleCancel = async (appointmentId: Doc<"appointments">["_id"]) => {
    if (!convexUser) return;
    const reason = prompt("Please provide a reason for cancellation:");
    if (!reason) return;
    
    try {
      await cancelAppointment({
        appointmentId,
        staffUserId: convexUser._id,
        cancellationReason: reason
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment");
    }
  };

  const handleComplete = async (appointmentId: Doc<"appointments">["_id"]) => {
    if (!convexUser) return;
    const notes = prompt("Any completion notes? (optional)");
    
    try {
      await completeAppointment({
        appointmentId,
        staffUserId: convexUser._id,
        notes: notes || undefined,
        followUpRequired: false
      });
    } catch (error) {
      console.error("Error completing appointment:", error);
      alert("Failed to complete appointment");
    }
  };

  const handleNoShow = async (appointmentId: Doc<"appointments">["_id"]) => {
    if (!convexUser) return;
    if (!confirm("Mark this appointment as no-show?")) return;
    
    try {
      await markNoShow({
        appointmentId,
        staffUserId: convexUser._id
      });
    } catch (error) {
      console.error("Error marking no-show:", error);
      alert("Failed to mark as no-show");
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-blue-100 text-blue-800 border-blue-200",
      confirmed: "bg-green-100 text-green-800 border-green-200",
      completed: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      rescheduled: "bg-purple-100 text-purple-800 border-purple-200",
      no_show: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPriorityColor = (priority?: string) => {
    const colors = {
      urgent: "text-red-600",
      high: "text-orange-600",
      medium: "text-yellow-600",
      low: "text-green-600"
    };
    return colors[priority as keyof typeof colors] || "text-gray-600";
  };

  const filteredAppointments = staffAppointments?.filter(appointment => {
    const matchesSearch = searchTerm === "" || 
      appointment.patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  if (!convexUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Appointments</h1>
          <p className="text-slate-600 mt-1">Manage your patient appointments</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, email, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AppointmentStatus | "all")}
              className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 appearance-none bg-white min-w-[160px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 min-w-[160px]"
            />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
            <Calendar size={48} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No appointments found</h3>
            <p className="text-slate-500">
              {selectedStatus !== "all" || searchTerm || selectedDate
                ? "Try adjusting your filters to see more appointments."
                : "You don't have any appointments yet."}
            </p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div key={appointment._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Appointment Info */}
                <div className="flex-1 space-y-3">
                  {/* Patient and Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </h3>
                        <p className="text-sm text-slate-500">{appointment.patient.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      {appointment.priority && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(appointment.priority)}`}>
                          {appointment.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={16} />
                      <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock size={16} />
                      <span>
                        {new Date(appointment.appointmentDate).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })} ({appointment.duration} min)
                      </span>
                    </div>
                    {appointment.appointmentType && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Eye size={16} />
                        <span className="capitalize">{appointment.appointmentType.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  {appointment.reason && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">Reason: </span>
                        {appointment.reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap lg:flex-col gap-2 lg:min-w-[120px]">
                  {appointment.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(appointment._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleCancel(appointment._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <XCircle size={16} />
                        Cancel
                      </button>
                    </>
                  )}
                  
                  {(appointment.status === "approved" || appointment.status === "confirmed") && (
                    <>
                      <button
                        onClick={() => handleComplete(appointment._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <CheckCircle size={16} />
                        Complete
                      </button>
                      <button
                        onClick={() => handleNoShow(appointment._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <AlertTriangle size={16} />
                        No Show
                      </button>
                      <button
                        onClick={() => handleCancel(appointment._id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <XCircle size={16} />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {filteredAppointments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {filteredAppointments.filter(a => a.status === "pending").length}
              </div>
              <div className="text-sm text-slate-500">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {filteredAppointments.filter(a => a.status === "approved" || a.status === "confirmed").length}
              </div>
              <div className="text-sm text-slate-500">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredAppointments.filter(a => a.status === "completed").length}
              </div>
              <div className="text-sm text-slate-500">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {filteredAppointments.filter(a => a.status === "cancelled" || a.status === "no_show").length}
              </div>
              <div className="text-sm text-slate-500">Cancelled/No Show</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
