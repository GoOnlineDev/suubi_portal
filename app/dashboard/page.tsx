"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

import AvailableTimeList from "@/app/components/AvailableTimeList";
import ProfileImageUpload from "@/app/components/ProfileImageUpload";
import { 
  Stethoscope, 
  Heart, 
  Award, 
  Calendar, 
  Globe, 
  User, 
  DollarSign, 
  Check, 
  Star, 
  Edit3, 
  Users,
  Building2,
  Wrench,
  GraduationCap,
  Plus,
  AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  const { user: clerkUser } = useUser();
  const router = useRouter();

  // Fetch user data from Convex
  const convexUser = useQuery(api.users.getCurrentUser, clerkUser?.id ? { clerkId: clerkUser.id } : "skip");
  
  // Check user's profile status
  const userProfileStatus = useQuery(
    api.staffProfiles.getUserProfileStatus,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );
  
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
  const [profileImage, setProfileImage] = useState<string>("");

  useEffect(() => {
    if (staffProfile?.profileImage) {
      setProfileImage(staffProfile.profileImage);
    } else if (clerkUser?.imageUrl) {
      setProfileImage(clerkUser.imageUrl);
    }
  }, [staffProfile, clerkUser]);

  // Redirect logic for users who haven't completed their profiles
  useEffect(() => {
    if (userProfileStatus && convexUser) {
      // If user is a staff member but hasn't completed their profile, redirect to main page
      if (userProfileStatus.isStaff && !userProfileStatus.hasProfile) {
        router.push("/");
      }
    }
  }, [userProfileStatus, convexUser, router]);

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

  // Show loading state while checking profile status
  if (convexUser && userProfileStatus === undefined) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-xl text-slate-600">Loading your profile...</p>
      </div>
    );
  }

  // Show redirect message for users who haven't completed their profiles
  if (userProfileStatus && userProfileStatus.isStaff && !userProfileStatus.hasProfile) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-xl text-slate-600">Redirecting to complete your profile...</p>
      </div>
    );
  }

  // Show profile creation prompt for staff without profiles
  if (userRole && userRole !== "patient" && userRole !== "admin" && !staffProfile) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center py-8 sm:py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-lg">
            {getRoleIcon(userRole)}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">Complete Your Profile</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto px-4">
            Welcome to Suubi Medical Center! Please complete your professional profile to get started.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Plus size={20} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  // Show patient dashboard
  if (userRole === "patient") {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center py-8 sm:py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">Patient Dashboard</h2>
          <p className="text-slate-600 mb-8 px-4">
            As a patient, you can manage your appointments and view your health records here.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => alert("Feature not yet implemented!")}
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              View Appointments
              <Check size={20} className="ml-2 group-hover:scale-110 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show staff dashboard with profile
  if (staffProfile) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-4 border-4 border-emerald-500 shadow-md">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  {getRoleIcon(userRole || "")}
                </div>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
              {convexUser?.firstName} {convexUser?.lastName}
            </h2>
            <p className="text-emerald-600 font-semibold mb-3 text-sm sm:text-base">
              {staffProfile.subRole ? 
                staffProfile.subRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                getRoleTitle(userRole || "")
              }
            </p>
            {staffProfile.specialty && (
              <p className="text-slate-600 text-sm mb-2">{staffProfile.specialty}</p>
            )}
            <div className="flex items-center text-slate-600 mb-2 text-sm">
              <Award size={16} className="mr-2" />
              <span className="text-sm">
                {staffProfile.qualifications?.join(", ")}
              </span>
            </div>
            <div className="flex items-center text-slate-600 mb-2 text-sm">
              <Calendar size={16} className="mr-2" />
              <span className="text-sm">{staffProfile.experience} Years of Experience</span>
            </div>
            <div className="flex items-center text-slate-600 mb-2 text-sm">
              <Globe size={16} className="mr-2" />
              <span className="text-sm">{staffProfile.languages?.join(", ")}</span>
            </div>
            {staffProfile.consultationFee && (
              <div className="flex items-center text-slate-600 mb-2 text-sm">
                <DollarSign size={16} className="mr-2" />
                <span className="text-sm">Consultation Fee: UGX {staffProfile.consultationFee}</span>
              </div>
            )}
            <div className="flex items-center text-slate-600 mt-4">
              <StarRating rating={staffProfile.rating ?? 0} totalReviews={staffProfile.totalReviews ?? 0} />
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 group inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-all duration-200"
            >
              <Edit3 size={16} className="mr-2 group-hover:scale-110 transition-transform duration-200" />
              Edit Profile
            </button>
          </div>

          {/* Bio and Availability */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">About Me</h3>
              <p className="text-slate-600 leading-relaxed">
                {staffProfile.bio || "No bio available."}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">My Availability</h3>
              <AvailableTimeList />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show profile editing form
  if (isEditing) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-4 sm:p-8 md:p-12 m-4 sm:m-6 lg:m-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              {staffProfile ? "Edit" : "Create"} Your {getRoleTitle(userRole || "")} Profile
            </h1>
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
                    <Check size={20} className="ml-2 group-hover:scale-110 transition-transform duration-300" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Helper component for Star Rating
const StarRating = ({ rating, totalReviews }: { rating: number; totalReviews: number }) => {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < rating) {
      stars.push(<Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />);
    } else {
      stars.push(<Star key={i} className="w-5 h-5 text-gray-300" />);
    }
  }
  return (
    <div className="flex items-center">
      <div className="flex mr-2">{stars}</div>
      <span className="text-sm text-slate-600">({totalReviews} reviews)</span>
    </div>
  );
};
