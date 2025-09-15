"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Loader2, Send } from "lucide-react";

export default function RoomPage() {
  const params = useParams();
  const roomId = params?.roomId as string | undefined;

  const { user, isLoaded, isSignedIn } = useUser();
  const clerkId = user?.id;
  const currentUser = useQuery(api.users.getCurrentUser, { clerkId: clerkId ?? undefined });

  const roomDetails = useQuery(
    api.room.getRoomDetails,
    roomId ? { roomId: roomId as any } : ("skip" as any)
  );

  const messagesPage = useQuery(
    api.messages.listMessages,
    roomId ? { roomId: roomId as any, limit: 50 } : ("skip" as any)
  );

  const typingUsers = useQuery(
    api.typing.getTypingUsers as any,
    roomId ? { roomId: roomId as any, excludeUserId: currentUser?._id } : ("skip" as any)
  );

  const startTyping = useMutation(api.typing.startTyping as any);
  const stopTyping = useMutation(api.typing.stopTyping as any);
  const markAllRead = useMutation(api.messages.markAllMessagesAsRead);
  const sendMessage = useMutation(api.messages.sendMessage);

  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesPage?.messages?.length]);

  useEffect(() => {
    if (roomId && currentUser?._id) {
      markAllRead({ roomId: roomId as any, userId: currentUser._id }).catch(() => {});
    }
  }, [roomId, currentUser?._id, markAllRead]);

  const onChangeText = (value: string) => {
    setText(value);
    if (!roomId || !currentUser?._id) return;
    startTyping({ roomId: roomId as any, userId: currentUser._id }).catch(() => {});
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping({ roomId: roomId as any, userId: currentUser._id }).catch(() => {});
    }, 1500);
  };

  const onSend = async () => {
    const content = text.trim();
    if (!content || !roomId || !currentUser?._id) return;
    try {
      await sendMessage({ roomId: roomId as any, senderId: currentUser._id, content });
      setText("");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      stopTyping({ roomId: roomId as any, userId: currentUser._id }).catch(() => {});
    } catch (e) {
      console.error(e);
    }
  };

  const headerTitle = useMemo(() => {
    if (!roomDetails) return "Conversation";
    const participants = roomDetails.participants;
    if (currentUser?._id && participants.length === 2) {
      const other = participants.find((p) => p.user._id !== currentUser._id);
      if (other) {
        const name = `${other.user.firstName ?? ''} ${other.user.lastName ?? ''}`.trim();
        return name || other.user.email;
      }
    }
    return roomDetails.room.name ?? "Conversation";
  }, [roomDetails, currentUser?._id]);

  const otherIsOnline = useMemo(() => {
    if (!roomDetails || !currentUser?._id) return false;
    const other = roomDetails.participants.find((p) => p.user._id !== currentUser._id);
    return other?.staffProfile?.isAvailable === true;
  }, [roomDetails, currentUser?._id]);

  const typingText = useMemo(() => {
    if (!typingUsers || typingUsers.length === 0) return null;
    const names = typingUsers
      .map((t) => `${t.user.firstName ?? ''} ${t.user.lastName ?? ''}`.trim() || "Someone")
      .filter(Boolean)
      .join(", ");
    return `${names} typing...`;
  }, [typingUsers]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return <div className="py-10 text-center text-slate-600">Please sign in to view messages.</div>;
  }

  if (!roomId) {
    return <div className="py-10 text-center text-slate-600">Invalid room.</div>;
  }

  if (roomDetails === undefined || messagesPage === undefined) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading conversation...
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-160px)]">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${otherIsOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <h1 className="text-base md:text-lg font-semibold text-slate-900 truncate">{headerTitle}</h1>
          </div>
          {typingText && (
            <div className="text-xs text-slate-500 mt-1">{typingText}</div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-scroll-area">
          {messagesPage.messages
            .slice()
            .reverse()
            .map((m) => {
              const mine = currentUser?._id === m.senderId;
              return (
                <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`${mine ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-900"} max-w-[80%] rounded-2xl px-4 py-2`}>
                    <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                    <div className={`mt-1 text-[10px] ${mine ? "text-emerald-50" : "text-slate-500"}`}>
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Type your message..."
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
            />
            <button
              onClick={onSend}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-50"
              disabled={!text.trim()}
            >
              <Send size={16} /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


