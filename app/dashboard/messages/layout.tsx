"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, MessageSquare } from "lucide-react";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const segments = useSelectedLayoutSegments();
  const hasRoomOpen = segments.length > 0;

  const { user, isLoaded, isSignedIn } = useUser();
  const clerkId = user?.id;
  const currentUser = useQuery(api.users.getCurrentUser, { clerkId: clerkId ?? undefined });

  const rooms = useQuery(
    api.room.listRoomsForUser,
    currentUser?._id ? { userId: currentUser._id } : ("skip" as any)
  );

  const listContent = useMemo(() => {
    if (!isLoaded) {
      return (
        <div className="flex items-center justify-center py-8 text-slate-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
        </div>
      );
    }
    if (!isSignedIn) {
      return <div className="py-8 text-center text-slate-600">Please sign in to view messages.</div>;
    }
    if (!currentUser) {
      return <div className="py-8 text-center text-slate-600">Loading your profile...</div>;
    }
    if (rooms === undefined) {
      return (
        <div className="flex items-center justify-center py-8 text-slate-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading conversations...
        </div>
      );
    }
    if (!rooms || rooms.length === 0) {
      return (
        <div className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
            <MessageSquare size={24} />
          </div>
          <h2 className="text-base font-semibold text-slate-800">No conversations yet</h2>
          <p className="text-sm text-slate-600 mt-1">Start a conversation from an appointment or staff profile.</p>
        </div>
      );
    }

    return (
      <ul className="divide-y divide-slate-200 bg-white rounded-xl shadow-sm border border-slate-200">
        {rooms.map((r) => {
          const title = r.staffProfile
            ? r.staffProfile.specialty
              ? `${r.staffProfile.role} • ${r.staffProfile.specialty}`
              : r.staffProfile.role
            : r.otherUser
            ? `${r.otherUser.firstName ?? ''} ${r.otherUser.lastName ?? ''}`.trim() || r.otherUser.email
            : r.room.name ?? "Conversation";

          const preview = r.lastMessage?.content ?? "No messages yet";
          const ts = r.lastMessage?.createdAt ?? r.room.createdAt;
          const timeStr = new Date(ts).toLocaleString();
          const isOnline = r.staffProfile?.isAvailable === true;
          const avatarUrl = r.otherUser?.imageUrl || r.staffProfile?.profileImage || null;

          return (
            <li key={r.room._id} className="p-3 hover:bg-slate-50 transition">
              <Link href={`/dashboard/messages/${r.room._id}`} className="block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="relative">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-slate-200" />
                      )}
                      {isOnline && (
                        <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{title}</p>
                        {r.unreadCount > 0 && (
                          <span className="ml-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            {r.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5">{preview}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 whitespace-nowrap">{timeStr}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }, [isLoaded, isSignedIn, currentUser, rooms]);

  return (
    <div className="w-full py-4">
      <div className="flex flex-col md:flex-row md:gap-4">
        <aside
          className={`${hasRoomOpen ? "hidden md:block" : "block"} md:w-80 w-full md:h-[calc(100vh-140px)] md:overflow-y-auto`}
        >
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Messages</h1>
          {listContent}
        </aside>
        <section
          className={`${hasRoomOpen ? "block" : "hidden md:block"} flex-1 md:h-[calc(100vh-140px)] md:overflow-y-auto`}
        >
          {children}
        </section>
      </div>
    </div>
  );
}


