import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Calendar, Clock, Trash2, Edit } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

export default function AvailableTimeList() {
  const { user } = useUser();
  const createOrGetUser = useMutation(api.users.createOrGetUser);
  const deleteAvailableTime = useMutation(api.availableTimes.deleteAvailableTime);

  const [convexUserId, setConvexUserId] = React.useState<Doc<"users">["_id"] | null>(null);

  React.useEffect(() => {
    const fetchUserId = async () => {
      if (user) {
        const id = await createOrGetUser();
        setConvexUserId(id);
      }
    };
    fetchUserId();
  }, [user, createOrGetUser]);

  const availableTimes = useQuery(api.availableTimes.getAvailableTimesByUserId, 
    convexUserId ? { userId: convexUserId } : "skip"
  );

  const handleDelete = async (timeId: Doc<"availableTimes">["_id"]) => {
    if (window.confirm("Are you sure you want to delete this time slot?")) {
      try {
        await deleteAvailableTime({ availableTimeId: timeId });
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
          {availableTimes.map((time) => (
            <div key={time._id} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-3">
                {time.isRecurring ? (
                  <Calendar size={20} className="text-emerald-600" />
                ) : (
                  <Clock size={20} className="text-emerald-600" />
                )}
                <div>
                  <p className="font-semibold text-slate-800">
                    {time.isRecurring ? time.dayOfWeek : new Date(time.date!).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-slate-600">
                    {time.startTime} - {time.endTime}
                  </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
