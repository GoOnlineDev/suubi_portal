"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  Settings, 
  MessageSquare, 
  Image as ImageIcon, 
  Newspaper,
  Clock,
  Shield,
  Bell,
  FileText,
  Users
} from "lucide-react";

interface DashboardSidebarProps {
  onClose?: () => void;
}

const DashboardSidebar = ({ onClose }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const { user } = useUser();
  
  // Get user data to check if admin
  const convexUser = useQuery(api.users.getCurrentUser, user?.id ? { clerkId: user.id } : "skip");
  const userProfileStatus = useQuery(
    api.staffProfiles.getUserProfileStatus,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const isAdmin = userProfileStatus?.profile?.role === "admin" || userProfileStatus?.profile?.role === "superadmin";

  const baseNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Availability", href: "/dashboard/availability", icon: Clock },
    { name: "Appointments", href: "/dashboard/appointments", icon: Calendar },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  ];

  const adminNavItems = [
    { name: "Admin Overview", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Verify Staff", href: "/dashboard/admin/verify-staff", icon: Shield },
    { name: "All Appointments", href: "/dashboard/admin/appointments", icon: Calendar },
    { name: "All Messages", href: "/dashboard/admin/messages", icon: MessageSquare },
  ];

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {baseNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center p-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                      : "text-slate-700 hover:bg-slate-100 hover:text-emerald-600"
                    }`}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
          
          {isAdmin && (
            <>
              <li className="pt-4 pb-2">
                <div className="flex items-center px-3">
                  <Shield size={16} className="mr-2 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Administration</span>
                </div>
              </li>
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`flex items-center p-3 rounded-xl transition-all duration-200
                        ${isActive
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                          : "text-slate-700 hover:bg-slate-100 hover:text-orange-600"
                        }`}
                    >
                      <Icon size={20} className="mr-3" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default DashboardSidebar;
