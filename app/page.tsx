"use client";
import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import ProfileImageUpload from "@/app/components/ProfileImageUpload";
import { useRouter } from "next/navigation";
import {
  User,
  Stethoscope,
  Heart,
  ArrowRight,
  ArrowLeft,
  Check,
  Globe,
  Award,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Wrench,
  GraduationCap
} from "lucide-react";
import Image from "next/image";

type MainRole = "doctor" | "nurse" | "allied_health" | "support_staff" | "administrative_staff" | "technical_staff" | "training_research_staff";

export default function Home() {
  const { user } = useUser();
  const createStaffProfile = useMutation(api.staffProfiles.createStaffProfile);
  const createOrGetUser = useMutation(api.users.createOrGetUser);
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [mainRole, setMainRole] = useState<MainRole | null>(null);
  const [subRole, setSubRole] = useState<string>("");
  const [licenseNumber, setLicenseNumber] = useState<string>("");
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [experience, setExperience] = useState<number>(0);
  const [bio, setBio] = useState<string>("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string>("");
  const [specialty, setSpecialty] = useState<string>("");
  const [consultationFee, setConsultationFee] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch user data from Convex
  const convexUser = useQuery(api.users.getCurrentUser);
  
  // Check user's profile status
  const userProfileStatus = useQuery(
    api.staffProfiles.getUserProfileStatus,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Move the query after mainRole is declared
  const getAvailableSubRoles = useQuery(api.staffProfiles.getAvailableSubRoles, mainRole ? { role: mainRole } : "skip");

  useEffect(() => {
    if (user) {
      createOrGetUser();
    }
  }, [user, createOrGetUser]);

  // Redirect logic for users who have completed their profiles
  useEffect(() => {
    if (userProfileStatus && convexUser) {
      // If user is a staff member and has completed their profile, redirect to dashboard
      if (userProfileStatus.isStaff && userProfileStatus.hasProfile) {
        router.push("/dashboard");
      }
      // If user is a patient, redirect to dashboard (patients don't need profiles)
      else if (userProfileStatus.role === "patient") {
        router.push("/dashboard");
      }
    }
  }, [userProfileStatus, convexUser, router]);

  const handleQualificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQualifications(e.target.value.split(",").map((q: string) => q.trim()));
  };

  const handleLanguagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLanguages(e.target.value.split(",").map((l: string) => l.trim()));
  };

  const handleNextStep = () => {
    if (mainRole) {
      setStep(2);
    } else {
      alert("Please select a role.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user?.id) {
      alert("User not logged in.");
      setIsSubmitting(false);
      return;
    }

    if (!mainRole) {
      alert("Please select a role.");
      setIsSubmitting(false);
      return;
    }

    const convexUserId = await createOrGetUser();
    if (!convexUserId) {
      alert("Failed to get Convex user ID.");
      setIsSubmitting(false);
      return;
    }

    try {
      await createStaffProfile({
        userId: convexUserId,
        role: mainRole,
        subRole: subRole || undefined,
        specialty: specialty || undefined,
        licenseNumber: licenseNumber || undefined,
        qualifications: qualifications.length > 0 ? qualifications : undefined,
        experience: experience || undefined,
        bio: bio || undefined,
        languages: languages.length > 0 ? languages : undefined,
        consultationFee: consultationFee || undefined,
        profileImage: profileImage || undefined,
        verified: false,
      });

      alert(`${mainRole.charAt(0).toUpperCase() + mainRole.slice(1).replace('_', ' ')} profile created successfully!`);

      // Reset form
      setLicenseNumber("");
      setQualifications([]);
      setExperience(0);
      setBio("");
      setLanguages([]);
      setProfileImage("");
      setSpecialty("");
      setConsultationFee(undefined);
      setMainRole(null);
      setSubRole("");
      setStep(1);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Failed to create profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role: MainRole) => {
    switch (role) {
      case "doctor":
        return <Stethoscope size={24} />;
      case "nurse":
        return <Heart size={24} />;
      case "allied_health":
        return <Users size={24} />;
      case "support_staff":
        return <User size={24} />;
      case "administrative_staff":
        return <Building2 size={24} />;
      case "technical_staff":
        return <Wrench size={24} />;
      case "training_research_staff":
        return <GraduationCap size={24} />;
      default:
        return <User size={24} />;
    }
  };

  const getRoleTitle = (role: MainRole) => {
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

  const getRoleDescription = (role: MainRole) => {
    switch (role) {
      case "doctor":
        return "Medical professional with advanced training";
      case "nurse":
        return "Compassionate care specialist";
      case "allied_health":
        return "Specialized healthcare professionals";
      case "support_staff":
        return "Essential support and auxiliary staff";
      case "administrative_staff":
        return "Hospital administration and management";
      case "technical_staff":
        return "Technical and maintenance specialists";
      case "training_research_staff":
        return "Education, research and program staff";
      default:
        return "";
    }
  };

  const availableSubRoles = getAvailableSubRoles || [];

  // Show loading state while checking profile status
  if (convexUser && userProfileStatus === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-xl text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Don't show the profile creation form if user has already completed their profile
  if (userProfileStatus && userProfileStatus.isStaff && userProfileStatus.hasProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-xl text-slate-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Authenticated>
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Image src="/logo.png" alt="Suubi Medical Center" width={32} height={32} />
              </div>
              <span className="text-xl font-bold text-black">
                Suubi Medical Center
              </span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 md:p-12 text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-lg">
                    <Stethoscope size={32} className="text-white" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
                    Choose Your Role
                  </h1>
                  <p className="text-xl text-slate-600 max-w-md mx-auto leading-relaxed">
                    Join our healthcare platform and start making a difference in patients' lives
                  </p>
                </div>

                {/* Changed grid-cols-1 to grid-cols-2 for mobile, md:grid-cols-2, lg:grid-cols-3 */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
                  {(["doctor", "nurse", "allied_health", "support_staff", "administrative_staff", "technical_staff", "training_research_staff"] as MainRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => setMainRole(role)}
                      className={`group relative overflow-hidden p-6 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                        mainRole === role
                          ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-2xl"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xl"
                      }`}
                    >
                      <div className="relative z-10">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-all duration-300 ${
                          mainRole === role
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg"
                            : "bg-slate-100 group-hover:bg-emerald-100"
                        }`}>
                          <div className={mainRole === role ? "text-white" : "text-slate-600 group-hover:text-emerald-600"}>
                            {getRoleIcon(role)}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">{getRoleTitle(role)}</h3>
                        <p className="text-xs text-slate-600">{getRoleDescription(role)}</p>
                      </div>
                      {mainRole === role && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextStep}
                  disabled={!mainRole}
                  className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Continue
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && mainRole && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
                <div className="text-center mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                    Create Your {getRoleTitle(mainRole)} Profile
                  </h1>
                  <p className="text-slate-600">Complete your professional information to get started</p>
                </div>

                <div className="space-y-8">
                  {availableSubRoles.length > 0 && (
                    <div className="form-group">
                      <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                        <Award size={16} className="mr-2 text-emerald-600" />
                        Specific Role
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                        value={subRole}
                        onChange={(e) => setSubRole(e.target.value)}
                      >
                        <option value="">Select a specific role</option>
                        {availableSubRoles.map((subRoleOption: string) => (
                          <option key={subRoleOption} value={subRoleOption}>
                            {subRoleOption.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(mainRole === "doctor" || mainRole === "allied_health") && (
                      <div className="form-group">
                        <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                          <Stethoscope size={16} className="mr-2 text-emerald-600" />
                          Specialty
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
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
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
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
                        value={qualifications.join(", ")}
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
                        value={experience}
                        onChange={(e) => setExperience(parseInt(e.target.value) || 0)}
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
                        value={languages.join(", ")}
                        onChange={handleLanguagesChange}
                        placeholder="e.g., English, Luganda, Swahili"
                      />
                    </div>

                    {(mainRole === "doctor" || mainRole === "allied_health") && (
                      <div className="form-group">
                        <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                          <DollarSign size={16} className="mr-2 text-emerald-600" />
                          Consultation Fee (UGX)
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400"
                          value={consultationFee || ""}
                          onChange={(e) => 
                            setConsultationFee(e.target.value ? parseFloat(e.target.value) : undefined)
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
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about your professional background, philosophy, and what drives your passion for healthcare..."
                    />
                  </div>

                  <ProfileImageUpload
                    profileImage={profileImage}
                    setProfileImage={setProfileImage}
                  />

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 group inline-flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all duration-300"
                    >
                      <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 group inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Creating Profile...
                        </>
                      ) : (
                        <>
                          Create Profile
                          <Check size={20} className="ml-2 group-hover:scale-110 transition-transform duration-300" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-lg">
              <Heart size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
              Welcome to Suubi
            </h1>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Join our healthcare platform and connect with patients who need your expertise
            </p>
            <SignInButton mode="modal">
              <button className="w-full group inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                Get Started
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
