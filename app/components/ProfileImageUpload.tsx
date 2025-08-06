
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
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500 shadow-lg">
              <img 
                src={profileImage} 
                alt="Profile Preview" 
                className="w-full h-full object-cover" 
              />
            </div>
            <button
              type="button"
              onClick={() => setProfileImage("")}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
              title="Remove Image"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex items-center space-x-4">
          <UploadButton
            endpoint="profileImageUploader"
            onClientUploadComplete={(res) => {
              if (res && res.length > 0) {
                setProfileImage(res[0].url);
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                successMessage.textContent = 'Profile image uploaded successfully!';
                document.body.appendChild(successMessage);
                setTimeout(() => {
                  document.body.removeChild(successMessage);
                }, 3000);
              }
            }}
            appearance={{
              button: "group inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105",
              allowedContent: "text-slate-500 text-xs mt-2",
              container: "flex items-center",
            }}
            onUploadError={(error: Error) => {
              // Show error message
              const errorMessage = document.createElement('div');
              errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
              errorMessage.textContent = `Upload failed: ${error.message}`;
              document.body.appendChild(errorMessage);
              setTimeout(() => {
                document.body.removeChild(errorMessage);
              }, 3000);
            }}
          />

          {/* Placeholder when no image */}
          {!profileImage && (
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <User size={32} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No image</p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Guidelines */}
        <div className="bg-slate-50 rounded-xl p-4">
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
