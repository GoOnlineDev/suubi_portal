"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { 
  MessageSquare, 
  User,
  Filter,
  ChevronDown,
  Send,
  X,
  AlertCircle
} from "lucide-react";

export default function AdminMessagesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Get current user data
  const convexUser = useQuery(api.users.getCurrentUser, user?.id ? { clerkId: user.id } : "skip");
  
  // Get all staff rooms (admin only)
  const allStaffRooms = useQuery(
    api.messages.getAllStaffRoomsForAdmin,
    convexUser?._id ? {
      adminUserId: convexUser._id,
      staffProfileId: selectedStaffFilter ? selectedStaffFilter as any : undefined,
      limit: 100,
    } : "skip"
  );

  // Get messages for selected room
  const roomMessages = useQuery(
    api.messages.listMessages,
    selectedRoom ? { roomId: selectedRoom.room._id, limit: 50 } : "skip"
  );

  // Get message statistics
  const messageStats = useQuery(
    api.messages.getMessageStatsForAdmin,
    convexUser?._id ? { adminUserId: convexUser._id } : "skip"
  );

  // Get all staff members for filtering
  const allStaff = useQuery(api.users.listStaffUsers, {});

  // Send message on behalf of staff
  const sendMessageOnBehalfOf = useMutation(api.messages.sendMessageOnBehalfOf);

  const handleSendMessage = async () => {
    if (!convexUser?._id || !selectedRoom || !replyMessage.trim()) return;

    setIsSending(true);
    try {
      await sendMessageOnBehalfOf({
        adminUserId: convexUser._id,
        roomId: selectedRoom.room._id,
        staffUserId: selectedRoom.staffMember._id,
        content: replyMessage,
      });
      setReplyMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message: " + (error as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  if (!convexUser) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Staff Messages</h1>
        <p className="text-gray-600">View and respond to messages on behalf of staff members</p>
      </div>

      {/* Statistics Cards */}
      {messageStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{messageStats.totalRooms}</p>
                <p className="text-gray-600">Total Rooms</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{messageStats.totalMessages}</p>
                <p className="text-gray-600">Total Messages</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{messageStats.unreadMessages}</p>
                <p className="text-gray-600">Unread</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          <Filter className="h-5 w-5" />
          <span>Filters</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Staff Member
            </label>
            <select
              value={selectedStaffFilter || ""}
              onChange={(e) => setSelectedStaffFilter(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Staff</option>
              {allStaff?.map((item) => (
                <option key={item.staffProfile._id} value={item.staffProfile._id}>
                  {item.user.firstName} {item.user.lastName} ({item.staffProfile.role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rooms List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Conversations</h2>
          </div>
          
          <div className="divide-y divide-gray-200 overflow-y-auto max-h-[600px]">
            {allStaffRooms?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">No conversations found</p>
              </div>
            ) : (
              allStaffRooms?.map((room) => (
                <button
                  key={room.room._id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedRoom?.room._id === room.room._id ? 'bg-emerald-50 border-l-4 border-emerald-600' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {room.patient.firstName} {room.patient.lastName}
                        </p>
                        {room.unreadCount > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        Staff: {room.staffMember.firstName} {room.staffMember.lastName}
                      </p>
                      {room.lastMessage && (
                        <p className="text-xs text-gray-500 truncate">
                          {room.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedRoom.patient.firstName} {selectedRoom.patient.lastName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Staff: {selectedRoom.staffMember.firstName} {selectedRoom.staffMember.lastName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Messages */}
              <div className="p-6 h-[400px] overflow-y-auto">
                {roomMessages?.messages.map((message) => {
                  const isStaff = message.senderId === selectedRoom.staffMember._id;
                  return (
                    <div
                      key={message._id}
                      className={`mb-4 flex ${isStaff ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isStaff ? 'order-2' : 'order-1'}`}>
                        <div className={`rounded-lg px-4 py-2 ${
                          isStaff 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isStaff ? 'text-emerald-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> You are responding on behalf of {selectedRoom.staffMember.firstName} {selectedRoom.staffMember.lastName}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !replyMessage.trim()}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full p-8 text-center text-gray-500">
              <div>
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a conversation from the list to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Staff Statistics */}
      {messageStats && messageStats.byStaff.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages by Staff Member</h2>
          <div className="space-y-3">
            {messageStats.byStaff.map((staff) => (
              <div key={staff.staffUserId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{staff.staffName}</p>
                  <p className="text-sm text-gray-600">{staff.roomCount} rooms • {staff.messageCount} messages</p>
                </div>
                {staff.unreadCount > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {staff.unreadCount} unread
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

