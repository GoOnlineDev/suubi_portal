import React from 'react';

const DashboardHeader = () => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
        Welcome to Your Dashboard!
      </h1>
      <p className="text-gray-600 text-base sm:text-lg">
        Manage your profile and availability here.
      </p>
    </div>
  );
};

export default DashboardHeader;
