"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Bell
} from "lucide-react";

interface DashboardSidebarProps {
  onClose?: () => void;
}

const DashboardSidebar = ({ onClose }: DashboardSidebarProps) => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Availability", href: "/dashboard/availability", icon: Clock },
    { name: "Appointments", href: "/dashboard/appointments", icon: Calendar },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    // Removed non-existent pages: gallery, news, notifications, settings
  ];

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
          {navItems.map((item) => {
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
        </ul>
      </nav>
    </div>
  );
};

export default DashboardSidebar;
