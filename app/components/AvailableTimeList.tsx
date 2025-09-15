import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Calendar, Clock, Trash2, Edit, Moon, Sun, Sunset } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

const getShiftIcon = (startTime: string, endTime: string) => {
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  
  // Determine if it's an overnight shift
  const isOvernightShift = endTime <= startTime;
  
  if (isOvernightShift) {
    return { icon: Moon, type: "Night Shift", color: "text-indigo-600" };
  } else if (startHour >= 6 && startHour < 14) {
    return { icon: Sun, type: "Day Shift", color: "text-yellow-600" };
  } else if (startHour >= 14 && startHour < 22) {
    return { icon: Sunset, type: "Evening Shift", color: "text-orange-600" };
  } else {
    return { icon: Moon, type: "Night Shift", color: "text-indigo-600" };
  }
};

const formatTimeDisplay = (startTime: string, endTime: string) => {
  const isOvernightShift = endTime <= startTime;
  if (isOvernightShift) {
    return `${startTime} - ${endTime} +1`;
  }
  return `${startTime} - ${endTime}`;
};

export default function AvailableTimeList() {
  const { user } = useUser();
  const createOrGetUser = useMutation(api.users.createOrGetUser);
  const removeAvailableTime = useMutation(api.staffProfiles.removeAvailableTime);

  const [convexUserId, setConvexUserId] = React.useState<Doc<"users">["_id"] | null>(null);

  React.useEffect(() => {
    const fetchUserId = async () => {
      if (user) {
        const id = await createOrGetUser({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          imageUrl: user.imageUrl || undefined,
        });
        setConvexUserId(id);
      }
    };
    fetchUserId();
  }, [user, createOrGetUser]);

  const availableTimes = useQuery(api.staffProfiles.getStaffAvailableTimes, 
    convexUserId ? { staffUserId: convexUserId } : "skip"
  );

  const handleDelete = async (timeId: Doc<"availableTimes">["_id"]) => {
    if (window.confirm("Are you sure you want to delete this time slot?") && convexUserId) {
      try {
        await removeAvailableTime({ 
          timeSlotId: timeId, 
          staffUserId: convexUserId 
        });
        alert("Time slot deleted successfully!");
      } catch (error) {
        console.error("Error deleting time slot:", error);
        alert("Failed to delete time slot.");
      }
    }
  };

  if (!availableTimes) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 md:p-12 mt-8 text-center text-slate-600">
        Loading available times...
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 md:p-12 mt-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6 text-center">
        Your Available Time Slots
      </h2>
      {availableTimes.length === 0 ? (
        <p className="text-center text-slate-600">No available time slots added yet.</p>
      ) : (
        <div className="space-y-4">
          {availableTimes.map((time) => {
            const shiftInfo = getShiftIcon(time.startTime, time.endTime);
            const ShiftIcon = shiftInfo.icon;
            const isOvernightShift = time.endTime <= time.startTime;
            
            return (
              <div key={time._id} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {time.isRecurring ? (
                      <Calendar size={20} className="text-emerald-600" />
                    ) : (
                      <Clock size={20} className="text-emerald-600" />
                    )}
                    <ShiftIcon size={18} className={shiftInfo.color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <p className="font-semibold text-slate-800">
                        {time.isRecurring ? time.dayOfWeek : new Date(time.date!).toLocaleDateString()}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${shiftInfo.color} bg-opacity-10`} style={{backgroundColor: `${shiftInfo.color.replace('text-', '').replace('-600', '')}`}}>
                        {shiftInfo.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-slate-600 font-mono">
                        {formatTimeDisplay(time.startTime, time.endTime)}
                      </p>
                      {isOvernightShift && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center">
                          <Moon size={10} className="mr-1" />
                          Overnight
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                <button
                  onClick={() => alert('Edit functionality coming soon!')} // Placeholder for edit
                  className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(time._id)}
                  className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors duration-200"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
