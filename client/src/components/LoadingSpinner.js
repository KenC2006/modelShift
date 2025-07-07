import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-bg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-theme-text-secondary">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
