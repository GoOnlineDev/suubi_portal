"use client";
import { useState } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { Heart, ArrowRight, Menu, X } from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
//import DashboardHeader from "../components/DashboardHeader";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Authenticated>
        {/* Top bar for mobile and larger screens */}
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Image src="/logo.png" alt="Suubi Medical Center" width={32} height={32} />
              </div>
              <span className="text-xl font-bold text-black">
                Suubi Medical Center
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <UserButton afterSignOutUrl="/" />
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X size={24} className="text-gray-600" />
                ) : (
                  <Menu size={24} className="text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay - positioned below header */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg mt-16" onClick={(e) => e.stopPropagation()}>
              <DashboardSidebar onClose={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content area with proper layout */}
        <div className="flex h-[calc(100vh-80px)]">
          {/* Sidebar for larger screens - positioned correctly */}
          <div className="hidden md:block w-64 bg-white shadow-md border-r border-gray-200">
            <div className="h-full overflow-y-auto">
              <DashboardSidebar />
            </div>
          </div>

          {/* Page content area - full width */}
          <div className="flex-1 overflow-y-auto w-full">
            <div className="px-4">
              {/*<DashboardHeader />*/}
              {children}
            </div>
          </div>
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