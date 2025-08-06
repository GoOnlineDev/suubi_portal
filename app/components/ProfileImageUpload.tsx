
"use client";

import React from "react";
import { UploadButton } from "@/utils/uploadthing";
import { Camera, X, User } from "lucide-react";

interface ProfileImageUploadProps {
  profileImage: string;
  setProfileImage: (url: string) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  profileImage,
  setProfileImage,
}) => {
  return (
    <div className="form-group">
      <label className="flex items-center text-sm font-semibold mb-3 text-slate-700">
        <Camera size={16} className="mr-2 text-emerald-600" />
        Profile Image
      </label>
      
      <div className="space-y-4">
        {/* Current Image Preview */}
        {profileImage && (
          <div className="relative inline-block">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-emerald-500 shadow-lg">
              <img 
                src={profileImage} 
                alt="Profile Preview" 
                className="w-full h-full object-cover" 
              />
            </div>
            <button
              type="button"
              onClick={() => setProfileImage("")}
              className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
              title="Remove Image"
            >
              <X size={12} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* Upload Button and Placeholder */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-auto">
            <UploadButton
              endpoint="profileImageUploader"
              onClientUploadComplete={(res) => {
                if (res && res.length > 0) {
                  setProfileImage(res[0].url);
                  // Show success message
                  const successMessage = document.createElement('div');
                  successMessage.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg z-50 text-sm sm:text-base';
                  successMessage.textContent = 'Profile image uploaded successfully!';
                  document.body.appendChild(successMessage);
                  setTimeout(() => {
                    document.body.removeChild(successMessage);
                  }, 3000);
                }
              }}
              appearance={{
                button: "w-full sm:w-auto group inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base",
                allowedContent: "text-slate-500 text-xs mt-2",
                container: "w-full sm:w-auto",
              }}
              onUploadError={(error: Error) => {
                // Show error message
                const errorMessage = document.createElement('div');
                errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg z-50 text-sm sm:text-base';
                errorMessage.textContent = `Upload failed: ${error.message}`;
                document.body.appendChild(errorMessage);
                setTimeout(() => {
                  document.body.removeChild(errorMessage);
                }, 3000);
              }}
            />
          </div>

          {/* Placeholder when no image */}
          {!profileImage && (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 mx-auto sm:mx-0">
              <div className="text-center">
                <User size={24} className="sm:w-8 sm:h-8 text-slate-400 mx-auto mb-1 sm:mb-2" />
                <p className="text-xs text-slate-500">No image</p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Guidelines */}
        <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Upload Guidelines</h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Maximum file size: 8MB</li>
            <li>• Supported formats: JPG, PNG, GIF</li>
            <li>• Recommended size: 400x400 pixels or larger</li>
            <li>• Use a professional headshot for best results</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileImageUpload;
