import React from 'react';

const DashboardHeader = () => {
  return (
    <div className="bg-white shadow-md p-6 mb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Welcome to Your Dashboard!
      </h1>
      <p className="text-gray-600 text-lg">
        Manage your profile and availability here.
      </p>
    </div>
  );
};

export default DashboardHeader;
