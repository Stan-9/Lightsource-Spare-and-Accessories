import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-gray-800/40 rounded-2xl overflow-hidden border border-gray-700 animate-pulse">
      <div className="h-48 bg-gray-700/50 w-full" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-5 bg-gray-700/50 rounded-md w-3/4" />
        <div className="h-4 bg-gray-700/50 rounded-md w-1/4" />
        <div className="mt-2 h-6 bg-gray-700/50 rounded-md w-1/3" />
        <div className="mt-4 h-11 bg-gray-700/50 rounded-xl w-full" />
      </div>
    </div>
  );
};

export default SkeletonCard;
