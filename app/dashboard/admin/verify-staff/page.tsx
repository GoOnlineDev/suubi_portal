"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Calendar,
  FileText,
  Award,
  Globe,
  DollarSign,
  ShieldCheck
} from "lucide-react";

export default function VerifyStaffPage() {
  const { user } = useUser();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current user data
  const convexUser = useQuery(api.users.getCurrentUser, user?.id ? { clerkId: user.id } : "skip");
  
  // Get unverified staff profiles (admin only)
  const unverifiedProfiles = useQuery(
    api.staffProfiles.getUnverifiedStaffProfiles,
    convexUser?._id ? { adminUserId: convexUser._id } : "skip"
  );

  // Get verification statistics
  const verificationStats = useQuery(
    api.staffProfiles.getVerificationStats,
    convexUser?._id ? { adminUserId: convexUser._id } : "skip"
  );

  // Mutation to verify staff
  const verifyStaffProfile = useMutation(api.staffProfiles.verifyStaffProfile);

  const handleVerify = async (staffProfileId: string, verified: boolean) => {
    if (!convexUser?._id) return;
    
    setIsSubmitting(true);
    try {
      await verifyStaffProfile({
        staffProfileId: staffProfileId as any,
        adminUserId: convexUser._id,
        verified,
      });
      setSelectedProfile(null);
      alert(verified ? "Staff profile verified successfully!" : "Staff profile unverified.");
    } catch (error) {
      console.error("Error verifying staff profile:", error);
      alert("Failed to verify staff profile: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "doctor":
        return <User className="h-5 w-5 text-blue-600" />;
      case "nurse":
        return <User className="h-5 w-5 text-green-600" />;
      case "allied_health":
        return <Award className="h-5 w-5 text-purple-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Staff Profiles</h1>
        <p className="text-gray-600">Review and verify staff member profiles</p>
      </div>

      {/* Statistics Cards */}
      {verificationStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <ShieldCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{verificationStats.verified}</p>
                <p className="text-gray-600">Verified</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{verificationStats.unverified}</p>
                <p className="text-gray-600">Unverified</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{verificationStats.total}</p>
                <p className="text-gray-600">Total Staff</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unverified Profiles List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Unverified Staff Profiles</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {unverifiedProfiles?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium">All staff profiles verified</p>
              <p className="text-sm">There are no pending staff profiles to review.</p>
            </div>
          ) : (
            unverifiedProfiles?.map((item) => (
              <div key={item.staffProfile._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getRoleIcon(item.staffProfile.role)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.user.firstName} {item.user.lastName}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.staffProfile.role.replace('_', ' ')}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Unverified
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{item.user.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created {new Date(item.staffProfile.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {item.staffProfile.subRole && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Sub-role:</strong> {item.staffProfile.subRole}
                        </p>
                      )}

                      {item.staffProfile.specialty && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Specialty:</strong> {item.staffProfile.specialty}
                        </p>
                      )}
                      
                      {item.staffProfile.experience !== undefined && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Experience:</strong> {item.staffProfile.experience} years
                        </p>
                      )}

                      {item.staffProfile.licenseNumber && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>License Number:</strong> {item.staffProfile.licenseNumber}
                        </p>
                      )}

                      {item.staffProfile.qualifications && item.staffProfile.qualifications.length > 0 && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Qualifications:</strong> {item.staffProfile.qualifications.join(', ')}
                        </p>
                      )}

                      {item.staffProfile.languages && item.staffProfile.languages.length > 0 && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                          <Globe className="h-4 w-4" />
                          <span><strong>Languages:</strong> {item.staffProfile.languages.join(', ')}</span>
                        </div>
                      )}

                      {item.staffProfile.bio && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Bio:</strong> {item.staffProfile.bio}
                        </p>
                      )}

                      {item.staffProfile.consultationFee && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                          <DollarSign className="h-4 w-4" />
                          <span><strong>Consultation Fee:</strong> UGX {item.staffProfile.consultationFee.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 ml-4">
                    <button
                      onClick={() => handleVerify(item.staffProfile._id, true)}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Verify</span>
                    </button>
                    <button
                      onClick={() => handleVerify(item.staffProfile._id, false)}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

