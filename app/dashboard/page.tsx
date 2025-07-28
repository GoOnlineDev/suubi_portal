"use client";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api"; // Re-importing api
import { Doc, Id } from "@/convex/_generated/dataModel"; // Import Id type
import { useRouter } from "next/navigation";

import AvailableTimeForm from "@/app/components/AvailableTimeForm";
import AvailableTimeList from "@/app/components/AvailableTimeList";
import { Stethoscope, Heart, Award, Calendar, Globe, User, DollarSign, Check, Star } from "lucide-react";

export default function DashboardPage() {
  const { user: clerkUser } = useUser();

  // Fetch user data from Convex using the api object with the expected nested structure
  // This call is unconditional and at the top level.
  const convexUser = useQuery(api.users.getCurrentUser);

  // Fetch doctor or nurse profile based on Convex user ID (_id)
  // These calls are now unconditional. If convexUser or convexUser._id is undefined,
  // useQuery will handle it gracefully, likely returning undefined.
  const doctorProfile = useQuery(
    api.doctors.getDoctorByUserId,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );
  const nurseProfile = useQuery(
    api.nurses.getNurseByUserId,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const router = useRouter();

  // Determine the user's role and profile data
  const userRole = convexUser?.role;

  // State for profile image (if needed for display)
  const [profileImage, setProfileImage] = useState<string>("");

  useEffect(() => {
    if (userRole === "doctor" && doctorProfile?.profileImage) {
      setProfileImage(doctorProfile.profileImage);
    } else if (userRole === "nurse" && nurseProfile?.profileImage) {
      setProfileImage(nurseProfile.profileImage);
    } else if (clerkUser?.imageUrl) {
      setProfileImage(clerkUser.imageUrl);
    }
  }, [userRole, doctorProfile, nurseProfile, clerkUser]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

        {userRole === "doctor" && doctorProfile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Profile Card */}
            <div className="lg:col-span-1 bg-white rounded-3xl shadow-lg border border-slate-200 p-6 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-emerald-500 shadow-md">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Stethoscope size={48} className="text-white" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">{convexUser?.firstName} {convexUser?.lastName}</h2>
              <p className="text-emerald-600 font-semibold mb-3">{doctorProfile.specialty}</p>
              <div className="flex items-center text-slate-600 mb-2">
                <Award size={16} className="mr-2" />
                <span className="text-sm">
                  {doctorProfile.qualifications?.join(", ")}
                </span>
              </div>
              <div className="flex items-center text-slate-600 mb-2">
                <Calendar size={16} className="mr-2" />
                <span className="text-sm">{doctorProfile.experience} Years of Experience</span>
              </div>
              <div className="flex items-center text-slate-600 mb-2">
                <Globe size={16} className="mr-2" />
                <span className="text-sm">{doctorProfile.languages?.join(", ")}</span>
              </div>
              {doctorProfile.consultationFee !== undefined && doctorProfile.consultationFee !== null && (
                <div className="flex items-center text-slate-600 mb-2">
                  <DollarSign size={16} className="mr-2" />
                  <span className="text-sm">Consultation Fee: UGX {doctorProfile.consultationFee}</span>
                </div>
              )}
              <div className="flex items-center text-slate-600 mt-4">
                <StarRating rating={doctorProfile.rating ?? 0} totalReviews={doctorProfile.totalReviews ?? 0} />
              </div>
            </div>

            {/* Bio and Availability */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 mb-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-4">About Me</h3>
                <p className="text-slate-600 leading-relaxed">{doctorProfile.bio ?? "No bio available."}</p>
              </div>
              <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-2xl font-bold text-slate-800 mb-4">My Availability</h3>
                <AvailableTimeForm />
                <AvailableTimeList />
              </div>
            </div>
          </div>
        )}

        {userRole === "nurse" && nurseProfile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Profile Card */}
            <div className="lg:col-span-1 bg-white rounded-3xl shadow-lg border border-slate-200 p-6 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-emerald-500 shadow-md">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Heart size={48} className="text-white" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">{convexUser?.firstName} {convexUser?.lastName}</h2>
              <p className="text-emerald-600 font-semibold mb-3">Nurse</p> {/* Assuming no specific specialty for nurses */}
              <div className="flex items-center text-slate-600 mb-2">
                <Award size={16} className="mr-2" />
                <span className="text-sm">
                  {nurseProfile.qualifications?.join(", ")}
                </span>
              </div>
              <div className="flex items-center text-slate-600 mb-2">
                <Calendar size={16} className="mr-2" />
                <span className="text-sm">{nurseProfile.experience} Years of Experience</span>
              </div>
              <div className="flex items-center text-slate-600 mb-2">
                <Globe size={16} className="mr-2" />
                <span className="text-sm">{nurseProfile.languages?.join(", ")}</span>
              </div>
              <div className="flex items-center text-slate-600 mt-4">
                <StarRating rating={nurseProfile.rating ?? 0} totalReviews={nurseProfile.totalReviews ?? 0} />
              </div>
            </div>

            {/* Bio and Availability */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 mb-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-4">About Me</h3>
                <p className="text-slate-600 leading-relaxed">{nurseProfile.bio ?? "No bio available."}</p>
              </div>
              <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-2xl font-bold text-slate-800 mb-4">My Availability</h3>
                <AvailableTimeForm />
                <AvailableTimeList />
              </div>
            </div>
          </div>
        )}

        {userRole === "patient" && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Patient Dashboard</h2>
            <p className="text-slate-600 mb-8">
              As a patient, you can manage your appointments and view your health records here.
            </p>
            {/* Placeholder for patient-specific features */}
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
        )}

        {!userRole && !convexUser && (
          <div className="text-center">
            <p className="text-xl text-slate-600">Loading user profile...</p>
          </div>
        )}
      </div>
  );
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
