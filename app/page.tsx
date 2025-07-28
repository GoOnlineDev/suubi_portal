"use client";
import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, useMutation } from "convex/react";
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
  DollarSign
} from "lucide-react";
import Image from "next/image";

type ProfileType = "doctor" | "nurse";

export default function Home() {
  const { user } = useUser();
  const createDoctor = useMutation(api.doctors.createDoctor);
  const createNurse = useMutation(api.nurses.createNurse);
  const createOrGetUser = useMutation(api.users.createOrGetUser);
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [licenseNumber, setLicenseNumber] = useState<string>("");
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [experience, setExperience] = useState<number>(0);
  const [bio, setBio] = useState<string>("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string>("");
  const [specialty, setSpecialty] = useState<string>("");
  const [consultationFee, setConsultationFee] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      createOrGetUser();
    }
  }, [user, createOrGetUser]);

  const handleQualificationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQualifications(e.target.value.split(",").map((q: string) => q.trim()));
  };

  const handleLanguagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLanguages(e.target.value.split(",").map((l: string) => l.trim()));
  };

  const handleNextStep = () => {
    if (profileType) {
      setStep(2);
    } else {
      alert("Please select a profile type.");
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

    if (!profileType) {
      alert("Please select a profile type (Doctor or Nurse).");
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
      if (profileType === "doctor") {
        await createDoctor({
          userId: convexUserId,
          specialty,
          licenseNumber,
          qualifications,
          experience,
          bio,
          languages,
          consultationFee,
          profileImage,
          verified: false,
        });
        alert("Doctor profile created successfully!");
      } else {
        await createNurse({
          userId: convexUserId,
          licenseNumber,
          qualifications,
          experience,
          bio,
          languages,
          profileImage,
          verified: false,
        });
        alert("Nurse profile created successfully!");
      }

      // Reset form
      setLicenseNumber("");
      setQualifications([]);
      setExperience(0);
      setBio("");
      setLanguages([]);
      setProfileImage("");
      setSpecialty("");
      setConsultationFee(undefined);
      setProfileType(null);
      setStep(1);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Failed to create profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
                  <button
                    onClick={() => setProfileType("doctor")}
                    className={`group relative overflow-hidden p-8 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                      profileType === "doctor"
                        ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-2xl"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xl"
                    }`}
                  >
                    <div className="relative z-10">
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 transition-all duration-300 ${
                        profileType === "doctor"
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg"
                          : "bg-slate-100 group-hover:bg-emerald-100"
                      }`}>
                        <Stethoscope size={24} className={profileType === "doctor" ? "text-white" : "text-slate-600 group-hover:text-emerald-600"} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Doctor</h3>
                      <p className="text-sm text-slate-600">Medical professional with advanced training</p>
                    </div>
                    {profileType === "doctor" && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setProfileType("nurse")}
                    className={`group relative overflow-hidden p-8 rounded-2xl border-2 transition-all duration-500 hover:scale-105 ${
                      profileType === "nurse"
                        ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-2xl"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xl"
                    }`}
                  >
                    <div className="relative z-10">
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 transition-all duration-300 ${
                        profileType === "nurse"
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg"
                          : "bg-slate-100 group-hover:bg-emerald-100"
                      }`}>
                        <Heart size={24} className={profileType === "nurse" ? "text-white" : "text-slate-600 group-hover:text-emerald-600"} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Nurse</h3>
                      <p className="text-sm text-slate-600">Compassionate care specialist</p>
                    </div>
                    {profileType === "nurse" && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleNextStep}
                  disabled={!profileType}
                  className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Continue
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && profileType && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
                <div className="text-center mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                    Create Your {profileType === "doctor" ? "Doctor's" : "Nurse's"} Profile
                  </h1>
                  <p className="text-slate-600">Complete your professional information to get started</p>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {profileType === "doctor" && (
                      <div className="form-group">
                        <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                          <Stethoscope size={16} className="mr-2 text-emerald-600" />
                          Medical Specialty
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400"
                          value={specialty}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpecialty(e.target.value)}
                          placeholder="e.g., Cardiology, Pediatrics"
                          required
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLicenseNumber(e.target.value)}
                        placeholder="Enter your license number"
                        required
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
                        required
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExperience(parseInt(e.target.value) || 0)}
                        min="0"
                        required
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
                        required
                      />
                    </div>

                    {profileType === "doctor" && (
                      <div className="form-group">
                        <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
                          <DollarSign size={16} className="mr-2 text-emerald-600" />
                          Consultation Fee (UGX)
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400"
                          value={consultationFee || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
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
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
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
