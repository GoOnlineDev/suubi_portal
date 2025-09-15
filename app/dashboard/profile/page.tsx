"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

import ProfileImageUpload from "@/app/components/ProfileImageUpload";
import { 
  User, 
  Award, 
  Calendar, 
  Globe, 
  DollarSign, 
  Edit3, 
  Save, 
  X,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  Heart,
  Users,
  Building2,
  Wrench,
  GraduationCap
} from "lucide-react";

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const router = useRouter();

  // Fetch user data from Convex
  const convexUser = useQuery(api.users.getCurrentUser, clerkUser?.id ? { clerkId: clerkUser.id } : "skip");
  
  // Fetch staff profile using the new unified system
  const staffProfile = useQuery(
    api.staffProfiles.getStaffProfileByUserId,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Mutations
  const updateStaffProfile = useMutation(api.staffProfiles.updateStaffProfile);
  const createStaffProfile = useMutation(api.staffProfiles.createStaffProfile);

  // State for profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    subRole: "",
    specialty: "",
    licenseNumber: "",
    qualifications: [] as string[],
    experience: 0,
    bio: "",
    languages: [] as string[],
    consultationFee: undefined as number | undefined,
    profileImage: "",
  });

  // Initialize profile data when staff profile loads
  useEffect(() => {
    if (staffProfile) {
      setProfileData({
        subRole: staffProfile.subRole || "",
        specialty: staffProfile.specialty || "",
        licenseNumber: staffProfile.licenseNumber || "",
        qualifications: staffProfile.qualifications || [],
        experience: staffProfile.experience || 0,
        bio: staffProfile.bio || "",
        languages: staffProfile.languages || [],
        consultationFee: staffProfile.consultationFee,
        profileImage: staffProfile.profileImage || "",
      });
    }
  }, [staffProfile]);

  const userRole = convexUser?.role;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "doctor":
        return <Stethoscope size={48} className="text-white" />;
      case "nurse":
        return <Heart size={48} className="text-white" />;
      case "allied_health":
        return <Users size={48} className="text-white" />;
      case "support_staff":
        return <User size={48} className="text-white" />;
      case "administrative_staff":
        return <Building2 size={48} className="text-white" />;
      case "technical_staff":
        return <Wrench size={48} className="text-white" />;
      case "training_research_staff":
        return <GraduationCap size={48} className="text-white" />;
      default:
        return <User size={48} className="text-white" />;
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case "doctor":
        return "Doctor";
      case "nurse":
        return "Nurse";
      case "allied_health":
        return "Allied Health Professional";
      case "support_staff":
        return "Support Staff";
      case "administrative_staff":
        return "Administrative Staff";
      case "technical_staff":
        return "Technical Staff";
      case "training_research_staff":
        return "Training & Research Staff";
      default:
        return role;
    }
  };

  const handleQualificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      qualifications: e.target.value.split(",").map((q: string) => q.trim())
    });
  };

  const handleLanguagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      languages: e.target.value.split(",").map((l: string) => l.trim())
    });
  };

  const handleSaveProfile = async () => {
    if (!convexUser?._id) return;

    setIsSubmitting(true);
    try {
      if (staffProfile) {
        // Update existing profile
        await updateStaffProfile({
          userId: convexUser._id,
          subRole: profileData.subRole || undefined,
          specialty: profileData.specialty || undefined,
          licenseNumber: profileData.licenseNumber || undefined,
          qualifications: profileData.qualifications.length > 0 ? profileData.qualifications : undefined,
          experience: profileData.experience || undefined,
          bio: profileData.bio || undefined,
          languages: profileData.languages.length > 0 ? profileData.languages : undefined,
          consultationFee: profileData.consultationFee,
          profileImage: profileData.profileImage || undefined,
        });
      } else {
        // Create new profile
        await createStaffProfile({
          userId: convexUser._id,
          role: userRole as any,
          subRole: profileData.subRole || undefined,
          specialty: profileData.specialty || undefined,
          licenseNumber: profileData.licenseNumber || undefined,
          qualifications: profileData.qualifications.length > 0 ? profileData.qualifications : undefined,
          experience: profileData.experience || undefined,
          bio: profileData.bio || undefined,
          languages: profileData.languages.length > 0 ? profileData.languages : undefined,
          consultationFee: profileData.consultationFee,
          profileImage: profileData.profileImage || undefined,
          verified: false,
        });
      }
      
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (!convexUser) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-xl text-slate-600">Loading user profile...</p>
      </div>
    );
  }

  // Show patient message
  if ((userRole as string) === "patient") {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-lg">
          <User size={32} className="text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">Patient Profile</h2>
        <p className="text-slate-600 mb-8 px-4">
          Patient profile management features are coming soon.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Profile Management</h1>
            <p className="text-slate-600">Manage your professional profile and information</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mt-4 sm:mt-0"
            >
              <Edit3 size={20} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Status */}
        {staffProfile && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center mb-4">
              <CheckCircle size={20} className="text-emerald-600 mr-2" />
              <span className="text-emerald-600 font-semibold">Profile Complete</span>
            </div>
            <p className="text-slate-600 text-sm">
              Your profile is complete and visible to patients and colleagues.
            </p>
          </div>
        )}

        {!staffProfile && userRole && (userRole as string) !== "patient" && (
          <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center mb-4">
              <AlertCircle size={20} className="text-amber-600 mr-2" />
              <span className="text-amber-600 font-semibold">Profile Incomplete</span>
            </div>
            <p className="text-amber-700 text-sm">
              Please complete your professional profile to start using the platform.
            </p>
          </div>
        )}

        {/* Profile Form */}
        {isEditing ? (
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-4 sm:p-8 md:p-12">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                {staffProfile ? "Edit" : "Create"} Your {getRoleTitle(userRole || "")} Profile
              </h2>
              <p className="text-slate-600">Complete your professional information</p>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {(userRole === "doctor" || userRole === "allied_health") && (
                  <div className="form-group">
                    <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                      <Stethoscope size={16} className="mr-2 text-emerald-600" />
                      Specialty
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400"
                      value={profileData.specialty}
                      onChange={(e) => setProfileData({...profileData, specialty: e.target.value})}
                      placeholder="e.g., Cardiology, Pediatrics"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                    <Award size={16} className="mr-2 text-emerald-600" />
                    License Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400"
                    value={profileData.licenseNumber}
                    onChange={(e) => setProfileData({...profileData, licenseNumber: e.target.value})}
                    placeholder="Enter your license number"
                  />
                </div>

                <div className="form-group">
                  <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                    <Award size={16} className="mr-2 text-emerald-600" />
                    Qualifications
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400"
                    value={profileData.qualifications.join(", ")}
                    onChange={handleQualificationsChange}
                    placeholder="e.g., MD, PhD, RN (comma-separated)"
                  />
                </div>

                <div className="form-group">
                  <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                    <Calendar size={16} className="mr-2 text-emerald-600" />
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400"
                    value={profileData.experience}
                    onChange={(e) => setProfileData({...profileData, experience: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                    <Globe size={16} className="mr-2 text-emerald-600" />
                    Languages
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400"
                    value={profileData.languages.join(", ")}
                    onChange={handleLanguagesChange}
                    placeholder="e.g., English, Luganda, Swahili"
                  />
                </div>

                {(userRole === "doctor" || userRole === "allied_health") && (
                  <div className="form-group">
                    <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                      <DollarSign size={16} className="mr-2 text-emerald-600" />
                      Consultation Fee (UGX)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400"
                      value={profileData.consultationFee || ""}
                      onChange={(e) => 
                        setProfileData({...profileData, consultationFee: e.target.value ? parseFloat(e.target.value) : undefined})
                      }
                      placeholder="Enter consultation fee"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                  <User size={16} className="mr-2 text-emerald-600" />
                  Professional Biography
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400 resize-none"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  placeholder="Tell us about your professional background, philosophy, and what drives your passion for healthcare..."
                />
              </div>

              <ProfileImageUpload
                profileImage={profileData.profileImage}
                setProfileImage={(url) => setProfileData({...profileData, profileImage: url})}
              />

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 group inline-flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSubmitting}
                  className="flex-1 group inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Profile
                      <Save size={20} className="ml-2 group-hover:scale-110 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Show current profile information
          staffProfile && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Name</label>
                      <p className="text-slate-800">{convexUser?.firstName} {convexUser?.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Email</label>
                      <p className="text-slate-800">{convexUser?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Role</label>
                      <p className="text-slate-800">{getRoleTitle(userRole || "")}</p>
                    </div>
                    {staffProfile.subRole && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Sub-Role</label>
                        <p className="text-slate-800">{staffProfile.subRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Professional Information</h3>
                  <div className="space-y-3">
                    {staffProfile.specialty && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Specialty</label>
                        <p className="text-slate-800">{staffProfile.specialty}</p>
                      </div>
                    )}
                    {staffProfile.licenseNumber && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">License Number</label>
                        <p className="text-slate-800">{staffProfile.licenseNumber}</p>
                      </div>
                    )}
                    {staffProfile.qualifications && staffProfile.qualifications.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Qualifications</label>
                        <p className="text-slate-800">{staffProfile.qualifications.join(", ")}</p>
                      </div>
                    )}
                    {staffProfile.experience && (
                      <div>
                        <label className="text-sm font-medium text-slate-600">Years of Experience</label>
                        <p className="text-slate-800">{staffProfile.experience} years</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
} 