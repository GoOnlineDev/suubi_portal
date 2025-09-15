"use client";
import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Calendar, Clock, Repeat, PlusCircle, Moon, Sun, Sunset } from "lucide-react";

type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

const daysOfWeek: DayOfWeek[] = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

// Hospital shift times for quick selection
const commonShifts = [
  { name: "Day Shift", start: "07:00", end: "19:00", icon: Sun },
  { name: "Night Shift", start: "19:00", end: "07:00", icon: Moon },
  { name: "Morning", start: "06:00", end: "14:00", icon: Sun },
  { name: "Evening", start: "14:00", end: "22:00", icon: Sunset },
  { name: "Night", start: "22:00", end: "06:00", icon: Moon },
];

// Generate time options for 24-hour hospital schedule
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

export default function AvailableTimeForm() {
  const { user } = useUser();
  const addAvailableTime = useMutation(api.staffProfiles.addAvailableTime);
  const createOrGetUser = useMutation(api.users.createOrGetUser);

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("Monday");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState<boolean>(true);
  const [oneOffDate, setOneOffDate] = useState<string>(""); // YYYY-MM-DD
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleQuickShiftSelect = (shift: typeof commonShifts[0]) => {
    setStartTime(shift.start);
    setEndTime(shift.end);
  };

  const validateTimeRange = (start: string, end: string): boolean => {
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    
    // Allow overnight shifts (end time can be less than start time)
    if (endMinutes <= startMinutes) {
      // This is an overnight shift, which is valid for hospitals
      return true;
    }
    
    return endMinutes > startMinutes;
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user?.id) {
      alert("User not logged in.");
      setIsSubmitting(false);
      return;
    }

    // Validate time inputs
    if (!startTime || !endTime) {
      alert("Please select both start and end times.");
      setIsSubmitting(false);
      return;
    }

    if (!validateTimeRange(startTime, endTime)) {
      alert("Please select valid start and end times.");
      setIsSubmitting(false);
      return;
    }

    const convexUserId = await createOrGetUser({
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      imageUrl: user.imageUrl || undefined,
    });
    if (!convexUserId) {
      alert("Failed to get Convex user ID.");
      setIsSubmitting(false);
      return;
    }

    let dateTimestamp: number | undefined = undefined;
    if (!isRecurring && oneOffDate) {
      dateTimestamp = new Date(oneOffDate).getTime();
      if (isNaN(dateTimestamp)) {
        alert("Invalid date format.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await addAvailableTime({
        staffUserId: convexUserId,
        dayOfWeek,
        startTime,
        endTime,
        isRecurring,
        date: dateTimestamp,
      });
      alert("Available time added successfully!");
      // Reset form
      setStartTime("");
      setEndTime("");
      setOneOffDate("");
    } catch (error) {
      console.error("Error adding available time:", error);
      alert("Failed to add available time.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 md:p-12 mt-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6 text-center">
        Add Available Time Slot
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-group">
          <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
            <Repeat size={16} className="mr-2 text-emerald-600" />
            Type
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-emerald-600 focus:ring-emerald-500"
                name="timeType"
                checked={isRecurring}
                onChange={() => setIsRecurring(true)}
              />
              <span className="ml-2 text-slate-700">Recurring (Weekly)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-emerald-600 focus:ring-emerald-500"
                name="timeType"
                checked={!isRecurring}
                onChange={() => setIsRecurring(false)}
              />
              <span className="ml-2 text-slate-700">One-off Date</span>
            </label>
          </div>
        </div>

        {isRecurring ? (
          <div className="form-group">
            <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
              <Calendar size={16} className="mr-2 text-emerald-600" />
              Day of Week
            </label>
            <select
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              required
            >
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="form-group">
            <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
              <Calendar size={16} className="mr-2 text-emerald-600" />
              Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400"
              value={oneOffDate}
              onChange={(e) => setOneOffDate(e.target.value)}
              required
            />
          </div>
        )}

        {/* Quick Shift Selection */}
        <div className="form-group">
          <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
            <Clock size={16} className="mr-2 text-emerald-600" />
            Quick Shift Selection
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {commonShifts.map((shift) => {
              const Icon = shift.icon;
              return (
                <button
                  key={shift.name}
                  type="button"
                  onClick={() => handleQuickShiftSelect(shift)}
                  className="group flex flex-col items-center p-3 bg-white/50 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 hover:scale-105"
                >
                  <Icon size={20} className="text-slate-600 group-hover:text-emerald-600 mb-1" />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-emerald-700 mb-1">
                    {shift.name}
                  </span>
                  <span className="text-xs text-slate-500 group-hover:text-emerald-600">
                    {shift.start} - {shift.end}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
              <Clock size={16} className="mr-2 text-emerald-600" />
              Start Time (24-hour format)
            </label>
            <select
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            >
              <option value="">Select start time</option>
              {timeOptions.map((time) => (
                <option key={`start-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
              <Clock size={16} className="mr-2 text-emerald-600" />
              End Time (24-hour format)
            </label>
            <select
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            >
              <option value="">Select end time</option>
              {timeOptions.map((time) => (
                <option key={`end-${time}`} value={time}>
                  {time} {time < startTime && startTime ? "(next day)" : ""}
                </option>
              ))}
            </select>
            {startTime && endTime && endTime <= startTime && (
              <p className="text-xs text-amber-600 mt-1 flex items-center">
                <Moon size={12} className="mr-1" />
                This is an overnight shift ending the next day
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full group inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Adding Time...
            </>
          ) : (
            <>
              <PlusCircle size={20} className="mr-2" />
              Add Time Slot
            </>
          )}
        </button>
      </form>
    </div>
  );
}
