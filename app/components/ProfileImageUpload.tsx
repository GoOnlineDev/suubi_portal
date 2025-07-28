
"use client";

import React from "react";
import { UploadButton } from "@/utils/uploadthing";

interface ProfileImageUploadProps {
  profileImage: string;
  setProfileImage: (url: string) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  profileImage,
  setProfileImage,
}) => {
  return (
    <div className="form-group md:col-span-2">
      <label htmlFor="profileImage" className="block text-sm font-medium mb-1">
        Profile Image
      </label>
      <UploadButton
        endpoint="profileImageUploader"
        onClientUploadComplete={(res) => {
          if (res && res.length > 0) {
            setProfileImage(res[0].url);
            alert("Upload Completed");
          }
        }}
        appearance={{
          button: "btn btn-primary",
        }}
        onUploadError={(error: Error) => {
          alert(`ERROR! ${error.message}`);
        }}
      />
      {profileImage && (
        <div className="mt-4">
          <img src={profileImage} alt="Profile Preview" className="w-32 h-32 object-cover rounded-md mb-2" />
          <button
            type="button"
            onClick={() => setProfileImage("")}
            className="btn btn-danger btn-sm"
          >
            Remove Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
