import React from "react";

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#121212] text-white">
      <div className="relative w-16 h-16 border-4 border-t-[#e5b842] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[#b3b3b3] font-mono text-sm tracking-widest animate-pulse uppercase">
        Loading Saloon Queue...
      </p>
    </div>
  );
};
